import { z } from 'zod'
import { fechaHora } from '@/lib/formato'
import { pideBaja } from '@/lib/seguimientos'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Organizacion } from '@/types/database'
import type { LineaHistorial } from './agente-historial'
import { esEco, esRespuestaAutomatica } from './agente-reglas'
import { rellenarCorreo } from './contacto-frio'

/** Contacto en frío, lado de las respuestas: quién contestó, la baja y el registro en Chatwoot. */

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

/** Texto con que salió la plantilla de WhatsApp a esa empresa (para que el agente sepa qué se le dijo). */
export async function textoContactoFrio(orgId: string, empresa: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from('campanas_frio')
    .select('texto_wa')
    .eq('organizacion_id', orgId)
    .maybeSingle()
  const t = (data as { texto_wa: string | null } | null)?.texto_wa
  if (!t) return null
  return t.replace('{1}', `equipo de ${empresa}`).replace('{2}', empresa)
}

/**
 * Qué cambia en la conversación cuando quien escribe estaba en la lista de contacto en frío.
 * - Un saludo automático no cuenta como respuesta; un bot que repite nuestro texto se da de baja.
 * - Lo que se le dijo en la plantilla pasa a ser el primer mensaje, para que el agente no arranque «de cero».
 */
export async function contactoEnFrio(
  orgId: string,
  entrada: { telefono: string; texto?: string },
  historial: LineaHistorial[],
) {
  const eco = esEco(entrada.texto, [...historial].reverse().find((l) => l.rol === 'agente')?.texto)
  const automatica = esRespuestaAutomatica(entrada.texto) || eco
  const previo =
    automatica && !eco
      ? null
      : await prospectoRespondio(orgId, entrada.telefono, eco || pideBaja(entrada.texto))
  const conPlantilla: LineaHistorial[] =
    previo && !historial.some((l) => l.rol === 'agente')
      ? [
          {
            rol: 'agente',
            texto:
              (await textoContactoFrio(orgId, previo.nombre)) ??
              'Le escribimos para ofrecerle una breve reunión.',
          },
          ...historial,
        ]
      : historial
  return { previo, historial: conPlantilla, automatica }
}
