import { etiquetaHora } from '@/lib/agenda'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Cita, Lead, Organizacion } from '@/types/database'
import { datosAviso, espaciosLibres } from './agenda'
import { type EventoCita, enviarAviso } from './avisos'

/**
 * Respuesta del equipo del cliente a una cita, desde el enlace privado que le
 * llega por correo y WhatsApp (/cita/<token>). El token es la llave: no hace
 * falta usuario del CRM para confirmar o mover una reunión.
 */

function dentroDe24h(iso: string): boolean {
  return Date.parse(iso) - Date.now() < 24 * 3_600_000
}

export type CitaDelEquipo = { cita: Cita; lead: Lead; org: Organizacion }

export async function citaPorToken(token: string): Promise<CitaDelEquipo | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null
  const db = supabaseAdmin()
  const { data } = await db.from('citas').select('*').eq('token', token).maybeSingle()
  const cita = data as Cita | null
  if (!cita) return null
  const [lead, org] = await Promise.all([
    db
      .from('leads')
      .select('*')
      .eq('id', cita.lead_id)
      .eq('organizacion_id', cita.organizacion_id)
      .single(),
    db.from('organizaciones').select('*').eq('id', cita.organizacion_id).single(),
  ])
  if (!lead.data || !org.data) return null
  return { cita, lead: lead.data as Lead, org: org.data as Organizacion }
}

export async function horasParaMover(
  datos: CitaDelEquipo,
): Promise<{ valor: string; etiqueta: string }[]> {
  return (await espaciosLibres(datos.org, datos.cita.id))
    .slice(0, 60)
    .map((e) => ({ valor: e.toISOString(), etiqueta: etiquetaHora(e) }))
}

type Accion = { tipo: 'confirmar' } | { tipo: 'cancelar' } | { tipo: 'mover'; inicia_at: string }

export async function responderCita(
  token: string,
  accion: Accion,
): Promise<{ ok: true; mensaje: string } | { ok: false; error: string }> {
  const datos = await citaPorToken(token)
  if (!datos) return { ok: false, error: 'El enlace no es válido.' }
  const { cita, lead, org } = datos
  if (!['agendada', 'confirmada'].includes(cita.estado)) {
    return { ok: false, error: 'Esta reunión ya no está activa.' }
  }
  const db = supabaseAdmin()
  let actualizada: Cita = cita
  let evento: EventoCita
  let registro: string

  if (accion.tipo === 'confirmar') {
    const { data } = await db
      .from('citas')
      .update({
        estado: 'confirmada',
        confirmada_at: new Date().toISOString(),
        // Si falta menos de un día, la confirmación ya hace de recordatorio de 24 h.
        recordatorio_24h_at: dentroDe24h(cita.inicia_at) ? new Date().toISOString() : null,
      })
      .eq('id', cita.id)
      .select('*')
      .single()
    actualizada = (data as Cita | null) ?? cita
    evento = 'cita_confirmada'
    registro = `El equipo confirmó la reunión: ${etiquetaHora(cita.inicia_at)}.`
  } else if (accion.tipo === 'cancelar') {
    await db.from('citas').update({ estado: 'cancelada' }).eq('id', cita.id)
    actualizada = { ...cita, estado: 'cancelada' }
    evento = 'cita_cancelada_equipo'
    registro = `El equipo canceló la reunión del ${etiquetaHora(cita.inicia_at)}.`
  } else {
    const pedido = Date.parse(accion.inicia_at)
    const libres = await espaciosLibres(org, cita.id)
    if (!libres.some((e) => e.getTime() === pedido)) {
      return { ok: false, error: 'Esa hora ya no está libre. Elige otra.' }
    }
    const { data, error } = await db
      .from('citas')
      .update({
        inicia_at: new Date(pedido).toISOString(),
        termina_at: new Date(pedido + org.cita_minutos * 60_000).toISOString(),
        estado: 'confirmada',
        origen: 'equipo',
        confirmada_at: new Date().toISOString(),
        recordatorio_24h_at: dentroDe24h(accion.inicia_at) ? new Date().toISOString() : null,
        recordatorio_2h_at: null,
      })
      .eq('id', cita.id)
      .select('*')
      .single()
    if (error || !data) return { ok: false, error: 'Esa hora ya no está libre. Elige otra.' }
    actualizada = data as Cita
    evento = 'cita_movida_equipo'
    registro = `El equipo movió la reunión al ${etiquetaHora(actualizada.inicia_at)} y quedó confirmada.`
  }

  await db.from('actividad').insert({
    organizacion_id: org.id,
    lead_id: lead.id,
    tipo: 'cita',
    contenido: registro,
    autor: 'Equipo',
  })
  await enviarAviso(evento, datosAviso(org, lead, actualizada))
  return { ok: true, mensaje: registro }
}
