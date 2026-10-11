import { horaDeEnviar, type Paso, pideBaja, rellenar, ventanaLibre } from '@/lib/seguimientos'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Lead, Organizacion } from '@/types/database'

/**
 * Seguimiento automático por WhatsApp. El CRM decide qué se manda y cuándo;
 * n8n solo entrega. Nunca se escribe a quien pidió la baja, a quien ya agendó
 * o fue descartado, ni fuera de 08:00–20:00. Fuera de la ventana gratis solo
 * sale con plantilla aprobada por Meta; si no hay, se marca «sin ventana».
 */

type CodigoSecuencia = 'sin_respuesta' | 'calificado_sin_cita' | 'no_asistio'
const CERRADAS = ['agendado', 'asistio', 'cliente', 'descartado']

export async function cancelarSeguimientos(orgId: string, leadId: string): Promise<void> {
  await supabaseAdmin()
    .from('seguimientos')
    .update({ estado: 'cancelado' })
    .eq('organizacion_id', orgId)
    .eq('lead_id', leadId)
    .eq('estado', 'pendiente')
}

export async function programarSecuencia(
  orgId: string,
  leadId: string,
  codigo: CodigoSecuencia,
  desde: Date = new Date(),
): Promise<void> {
  const db = supabaseAdmin()
  await cancelarSeguimientos(orgId, leadId)
  const [{ data: lead }, { data: secuencia }] = await Promise.all([
    db.from('leads').select('no_contactar').eq('id', leadId).eq('organizacion_id', orgId).single(),
    db
      .from('secuencias')
      .select('pasos, activa')
      .eq('organizacion_id', orgId)
      .eq('codigo', codigo)
      .maybeSingle(),
  ])
  if (!lead || (lead as { no_contactar: boolean }).no_contactar) return
  const s = secuencia as { pasos: Paso[]; activa: boolean } | null
  if (!s?.activa || !s.pasos.length) return
  await db.from('seguimientos').insert(
    s.pasos.map((p, i) => ({
      organizacion_id: orgId,
      lead_id: leadId,
      secuencia: codigo,
      paso: i + 1,
      programado_at: new Date(desde.getTime() + p.minutos * 60_000).toISOString(),
      texto: p.texto,
      plantilla: p.plantilla,
    })),
  )
}

/** Después de cada turno del agente o de una persona: cancela, da de baja o programa. */
export async function despuesDeTurno(
  orgId: string,
  leadId: string,
  turno: {
    entrante?: string
    agente?: string
    persona?: string
    etapa: string
    tieneCita: boolean
  },
): Promise<void> {
  if (turno.persona) return cancelarSeguimientos(orgId, leadId)
  if (pideBaja(turno.entrante)) {
    await supabaseAdmin()
      .from('leads')
      .update({ no_contactar: true })
      .eq('id', leadId)
      .eq('organizacion_id', orgId)
    return cancelarSeguimientos(orgId, leadId)
  }
  if (!turno.agente) return cancelarSeguimientos(orgId, leadId)
  if (turno.etapa === 'nuevo') return programarSecuencia(orgId, leadId, 'sin_respuesta')
  if (turno.etapa === 'calificado' && !turno.tieneCita) {
    return programarSecuencia(orgId, leadId, 'calificado_sin_cita')
  }
  return cancelarSeguimientos(orgId, leadId)
}

type Fila = {
  id: string
  organizacion_id: string
  lead_id: string
  texto: string
  plantilla: string | null
}

/** Envíos que tocan ahora, ya decididos: por Chatwoot (ventana abierta) o con plantilla. */
export async function seguimientosPorEnviar(limite = 30) {
  if (!horaDeEnviar(new Date())) return []
  const db = supabaseAdmin()
  const { data } = await db
    .from('seguimientos')
    .select('id, organizacion_id, lead_id, texto, plantilla')
    .eq('estado', 'pendiente')
    .lte('programado_at', new Date().toISOString())
    .order('programado_at', { ascending: true })
    .limit(limite)
  const salida: Record<string, unknown>[] = []
  for (const f of (data ?? []) as Fila[]) {
    const [{ data: l }, { data: o }] = await Promise.all([
      db
        .from('leads')
        .select('*')
        .eq('id', f.lead_id)
        .eq('organizacion_id', f.organizacion_id)
        .single(),
      db.from('organizaciones').select('*').eq('id', f.organizacion_id).single(),
    ])
    const lead = l as Lead | null
    const org = o as Organizacion | null
    if (
      !lead ||
      !org ||
      org.estado_plan === 'suspendido' ||
      lead.no_contactar ||
      CERRADAS.includes(lead.etapa)
    ) {
      await db.from('seguimientos').update({ estado: 'cancelado' }).eq('id', f.id)
      continue
    }
    const { data: angulo } = lead.angulo_id
      ? await db.from('angulos').select('servicio').eq('id', lead.angulo_id).maybeSingle()
      : { data: null }
    const servicio = (
      (angulo as { servicio: string } | null)?.servicio ?? 'nuestros servicios'
    ).toLowerCase()
    const v = {
      nombre: lead.nombre?.split(' ')[0],
      organizacion: org.nombre,
      especialista: org.especialista,
      servicio,
    }
    const texto = rellenar(f.texto, v)
    if (
      ventanaLibre(lead.ultimo_inbound_at, lead.ventana_horas, new Date()) &&
      org.chatwoot_cuenta_id &&
      lead.chatwoot_conversacion_id
    ) {
      salida.push({
        id: f.id,
        canal: 'chatwoot',
        cuenta: org.chatwoot_cuenta_id,
        conversacion_id: lead.chatwoot_conversacion_id,
        texto,
      })
    } else if (f.plantilla && org.wa_phone_number_id) {
      salida.push({
        id: f.id,
        canal: 'whatsapp',
        phone_number_id: org.wa_phone_number_id,
        to: lead.telefono.replace(/\D/g, ''),
        plantilla: f.plantilla,
        parametros: [v.nombre ?? 'estimado cliente', servicio, org.nombre],
        texto,
      })
    } else {
      await db.from('seguimientos').update({ estado: 'sin_ventana' }).eq('id', f.id)
    }
  }
  return salida
}

export async function marcarSeguimiento(id: string, ok: boolean, error?: string): Promise<boolean> {
  const db = supabaseAdmin()
  const { data } = await db
    .from('seguimientos')
    .update({
      estado: ok ? 'enviado' : 'fallido',
      enviado_at: ok ? new Date().toISOString() : null,
      error: error ?? null,
    })
    .eq('id', id)
    .eq('estado', 'pendiente')
    .select('organizacion_id, lead_id, texto, plantilla')
    .maybeSingle()
  const f = data as {
    organizacion_id: string
    lead_id: string
    texto: string
    plantilla: string | null
  } | null
  if (ok && f) {
    await db.from('actividad').insert({
      organizacion_id: f.organizacion_id,
      lead_id: f.lead_id,
      tipo: 'mensaje_agente',
      contenido: f.texto,
      autor: f.plantilla ? `Seguimiento (plantilla ${f.plantilla})` : 'Seguimiento',
    })
  }
  return Boolean(f)
}
