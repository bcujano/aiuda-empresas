import { z } from 'zod'
import { leerCsv } from '@/lib/csv'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizarTelefono } from '@/lib/telefono'

/** Prospectos y campaña de contacto en frío de UNA organización (el panel nunca cruza clientes). */

export type Prospecto = {
  id: string
  nombre: string
  segmento: string | null
  telefono: string | null
  telefono_wa: string | null
  email: string | null
  whatsapp_at: string | null
  email_at: string | null
  respondio_at: string | null
  baja_at: string | null
  error: string | null
}
export type Campana = {
  activa: boolean
  por_dia: number
  plantilla: string
  asunto: string
  cuerpo: string
  dias_correo: number
}

export type EstadoProspecto = 'pendiente' | 'contactado' | 'respondio' | 'baja' | 'sin_canal'

export function estadoDe(p: Prospecto): EstadoProspecto {
  if (p.baja_at) return 'baja'
  if (p.respondio_at) return 'respondio'
  if (!p.telefono_wa && !p.email) return 'sin_canal'
  if (p.whatsapp_at || p.email_at) return 'contactado'
  return 'pendiente'
}

export async function listarProspectos(orgId: string): Promise<Prospecto[]> {
  const { data } = await supabaseAdmin()
    .from('prospectos')
    .select(
      'id, nombre, segmento, telefono, telefono_wa, email, whatsapp_at, email_at, respondio_at, baja_at, error',
    )
    .eq('organizacion_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1000)
  return (data ?? []) as Prospecto[]
}

export async function campanaDe(orgId: string): Promise<Campana | null> {
  const { data } = await supabaseAdmin()
    .from('campanas_frio')
    .select('activa, por_dia, plantilla, asunto, cuerpo, dias_correo')
    .eq('organizacion_id', orgId)
    .maybeSingle()
  return (data as Campana | null) ?? null
}

export const esquemaCampana = z.object({
  activa: z.boolean(),
  por_dia: z.coerce.number().int().min(1, 'Mínimo 1 por día').max(200, 'Máximo 200 por día'),
  plantilla: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9_]{3,60}$/,
      'La plantilla va en minúsculas, sin espacios (ej. contacto_inicial)',
    ),
  asunto: z.string().trim().min(5).max(200),
  cuerpo: z
    .string()
    .trim()
    .min(40, 'El correo es muy corto')
    .max(3000)
    .refine(
      (c) => c.includes('{baja}'),
      'El correo debe llevar {baja}: es el enlace para darse de baja',
    ),
  dias_correo: z.coerce.number().int().min(1).max(30),
})

export async function guardarCampana(
  orgId: string,
  d: z.infer<typeof esquemaCampana>,
): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from('campanas_frio')
    .upsert({ ...d, organizacion_id: orgId, updated_at: new Date().toISOString() })
  return !error
}

/** Una línea por empresa: «Empresa; teléfono; correo; sector». Solo la empresa es obligatoria. */
export function leerLista(texto: string) {
  const filas: {
    nombre: string
    telefono: string | null
    telefono_wa: string | null
    email: string | null
    segmento: string | null
  }[] = []
  for (const linea of texto.split('\n')) {
    const [nombre = '', tel = '', correo = '', segmento = ''] = linea
      .split(/[;\t]/)
      .map((x) => x.trim())
    if (nombre.length < 2) continue
    const movil = normalizarTelefono(tel)
    const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo) ? correo.toLowerCase() : null
    filas.push({
      nombre: nombre.slice(0, 200),
      telefono: tel || null,
      // Solo celulares de Ecuador (+5939…) o números con código de país explícito.
      telefono_wa: movil && (movil.startsWith('+5939') || tel.startsWith('+')) ? movil : null,
      email,
      segmento: segmento || null,
    })
  }
  return filas
}

const sinTildes = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/** Lee el CSV que exporta el Prospector (o cualquiera con columnas de empresa, teléfono, correo…). */
export function leerListaCsv(texto: string) {
  const [cabecera = [], ...filas] = leerCsv(texto)
  const col = (...nombres: string[]) => cabecera.findIndex((h) => nombres.includes(sinTildes(h)))
  const iNombre = col('nombre', 'empresa')
  const iTel = col('telefono')
  const iWa = col('whatsapp')
  const iCorreo = col('emails', 'email', 'correo', 'correos')
  const iSeg = col('segmentos', 'segmento', 'sector')
  const iWeb = col('website', 'web', 'sitio web')
  const iDir = col('direccion')
  if (iNombre < 0) return []
  const dato = (f: string[], i: number) => (i >= 0 ? (f[i] ?? '').trim() : '')
  return filas
    .map((f) => {
      const tel = dato(f, iTel)
      const wa = normalizarTelefono(dato(f, iWa) || tel)
      const esMovil = wa?.startsWith('+5939') || dato(f, iWa).startsWith('+')
      const correo = dato(f, iCorreo)
        .split(/[;, ]+/)
        .find((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
      return {
        nombre: dato(f, iNombre).slice(0, 200),
        telefono: tel || null,
        telefono_wa: wa && esMovil ? wa : null,
        email: correo ? correo.toLowerCase() : null,
        segmento: dato(f, iSeg).split(';')[0]?.trim() || null,
        website: dato(f, iWeb) || null,
        direccion: dato(f, iDir) || null,
      }
    })
    .filter((f) => f.nombre.length >= 2)
}

type FilaNueva = ReturnType<typeof leerListaCsv>[number] & { angulo_codigo?: string | null }

/** Inserta en bloques y sin repetir WhatsApp ni correo que ya existan (nunca fila por fila). */
export async function insertarProspectos(
  orgId: string,
  filas: FilaNueva[],
): Promise<{ nuevos: number; leidos: number }> {
  const db = supabaseAdmin()
  const { data } = await db
    .from('prospectos')
    .select('telefono_wa, email')
    .eq('organizacion_id', orgId)
    .limit(20000)
  const wa = new Set<string>()
  const em = new Set<string>()
  for (const p of (data ?? []) as { telefono_wa: string | null; email: string | null }[]) {
    if (p.telefono_wa) wa.add(p.telefono_wa)
    if (p.email) em.add(p.email.toLowerCase())
  }
  const nuevas: (FilaNueva & { organizacion_id: string })[] = []
  for (const f of filas.slice(0, 3000)) {
    if ((f.telefono_wa && wa.has(f.telefono_wa)) || (f.email && em.has(f.email))) continue
    if (f.telefono_wa) wa.add(f.telefono_wa)
    if (f.email) em.add(f.email)
    nuevas.push({ ...f, organizacion_id: orgId })
  }
  let nuevos = 0
  for (let i = 0; i < nuevas.length; i += 200) {
    const bloque = nuevas.slice(i, i + 200)
    const { error } = await db.from('prospectos').insert(bloque)
    if (!error) nuevos += bloque.length
    await new Promise((r) => setTimeout(r, 150))
  }
  return { nuevos, leidos: filas.length }
}

export async function agregarProspectos(
  orgId: string,
  texto: string,
  anguloCodigo?: string | null,
): Promise<{ nuevos: number; leidos: number }> {
  const filas = (
    texto.includes('\n') && /^[^\n]*(nombre|empresa)[^\n]*(tel|correo|email)/i.test(texto)
      ? leerListaCsv(texto)
      : leerLista(texto).map((f) => ({ ...f, website: null, direccion: null }))
  ).map((f) => ({ ...f, angulo_codigo: anguloCodigo ?? null }))
  return insertarProspectos(orgId, filas)
}

export async function cambiarProspecto(
  orgId: string,
  id: string,
  accion: 'baja' | 'borrar',
): Promise<boolean> {
  const db = supabaseAdmin()
  const q =
    accion === 'borrar'
      ? db.from('prospectos').delete()
      : db.from('prospectos').update({ baja_at: new Date().toISOString() })
  const { error } = await q.eq('id', id).eq('organizacion_id', orgId)
  return !error
}
