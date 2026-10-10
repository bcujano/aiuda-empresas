import { etiquetaHora } from '@/lib/agenda'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Cita, Lead, Organizacion } from '@/types/database'
import { datosAviso } from './agenda'
import { type EventoCita, enviarAviso } from './avisos'

/**
 * Lo que el equipo hace desde la agenda del CRM: mover, crear y cambiar el
 * estado de una reunión. Todo filtra por organización y deja rastro en la
 * actividad del lead. Los cambios que importan al cliente se le avisan.
 */

type R = { ok: true } | { ok: false; error: string }
const VIVAS = ['agendada', 'confirmada']
const CRUCE = 'Ya hay otra reunión en ese horario.'

async function contexto(orgId: string, citaId: string) {
  const db = supabaseAdmin()
  const { data } = await db
    .from('citas')
    .select('*')
    .eq('id', citaId)
    .eq('organizacion_id', orgId)
    .maybeSingle()
  const cita = data as Cita | null
  if (!cita) return null
  const [lead, org] = await Promise.all([
    db.from('leads').select('*').eq('id', cita.lead_id).eq('organizacion_id', orgId).single(),
    db.from('organizaciones').select('*').eq('id', orgId).single(),
  ])
  if (!lead.data || !org.data) return null
  return { cita, lead: lead.data as Lead, org: org.data as Organizacion }
}

async function registrar(orgId: string, leadId: string, texto: string, autor: string) {
  await supabaseAdmin()
    .from('actividad')
    .insert({ organizacion_id: orgId, lead_id: leadId, tipo: 'cita', contenido: texto, autor })
}

async function avisar(evento: EventoCita, org: Organizacion, lead: Lead, cita: Cita) {
  await enviarAviso(evento, datosAviso(org, lead, cita))
}

export async function moverCita(
  orgId: string,
  citaId: string,
  inicia: string,
  termina: string,
  autor: string,
): Promise<R> {
  const c = await contexto(orgId, citaId)
  if (!c) return { ok: false, error: 'No encontré la reunión.' }
  if (!VIVAS.includes(c.cita.estado))
    return { ok: false, error: 'Solo se mueven reuniones activas.' }
  if (Date.parse(termina) <= Date.parse(inicia))
    return { ok: false, error: 'La hora no es válida.' }
  const ahora = new Date().toISOString()
  const { data, error } = await supabaseAdmin()
    .from('citas')
    .update({
      inicia_at: new Date(inicia).toISOString(),
      termina_at: new Date(termina).toISOString(),
      estado: 'confirmada',
      origen: 'equipo',
      confirmada_at: ahora,
      recordatorio_24h_at: Date.parse(inicia) - Date.now() < 86_400_000 ? ahora : null,
      recordatorio_2h_at: null,
    })
    .eq('id', citaId)
    .eq('organizacion_id', orgId)
    .select('*')
    .single()
  if (error || !data)
    return { ok: false, error: error?.code === '23P01' ? CRUCE : 'No se pudo mover.' }
  const cita = data as Cita
  await registrar(
    orgId,
    c.lead.id,
    `${autor} movió la reunión al ${etiquetaHora(cita.inicia_at)} y quedó confirmada.`,
    autor,
  )
  await avisar('cita_movida_equipo', c.org, c.lead, cita)
  return { ok: true }
}

export async function cambiarEstadoCita(
  orgId: string,
  citaId: string,
  estado: 'confirmada' | 'cancelada' | 'asistio' | 'no_asistio',
  autor: string,
): Promise<R> {
  const c = await contexto(orgId, citaId)
  if (!c) return { ok: false, error: 'No encontré la reunión.' }
  const db = supabaseAdmin()
  const cambios: Record<string, unknown> = { estado }
  if (estado === 'confirmada') {
    cambios.confirmada_at = new Date().toISOString()
    if (Date.parse(c.cita.inicia_at) - Date.now() < 86_400_000)
      cambios.recordatorio_24h_at = cambios.confirmada_at
  }
  const { data, error } = await db
    .from('citas')
    .update(cambios)
    .eq('id', citaId)
    .eq('organizacion_id', orgId)
    .select('*')
    .single()
  if (error || !data) return { ok: false, error: 'No se pudo cambiar el estado.' }
  const cita = data as Cita
  const textos = {
    confirmada: 'confirmó',
    cancelada: 'canceló',
    asistio: 'marcó que asistió a',
    no_asistio: 'marcó que no asistió a',
  }
  await registrar(
    orgId,
    c.lead.id,
    `${autor} ${textos[estado]} la reunión del ${etiquetaHora(cita.inicia_at)}.`,
    autor,
  )
  if (estado === 'asistio' && ['nuevo', 'calificado', 'agendado'].includes(c.lead.etapa)) {
    await db
      .from('leads')
      .update({ etapa: 'asistio' })
      .eq('id', c.lead.id)
      .eq('organizacion_id', orgId)
  }
  if (estado === 'confirmada') await avisar('cita_confirmada', c.org, c.lead, cita)
  if (estado === 'cancelada') await avisar('cita_cancelada_equipo', c.org, c.lead, cita)
  return { ok: true }
}

export async function crearCitaEquipo(
  orgId: string,
  entrada: { lead_id: string; inicia: string; modalidad: 'virtual' | 'presencial'; notas?: string },
  autor: string,
): Promise<R> {
  const db = supabaseAdmin()
  const [lead, org] = await Promise.all([
    db
      .from('leads')
      .select('*')
      .eq('id', entrada.lead_id)
      .eq('organizacion_id', orgId)
      .maybeSingle(),
    db.from('organizaciones').select('*').eq('id', orgId).single(),
  ])
  if (!lead.data || !org.data) return { ok: false, error: 'Elige un lead de este cliente.' }
  const o = org.data as Organizacion
  const inicio = Date.parse(entrada.inicia)
  if (!Number.isFinite(inicio)) return { ok: false, error: 'La hora no es válida.' }
  const { data, error } = await db
    .from('citas')
    .insert({
      organizacion_id: orgId,
      lead_id: entrada.lead_id,
      inicia_at: new Date(inicio).toISOString(),
      termina_at: new Date(inicio + o.cita_minutos * 60_000).toISOString(),
      modalidad: entrada.modalidad,
      estado: 'confirmada',
      origen: 'equipo',
      confirmada_at: new Date().toISOString(),
      notas: entrada.notas || null,
    })
    .select('*')
    .single()
  if (error || !data)
    return { ok: false, error: error?.code === '23P01' ? CRUCE : 'No se pudo crear la reunión.' }
  const cita = data as Cita
  const l = lead.data as Lead
  if (['nuevo', 'calificado'].includes(l.etapa)) {
    await db.from('leads').update({ etapa: 'agendado' }).eq('id', l.id).eq('organizacion_id', orgId)
  }
  await registrar(
    orgId,
    l.id,
    `${autor} agendó una reunión ${cita.modalidad}: ${etiquetaHora(cita.inicia_at)}.`,
    autor,
  )
  await avisar('cita_confirmada', o, l, cita)
  return { ok: true }
}

/** Leads que se pueden agendar a mano (los más recientes primero). */
export async function leadsParaAgendar(orgId: string) {
  const { data } = await supabaseAdmin()
    .from('leads')
    .select('id, nombre, empresa, telefono, etapa')
    .eq('organizacion_id', orgId)
    .neq('etapa', 'descartado')
    .order('updated_at', { ascending: false })
    .limit(300)
  return (data ?? []) as Pick<Lead, 'id' | 'nombre' | 'empresa' | 'telefono' | 'etapa'>[]
}
