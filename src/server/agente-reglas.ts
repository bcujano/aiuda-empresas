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
})

/** Bandeja de Chatwoot de la que salió una respuesta manual. */
export const esquemaCanal = z.object({ chatwoot_bandeja_id: z.coerce.number().int().positive() })

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

/** Comparación en tiempo constante del secreto de n8n. */
export function secretoValido(recibido: string | null, esperado: string): boolean {
  if (!recibido || recibido.length !== esperado.length) return false
  let diferencia = 0
  for (let i = 0; i < esperado.length; i++) {
    diferencia |= recibido.charCodeAt(i) ^ esperado.charCodeAt(i)
  }
  return diferencia === 0
}
