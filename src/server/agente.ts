import { supabaseAdmin } from '@/lib/supabase/admin'
import { ventanaAbierta } from '@/lib/whatsapp'
import type { Angulo, Lead, Organizacion } from '@/types/database'
import { type DatosLeadAgente, origenDeEntrada, resolverAngulo } from './agente-reglas'

/**
 * Lo que el agente de n8n lee y escribe en el CRM. Todo se ancla a la
 * organización dueña del número que recibió el mensaje (phone_number_id):
 * el agente nunca elige la organización.
 */

async function organizacionPorNumero(phoneNumberId: string): Promise<Organizacion | null> {
  const { data } = await supabaseAdmin()
    .from('organizaciones')
    .select('*')
    .eq('wa_phone_number_id', phoneNumberId)
    .maybeSingle()
  const org = data as Organizacion | null
  // Un cliente suspendido no tiene agente.
  return org && org.estado_plan !== 'suspendido' ? org : null
}

async function angulosActivos(orgId: string): Promise<Angulo[]> {
  const { data } = await supabaseAdmin()
    .from('angulos')
    .select('*')
    .eq('organizacion_id', orgId)
    .eq('activo', true)
    .order('orden', { ascending: true })
  return (data ?? []) as Angulo[]
}

async function leadPorTelefono(orgId: string, telefono: string): Promise<Lead | null> {
  const { data } = await supabaseAdmin()
    .from('leads')
    .select('*')
    .eq('organizacion_id', orgId)
    .eq('telefono', telefono)
    .maybeSingle()
  return (data as Lead | null) ?? null
}

export type Contexto = {
  organizacion: { nombre: string; especialista: string; ciudad: string | null; codigo: string }
  servicios: { codigo: string; servicio: string; para_quien: string[]; no_para_quien: string[] }[]
  conocimiento: Record<string, unknown>
  angulo_detectado: string | null
  lead: Pick<
    Lead,
    | 'nombre'
    | 'empresa'
    | 'cargo'
    | 'colaboradores'
    | 'necesidad'
    | 'urgencia'
    | 'etapa'
    | 'chatwoot_contacto_id'
    | 'chatwoot_conversacion_id'
  > | null
  ventana_abierta: boolean
  /** Dónde se copia la conversación para el equipo humano (null si no tiene Chatwoot). */
  canal: { chatwoot_cuenta_id: number; chatwoot_bandeja_id: number } | null
}

export async function contextoAgente(entrada: {
  phone_number_id: string
  telefono: string
  texto?: string
  referral?: { source_id?: string }
}): Promise<Contexto | null> {
  const org = await organizacionPorNumero(entrada.phone_number_id)
  if (!org) return null
  const db = supabaseAdmin()
  const [angulos, lead, conocimiento] = await Promise.all([
    angulosActivos(org.id),
    leadPorTelefono(org.id, entrada.telefono),
    db.from('conocimiento').select('datos').eq('organizacion_id', org.id).maybeSingle(),
  ])
  const detectado = resolverAngulo(angulos, org.codigo, entrada) ?? lead?.angulo_id ?? null
  const angulo = angulos.find((a) => a.id === detectado)

  return {
    organizacion: {
      nombre: org.nombre,
      especialista: org.especialista,
      ciudad: org.ciudad,
      codigo: org.codigo,
    },
    servicios: angulos.map((a) => ({
      codigo: a.codigo,
      servicio: a.servicio,
      para_quien: a.para_quien,
      no_para_quien: a.no_para_quien,
    })),
    conocimiento: (conocimiento.data?.datos as Record<string, unknown> | undefined) ?? {},
    angulo_detectado: angulo?.codigo ?? null,
    lead: lead
      ? {
          nombre: lead.nombre,
          empresa: lead.empresa,
          cargo: lead.cargo,
          colaboradores: lead.colaboradores,
          necesidad: lead.necesidad,
          urgencia: lead.urgencia,
          etapa: lead.etapa,
          chatwoot_contacto_id: lead.chatwoot_contacto_id,
          chatwoot_conversacion_id: lead.chatwoot_conversacion_id,
        }
      : null,
    // Si escribe ahora, la ventana está abierta; si no hay lead aún, también.
    ventana_abierta: lead ? ventanaAbierta(lead.ultimo_inbound_at, lead.ventana_horas) : true,
    canal:
      org.chatwoot_cuenta_id && org.chatwoot_bandeja_id
        ? {
            chatwoot_cuenta_id: org.chatwoot_cuenta_id,
            chatwoot_bandeja_id: org.chatwoot_bandeja_id,
          }
        : null,
  }
}

/** Campos del lead que el agente puede llenar. Nunca borra lo que ya hay. */
const CAMPOS = [
  'nombre',
  'empresa',
  'ruc',
  'cargo',
  'colaboradores',
  'ciudad',
  'necesidad',
  'urgencia',
  'encaje',
  'chatwoot_contacto_id',
  'chatwoot_conversacion_id',
] as const

export async function registrarDesdeAgente(
  datos: DatosLeadAgente,
): Promise<{ ok: true; lead_id: string; etapa: string } | { ok: false; error: string }> {
  const org = await organizacionPorNumero(datos.phone_number_id)
  if (!org) return { ok: false, error: 'ORGANIZACION_DESCONOCIDA' }
  const db = supabaseAdmin()
  const existente = await leadPorTelefono(org.id, datos.telefono)
  const ahora = new Date().toISOString()

  const cambios: Record<string, unknown> = {}
  for (const campo of CAMPOS) {
    if (datos[campo] !== undefined) cambios[campo] = datos[campo]
  }
  if (datos.mensaje_entrante) cambios.ultimo_inbound_at = ahora

  // El agente solo avanza desde «nuevo»: no deshace lo que hizo una persona.
  if (datos.etapa && (!existente || existente.etapa === 'nuevo')) {
    if (datos.etapa === 'descartado' && !datos.motivo_descarte) {
      return { ok: false, error: 'FALTA_MOTIVO_DESCARTE' }
    }
    cambios.etapa = datos.etapa
    cambios.motivo_descarte = datos.etapa === 'descartado' ? datos.motivo_descarte : null
  }

  let leadId: string
  let etapa: string
  if (existente) {
    if (!existente.angulo_id) {
      const angulo = resolverAngulo(await angulosActivos(org.id), org.codigo, datos)
      if (angulo) cambios.angulo_id = angulo
    }
    const { error } = await db.from('leads').update(cambios).eq('id', existente.id)
    if (error) return { ok: false, error: 'NO_SE_PUDO_GUARDAR' }
    leadId = existente.id
    etapa = (cambios.etapa as string | undefined) ?? existente.etapa
  } else {
    const { origen, ventana_horas } = origenDeEntrada(datos)
    const angulo = resolverAngulo(await angulosActivos(org.id), org.codigo, datos)
    const { data, error } = await db
      .from('leads')
      .insert({
        ...cambios,
        organizacion_id: org.id,
        telefono: datos.telefono,
        origen,
        ventana_horas,
        angulo_id: angulo,
        referral: datos.referral ?? null,
        meta_ad_id: datos.referral?.source_id ?? null,
        ultimo_inbound_at: ahora,
      })
      .select('id, etapa')
      .single()
    if (error || !data) return { ok: false, error: 'NO_SE_PUDO_GUARDAR' }
    leadId = (data as { id: string }).id
    etapa = (data as { etapa: string }).etapa
  }

  const actividad = [
    datos.mensaje_entrante && { tipo: 'mensaje_entrante', contenido: datos.mensaje_entrante },
    datos.mensaje_persona && {
      tipo: 'mensaje_persona',
      contenido: datos.mensaje_persona,
      autor: datos.autor_persona ?? 'Equipo',
    },
    datos.mensaje_agente && {
      tipo: 'mensaje_agente',
      contenido: datos.mensaje_agente,
      autor: 'Agente',
    },
    cambios.etapa && {
      tipo: 'cambio_etapa',
      contenido:
        cambios.etapa === 'descartado'
          ? `Descartado por el agente: ${datos.motivo_descarte}`
          : `El agente lo marcó como ${cambios.etapa}`,
      autor: 'Agente',
    },
  ].filter(Boolean) as { tipo: string; contenido: string; autor?: string }[]
  if (actividad.length > 0) {
    await db
      .from('actividad')
      .insert(actividad.map((a) => ({ ...a, organizacion_id: org.id, lead_id: leadId })))
  }
  return { ok: true, lead_id: leadId, etapa }
}

/**
 * Canal de un mensaje que llega por Chatwoot: qué número de WhatsApp tiene ese
 * cliente y a qué teléfono va esa conversación. Cada cliente tiene su propia
 * cuenta de Chatwoot, así que la cuenta basta para saber quién es; la bandeja
 * se acepta como alternativa.
 */
export async function canalPorChatwoot(entrada: {
  chatwoot_cuenta_id?: number
  chatwoot_bandeja_id?: number
  chatwoot_conversacion_id?: number
}): Promise<{ phone_number_id: string; telefono: string | null } | null> {
  const db = supabaseAdmin()
  let consulta = db.from('organizaciones').select('id, wa_phone_number_id, estado_plan')
  consulta = entrada.chatwoot_cuenta_id
    ? consulta.eq('chatwoot_cuenta_id', entrada.chatwoot_cuenta_id)
    : consulta.eq('chatwoot_bandeja_id', entrada.chatwoot_bandeja_id ?? 0)
  const { data } = await consulta.maybeSingle()
  const org = data as { id: string; wa_phone_number_id: string | null; estado_plan: string } | null
  if (!org?.wa_phone_number_id || org.estado_plan === 'suspendido') return null

  let telefono: string | null = null
  if (entrada.chatwoot_conversacion_id) {
    const { data: lead } = await db
      .from('leads')
      .select('telefono')
      .eq('organizacion_id', org.id)
      .eq('chatwoot_conversacion_id', entrada.chatwoot_conversacion_id)
      .maybeSingle()
    telefono = (lead as { telefono: string } | null)?.telefono ?? null
  }
  return { phone_number_id: org.wa_phone_number_id, telefono }
}
