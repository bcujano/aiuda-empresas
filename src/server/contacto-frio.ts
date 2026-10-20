import { z } from 'zod'
import { fechaHora } from '@/lib/formato'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { enlaceWhatsApp, referencia } from '@/lib/whatsapp'
import type { Organizacion } from '@/types/database'
import { inicioDelDiaQuito } from './agente-reglas'
import { URL_APP } from './avisos'

/**
 * Contacto en frío: el CRM decide a quién se escribe, por qué canal y con qué
 * texto; n8n solo entrega, en tandas de pocos mensajes cada 20 minutos para no enviar todo de golpe. Reglas: lunes a viernes de 09:00 a 17:00 (Quito),
 * máximo `por_dia` por canal, nunca a quien pidió la baja o ya respondió, y el
 * correo solo a quien no tiene WhatsApp o no respondió pasados `dias_correo`.
 */

const POR_TANDA = 3
const HORA_DESDE = 9
const HORA_HASTA = 17

type Campana = {
  organizacion_id: string
  por_dia: number
  plantilla: string
  asunto: string
  cuerpo: string
  dias_correo: number
}
type Prospecto = {
  id: string
  nombre: string
  segmento: string | null
  angulo_codigo: string | null
  telefono_wa: string | null
  email: string | null
  token: string
  whatsapp_at: string | null
  email_at: string | null
}

/** Quito es UTC-5 fijo: lunes a viernes, de 09:00 a 16:59. */
export function enHorarioDeContacto(ahora: Date): boolean {
  const quito = new Date(ahora.getTime() - 5 * 3_600_000)
  const dia = quito.getUTCDay()
  const hora = quito.getUTCHours()
  return dia >= 1 && dia <= 5 && hora >= HORA_DESDE && hora < HORA_HASTA
}

export function rellenarCorreo(texto: string, v: Record<string, string>): string {
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '')
}

export async function prospectosPorEnviar(ahora: Date = new Date()): Promise<unknown[]> {
  if (!enHorarioDeContacto(ahora)) return []
  const db = supabaseAdmin()
  const { data: campanas } = await db.from('campanas_frio').select('*').eq('activa', true)
  const salida: unknown[] = []
  for (const c of (campanas ?? []) as Campana[]) {
    const { data: o } = await db
      .from('organizaciones')
      .select('*')
      .eq('id', c.organizacion_id)
      .single()
    const org = o as Organizacion | null
    if (!org || org.estado_plan === 'suspendido') continue
    const hoy = inicioDelDiaQuito(ahora).toISOString()
    const enviadosHoy = async (col: 'whatsapp_at' | 'email_at') => {
      const { count } = await db
        .from('prospectos')
        .select('id', { count: 'exact', head: true })
        .eq('organizacion_id', org.id)
        .gte(col, hoy)
      return count ?? 0
    }
    const wa = await enviadosHoy('whatsapp_at')
    const em = await enviadosHoy('email_at')
    const base = () =>
      db
        .from('prospectos')
        .select('*')
        .eq('organizacion_id', org.id)
        .is('baja_at', null)
        .is('respondio_at', null)
        .order('created_at')
    const cupoWa = Math.min(POR_TANDA, c.por_dia - wa)
    if (cupoWa > 0 && org.wa_phone_number_id) {
      const { data } = await base()
        .not('telefono_wa', 'is', null)
        .is('whatsapp_at', null)
        .limit(cupoWa)
      for (const p of (data ?? []) as Prospecto[]) {
        salida.push({
          id: p.id,
          canal: 'whatsapp',
          phone_number_id: org.wa_phone_number_id,
          to: (p.telefono_wa ?? '').replace(/\D/g, ''),
          plantilla: `${org.prefijo_plantillas ?? ''}${c.plantilla}`,
          parametros: [`equipo de ${p.nombre}`.slice(0, 60), p.nombre.slice(0, 60)],
        })
      }
    }
    const cupoEm = Math.min(POR_TANDA, c.por_dia - em)
    if (cupoEm > 0) {
      const espera = new Date(ahora.getTime() - c.dias_correo * 86_400_000).toISOString()
      const { data } = await base()
        .not('email', 'is', null)
        .is('email_at', null)
        .or(`telefono_wa.is.null,whatsapp_at.lte.${espera}`)
        .limit(cupoEm)
      for (const p of (data ?? []) as Prospecto[]) {
        const ref = referencia(org.codigo, p.angulo_codigo ?? 'GEN')
        const v = {
          empresa: p.nombre,
          segmento: p.segmento ?? 'su sector',
          organizacion: org.nombre,
          enlace: org.wa_numero
            ? enlaceWhatsApp(org.wa_numero, `Hola, vi su correo y me interesa una reunión.`, ref)
            : '',
          baja: `${URL_APP}/baja/${p.token}`,
        }
        salida.push({
          id: p.id,
          canal: 'email',
          remitente: org.nombre,
          to: p.email,
          asunto: rellenarCorreo(c.asunto, v),
          cuerpo: rellenarCorreo(c.cuerpo, v),
        })
      }
    }
  }
  return salida
}

export const esquemaResultadoFrio = z.object({
  id: z.string().uuid(),
  canal: z.enum(['whatsapp', 'email']),
  ok: z.boolean(),
  error: z.string().max(500).optional(),
})

/** n8n avisa cómo le fue. Un fallo se anota y no se reintenta: así no se insiste a un número malo. */
export async function marcarProspecto(d: z.infer<typeof esquemaResultadoFrio>): Promise<boolean> {
  const col = d.canal === 'whatsapp' ? 'whatsapp_at' : 'email_at'
  const { data } = await supabaseAdmin()
    .from('prospectos')
    .update({ [col]: new Date().toISOString(), error: d.ok ? null : (d.error ?? 'FALLO') })
    .eq('id', d.id)
    .is(col, null)
    .select('id')
    .maybeSingle()
  return Boolean(data)
}

/** La persona respondió o pidió la baja desde WhatsApp: se detiene todo contacto. */
export async function prospectoRespondio(
  orgId: string,
  telefono: string,
  baja: boolean,
): Promise<{ nombre: string; segmento: string | null } | null> {
  const db = supabaseAdmin()
  const ahora = new Date().toISOString()
  const { data } = await db
    .from('prospectos')
    .update(baja ? { baja_at: ahora, respondio_at: ahora } : { respondio_at: ahora })
    .eq('organizacion_id', orgId)
    .eq('telefono_wa', telefono.startsWith('+') ? telefono : `+${telefono}`)
    .select('nombre, segmento')
    .maybeSingle()
  return (data as { nombre: string; segmento: string | null } | null) ?? null
}

export async function darDeBajaPorToken(token: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false
  const { data } = await supabaseAdmin()
    .from('prospectos')
    .update({ baja_at: new Date().toISOString() })
    .eq('token', token)
    .select('id')
    .maybeSingle()
  return Boolean(data)
}

/**
 * WhatsApp ya enviados que aún no están en Chatwoot (los de hoy y los anteriores).
 * n8n crea el contacto y una conversación pendiente con una nota privada: la nota nunca sale al cliente.
 */
export async function registrosPorHacer(limite = 5): Promise<unknown[]> {
  const db = supabaseAdmin()
  const { data } = await db
    .from('prospectos')
    .select('id, organizacion_id, nombre, telefono_wa, whatsapp_at')
    .not('whatsapp_at', 'is', null)
    .is('error', null)
    .is('chatwoot_at', null)
    .is('respondio_at', null)
    .not('telefono_wa', 'is', null)
    .order('whatsapp_at')
    .limit(limite)
  const salida: unknown[] = []
  for (const p of (data ?? []) as {
    id: string
    organizacion_id: string
    nombre: string
    telefono_wa: string
    whatsapp_at: string
  }[]) {
    const [{ data: o }, { data: c }] = await Promise.all([
      db.from('organizaciones').select('*').eq('id', p.organizacion_id).single(),
      db
        .from('campanas_frio')
        .select('plantilla, texto_wa')
        .eq('organizacion_id', p.organizacion_id)
        .maybeSingle(),
    ])
    const org = o as Organizacion | null
    if (!org?.chatwoot_cuenta_id || !org.wa_numero) continue
    const camp = c as { plantilla: string; texto_wa: string | null } | null
    const texto = camp?.texto_wa
      ? rellenarCorreo(
          camp.texto_wa.replace(/\{(\d)\}/g, (_, n: string) => `{p${n}}`),
          {
            p1: `equipo de ${p.nombre}`,
            p2: p.nombre,
          },
        )
      : `Plantilla ${org.prefijo_plantillas ?? ''}${camp?.plantilla ?? ''}`
    salida.push({
      id: p.id,
      cuenta: org.chatwoot_cuenta_id,
      nombre: p.nombre,
      to: p.telefono_wa.replace(/\D/g, ''),
      wa_numero: org.wa_numero.replace(/\D/g, ''),
      nota: `Contacto en frío enviado por WhatsApp (plantilla) el ${fechaHora(p.whatsapp_at)}:\n\n${texto}\n\nSi la persona responde, el agente le contesta. Para atenderla usted, asigne la conversación a una persona o ponga la etiqueta «humano»: el agente se detiene.`,
    })
  }
  return salida
}

export const esquemaRegistroFrio = z.object({
  id: z.string().uuid(),
  ok: z.boolean(),
  conversacion_id: z.coerce.number().int().positive().optional(),
})

export async function marcarRegistro(d: z.infer<typeof esquemaRegistroFrio>): Promise<boolean> {
  if (!d.ok) return false
  const { data } = await supabaseAdmin()
    .from('prospectos')
    .update({
      chatwoot_at: new Date().toISOString(),
      chatwoot_conversacion_id: d.conversacion_id ?? null,
    })
    .eq('id', d.id)
    .is('chatwoot_at', null)
    .select('id')
    .maybeSingle()
  return Boolean(data)
}
