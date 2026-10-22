import { z } from 'zod'
import { normalizarTelefono } from '@/lib/telefono'
import { leerReferencia } from '@/lib/whatsapp'
import { type Angulo, COLABORADORES, type Origen } from '@/types/database'

/**
 * Reglas puras de la API del agente (sin base de datos): validan lo que manda
 * n8n y deciden ángulo, origen y ventana. Se prueban sin red.
 */

/** Objeto `referral` de Click-to-WhatsApp, tal como lo entrega Meta. */
const esquemaReferral = z
  .object({
    source_id: z.string().optional(),
    source_type: z.string().optional(),
    source_url: z.string().optional(),
    headline: z.string().optional(),
    ctwa_clid: z.string().optional(),
  })
  .passthrough()

const telefono = z.string().transform((v, ctx) => {
  const normal = normalizarTelefono(v)
  if (!normal) ctx.addIssue({ code: 'custom', message: 'Teléfono inválido' })
  return normal ?? ''
})

/** Identifica la organización por el número que recibió el mensaje. */
const organizacion = z.object({ phone_number_id: z.string().min(1) })

export const esquemaContexto = organizacion.extend({
  telefono,
  texto: z.string().max(4000).optional(),
  referral: esquemaReferral.optional(),
})

/** Etapas que el agente puede poner. Agendar va por su propia herramienta. */
const ETAPAS_AGENTE = ['calificado', 'descartado'] as const

export const esquemaLead = organizacion.extend({
  telefono,
  nombre: z.string().trim().max(120).optional(),
  empresa: z.string().trim().max(160).optional(),
  ruc: z
    .string()
    .trim()
    .regex(/^\d{13}$/, 'El RUC tiene 13 dígitos')
    .optional(),
  cargo: z.string().trim().max(120).optional(),
  colaboradores: z.enum(COLABORADORES).optional(),
  ciudad: z.string().trim().max(80).optional(),
  necesidad: z.string().trim().max(500).optional(),
  urgencia: z.enum(['baja', 'media', 'alta']).optional(),
  encaje: z.number().int().min(0).max(100).optional(),
  etapa: z.enum(ETAPAS_AGENTE).optional(),
  motivo_descarte: z.string().trim().max(300).optional(),
  texto: z.string().max(4000).optional(),
  referral: esquemaReferral.optional(),
  mensaje_entrante: z.string().max(4000).optional(),
  mensaje_agente: z.string().max(4000).optional(),
  // Respuesta escrita a mano por una persona del equipo desde Chatwoot.
  mensaje_persona: z.string().max(4000).optional(),
  autor_persona: z.string().trim().max(120).optional(),
  chatwoot_contacto_id: z.number().int().positive().optional(),
  chatwoot_conversacion_id: z.number().int().positive().optional(),
})

/** Bandeja de Chatwoot de la que salió una respuesta manual. */
export const esquemaCanal = z
  .object({
    chatwoot_cuenta_id: z.coerce.number().int().positive().optional(),
    chatwoot_bandeja_id: z.coerce.number().int().positive().optional(),
    chatwoot_conversacion_id: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => d.chatwoot_cuenta_id || d.chatwoot_bandeja_id, 'Falta la cuenta o la bandeja')

/** El agente pide horas libres para ofrecer. */
export const esquemaDisponibilidad = organizacion.extend({
  telefono,
  fecha: z.preprocess(
    (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : undefined),
    z.string().optional(),
  ),
})

/** El agente reserva (o reprograma) una de las horas que le dio la agenda. */
export const esquemaAgendar = organizacion.extend({
  telefono,
  inicia_at: z.string().datetime({ offset: true }),
  modalidad: z.enum(['virtual', 'presencial']),
})

/** n8n avisa que entregó un recordatorio. */
export const esquemaRecordatorio = z.object({
  cita_id: z.string().uuid(),
  tipo: z.enum(['24h', '2h']),
})

/** n8n avisa cómo le fue con un seguimiento. */
export const esquemaSeguimiento = z.object({
  id: z.string().uuid(),
  ok: z.boolean(),
  error: z.string().max(500).optional(),
})

export type DatosLeadAgente = z.infer<typeof esquemaLead>

/**
 * ¿De qué ángulo viene el lead? Primero el anuncio (referral.source_id en los
 * meta_ad_ids del ángulo), luego la referencia del mensaje (Ref. FAG-TRI).
 * Si no hay pista, null: nunca se adivina.
 */
export function resolverAngulo(
  angulos: Pick<Angulo, 'id' | 'codigo' | 'meta_ad_ids'>[],
  codigoOrg: string,
  pistas: { texto?: string; referral?: { source_id?: string } },
): string | null {
  const anuncio = pistas.referral?.source_id
  if (anuncio) {
    const porAnuncio = angulos.find((a) => a.meta_ad_ids.includes(anuncio))
    if (porAnuncio) return porAnuncio.id
  }
  const ref = pistas.texto ? leerReferencia(pistas.texto) : null
  if (ref && ref.org === codigoOrg) {
    return angulos.find((a) => a.codigo === ref.angulo)?.id ?? null
  }
  return null
}

/** Origen y ventana gratis según cómo llegó el primer mensaje. */
export function origenDeEntrada(pistas: { texto?: string; referral?: object }): {
  origen: Origen
  ventana_horas: 24 | 72
} {
  if (pistas.referral) return { origen: 'anuncio_whatsapp', ventana_horas: 72 }
  if (pistas.texto && leerReferencia(pistas.texto)) return { origen: 'landing', ventana_horas: 24 }
  return { origen: 'whatsapp_directo', ventana_horas: 24 }
}

/** Medianoche de hoy en Quito (UTC-5 fijo, sin horario de verano). */
export function inicioDelDiaQuito(ahora: Date): Date {
  const quito = new Date(ahora.getTime() - 5 * 3600_000)
  return new Date(
    Date.UTC(quito.getUTCFullYear(), quito.getUTCMonth(), quito.getUTCDate(), 5, 0, 0),
  )
}

/** Mensajes al día por persona a partir de los cuales el agente deja de responder. */
export const TOPE_MENSAJES_DIA = 40

/** Comparación en tiempo constante del secreto de n8n. */
export function secretoValido(recibido: string | null, esperado: string): boolean {
  if (!recibido || recibido.length !== esperado.length) return false
  let diferencia = 0
  for (let i = 0; i < esperado.length; i++) {
    diferencia |= recibido.charCodeAt(i) ^ esperado.charCodeAt(i)
  }
  return diferencia === 0
}

/**
 * Mensajes que escribe una máquina, no una persona: saludos y avisos automáticos de WhatsApp Business,
 * menús y formularios de otros bots. Se detectan por frases propias de ellos (no por «gracias por escribir»,
 * que también dice una persona).
 */
const AUTOMATICO =
  /\b(te saluda|le saluda|nos contactaremos|nos comunicaremos|en breve (nos|me|le)|horario de atenci[oó]n|fuera de (nuestro )?horario|mensaje autom[aá]tico|respuesta autom[aá]tica|no pudo ser procesado|marque (1|uno|2|dos)|digite|n[uú]mero de c[eé]dula|pol[ií]tica de protecci[oó]n|bit\.ly|asistente virtual|gracias por (comunicarte|comunicarse|contactarte|contactarnos) con|en unos minutos (te|le|nos) (respondemos|responderemos|atendemos|atenderemos)|nuestras redes sociales|linktr\.ee)/i

export function esRespuestaAutomatica(texto: string | undefined): boolean {
  return !!texto && AUTOMATICO.test(texto)
}

const normal = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/** ¿El mensaje repite lo que le escribió el agente? Un bot que devuelve nuestro texto no es una persona. */
export function esEco(texto: string | undefined, ultimoDelAgente: string | undefined): boolean {
  if (!texto || !ultimoDelAgente) return false
  const a = normal(ultimoDelAgente)
  return a.length >= 20 && normal(texto).includes(a)
}
