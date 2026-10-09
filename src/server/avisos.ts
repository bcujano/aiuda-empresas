import { env } from '@/lib/env'

/**
 * Avisos que salen del CRM hacia n8n (correo y WhatsApp al equipo del cliente,
 * mensajes al lead). El CRM decide qué pasó; n8n solo entrega. Si n8n no
 * responde, la cita igual queda guardada: el aviso nunca bloquea la agenda.
 */

const URL_AVISOS =
  process.env.N8N_AVISOS_URL ??
  'https://primary-production-ed243.up.railway.app/webhook/aiuda-empresas-avisos'

export const URL_APP = process.env.URL_APP ?? 'https://aiuda-empresas.vercel.app'

export type EventoCita =
  | 'cita_nueva'
  | 'cita_reprogramada_cliente'
  | 'cita_confirmada'
  | 'cita_movida_equipo'
  | 'cita_cancelada_equipo'

export async function enviarAviso(evento: EventoCita, datos: object): Promise<boolean> {
  try {
    const respuesta = await fetch(URL_AVISOS, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-agente-secreto': env().AGENTE_SECRETO },
      body: JSON.stringify({ evento, ...datos }),
      signal: AbortSignal.timeout(8000),
    })
    return respuesta.ok
  } catch {
    return false
  }
}
