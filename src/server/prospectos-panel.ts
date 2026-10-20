import { z } from 'zod'
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

export async function agregarProspectos(
  orgId: string,
  texto: string,
): Promise<{ nuevos: number; leidos: number }> {
  const filas = leerLista(texto).slice(0, 500)
  const db = supabaseAdmin()
  let nuevos = 0
  for (const f of filas) {
    const { error } = await db.from('prospectos').insert({ ...f, organizacion_id: orgId })
    if (!error) nuevos++
  }
  return { nuevos, leidos: filas.length }
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
