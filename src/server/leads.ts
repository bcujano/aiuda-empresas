import { DIAS_HISTORIAL } from '@/lib/planes'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  type Actividad,
  type Angulo,
  type EstadoPlan,
  ETAPAS,
  type Etapa,
  type Lead,
} from '@/types/database'

/**
 * Leads de UNA organización. Cada consulta filtra por organizacion_id: es el
 * aislamiento entre clientes, y nunca se omite.
 */

export async function listarLeads(orgId: string): Promise<Lead[]> {
  const { data, error } = await supabaseAdmin()
    .from('leads')
    .select('*')
    .eq('organizacion_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(500)
  if (error) throw new Error(`No se pudieron leer los leads: ${error.message}`)
  return (data ?? []) as Lead[]
}

export async function leadPorId(orgId: string, id: string): Promise<Lead | null> {
  const { data } = await supabaseAdmin()
    .from('leads')
    .select('*')
    .eq('organizacion_id', orgId)
    .eq('id', id)
    .maybeSingle()
  return (data as Lead | null) ?? null
}

export async function actividadDeLead(
  orgId: string,
  leadId: string,
  plan: EstadoPlan,
): Promise<Actividad[]> {
  let consulta = supabaseAdmin()
    .from('actividad')
    .select('id, lead_id, tipo, contenido, autor, created_at')
    .eq('organizacion_id', orgId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(200)
  const dias = DIAS_HISTORIAL[plan]
  if (dias !== null) {
    consulta = consulta.gte('created_at', new Date(Date.now() - dias * 86_400_000).toISOString())
  }
  const { data } = await consulta
  return (data ?? []) as Actividad[]
}

export async function cambiarEtapa(
  orgId: string,
  leadId: string,
  etapa: Etapa,
  autor: string,
  motivo?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!ETAPAS.includes(etapa)) return { ok: false, error: 'Etapa desconocida.' }
  if (etapa === 'descartado' && !motivo?.trim()) {
    return { ok: false, error: 'Escribe por qué se descarta.' }
  }
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('leads')
    .update({ etapa, motivo_descarte: etapa === 'descartado' ? motivo?.trim() : null })
    .eq('organizacion_id', orgId)
    .eq('id', leadId)
    .select('id')
    .maybeSingle()
  if (error || !data) return { ok: false, error: 'No se pudo cambiar la etapa.' }

  const contenido = etapa === 'descartado' ? `Descartado: ${motivo?.trim()}` : `Pasó a ${etapa}`
  await db
    .from('actividad')
    .insert({ organizacion_id: orgId, lead_id: leadId, tipo: 'cambio_etapa', contenido, autor })
  return { ok: true }
}

export async function agregarNota(
  orgId: string,
  leadId: string,
  texto: string,
  autor: string,
): Promise<{ ok: boolean; error?: string }> {
  const limpio = texto.trim()
  if (!limpio) return { ok: false, error: 'La nota está vacía.' }
  const lead = await leadPorId(orgId, leadId)
  if (!lead) return { ok: false, error: 'Ese lead no existe.' }
  const { error } = await supabaseAdmin()
    .from('actividad')
    .insert({ organizacion_id: orgId, lead_id: leadId, tipo: 'nota', contenido: limpio, autor })
  return error ? { ok: false, error: 'No se pudo guardar la nota.' } : { ok: true }
}

export type FilaAngulo = {
  angulo: Pick<Angulo, 'id' | 'servicio' | 'codigo'> | null
  leads: number
  calificados: number
  agendados: number
}

/** Embudo por ángulo: de cada ángulo, cuántos leads llegaron y hasta dónde. */
export function embudoPorAngulo(leads: Lead[], angulos: Angulo[]): FilaAngulo[] {
  const avanzados = new Set<Etapa>(['calificado', 'agendado', 'asistio', 'cliente'])
  const agendados = new Set<Etapa>(['agendado', 'asistio', 'cliente'])
  const filas = new Map<string, FilaAngulo>()
  for (const a of angulos) {
    filas.set(a.id, {
      angulo: { id: a.id, servicio: a.servicio, codigo: a.codigo },
      leads: 0,
      calificados: 0,
      agendados: 0,
    })
  }
  const sinAngulo: FilaAngulo = { angulo: null, leads: 0, calificados: 0, agendados: 0 }
  for (const lead of leads) {
    const fila = (lead.angulo_id && filas.get(lead.angulo_id)) || sinAngulo
    fila.leads++
    if (avanzados.has(lead.etapa)) fila.calificados++
    if (agendados.has(lead.etapa)) fila.agendados++
  }
  const resultado = [...filas.values()]
  if (sinAngulo.leads > 0) resultado.push(sinAngulo)
  return resultado
}

export function conteoPorEtapa(leads: Lead[]): Record<Etapa, number> {
  const conteo = Object.fromEntries(ETAPAS.map((e) => [e, 0])) as Record<Etapa, number>
  for (const lead of leads) conteo[lead.etapa]++
  return conteo
}
