import { calcularEspacios, etiquetaHora, repartir } from '@/lib/agenda'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ventanaAbierta } from '@/lib/whatsapp'
import type { Cita, Lead, Organizacion } from '@/types/database'
import { leadPorTelefono, organizacionPorNumero } from './agente-base'
import { type EventoCita, enviarAviso, URL_APP } from './avisos'

/**
 * Agenda de cada organización. El agente solo puede ofrecer y reservar horas
 * que salen de aquí; la base impide dos citas cruzadas (citas_sin_cruce).
 */

const VIVAS = ['agendada', 'confirmada']

export async function espaciosLibres(org: Organizacion, ignorarCitaId?: string): Promise<Date[]> {
  const db = supabaseAdmin()
  const hasta = new Date(Date.now() + (org.cita_dias_adelante + 1) * 86_400_000).toISOString()
  const [horarios, citas] = await Promise.all([
    db.from('horarios_atencion').select('dia_semana, desde, hasta').eq('organizacion_id', org.id),
    db
      .from('citas')
      .select('id, inicia_at, termina_at')
      .eq('organizacion_id', org.id)
      .in('estado', VIVAS)
      .lte('inicia_at', hasta),
  ])
  const ocupados = (
    (citas.data ?? []) as { id: string; inicia_at: string; termina_at: string }[]
  ).filter((c) => c.id !== ignorarCitaId)
  return calcularEspacios(
    (horarios.data ?? []) as { dia_semana: number; desde: string; hasta: string }[],
    ocupados,
    {
      minutos: org.cita_minutos,
      intervalo: org.cita_intervalo_minutos,
      anticipacionHoras: org.cita_anticipacion_horas,
      diasAdelante: org.cita_dias_adelante,
    },
    new Date(),
  )
}

export async function citaVigente(orgId: string, leadId: string): Promise<Cita | null> {
  const { data } = await supabaseAdmin()
    .from('citas')
    .select('*')
    .eq('organizacion_id', orgId)
    .eq('lead_id', leadId)
    .in('estado', VIVAS)
    .gte('inicia_at', new Date().toISOString())
    .order('inicia_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data as Cita | null) ?? null
}

/** Horas libres para que el agente las ofrezca (repartidas, con etiqueta legible). */
export async function disponibilidadParaAgente(phoneNumberId: string, telefono: string) {
  const org = await organizacionPorNumero(phoneNumberId)
  if (!org) return null
  const lead = await leadPorTelefono(org.id, telefono)
  const vigente = lead ? await citaVigente(org.id, lead.id) : null
  const espacios = repartir(await espaciosLibres(org, vigente?.id))
  return {
    modalidades: org.modalidades,
    direccion: org.direccion,
    duracion_minutos: org.cita_minutos,
    espacios: espacios.map((e) => ({ inicia_at: e.toISOString(), etiqueta: etiquetaHora(e) })),
  }
}

/** Datos que acompañan a todo aviso de cita. */
export function datosAviso(org: Organizacion, lead: Lead, cita: Cita) {
  return {
    organizacion: {
      nombre: org.nombre,
      wa_phone_number_id: org.wa_phone_number_id,
      aviso_email: org.aviso_email,
      aviso_whatsapp: org.aviso_whatsapp,
      chatwoot_cuenta_id: org.chatwoot_cuenta_id,
      direccion: org.direccion,
    },
    cita: {
      id: cita.id,
      inicia_at: cita.inicia_at,
      etiqueta: etiquetaHora(cita.inicia_at),
      modalidad: cita.modalidad,
      estado: cita.estado,
      enlace_equipo: `${URL_APP}/cita/${cita.token}`,
    },
    lead: {
      nombre: lead.nombre,
      empresa: lead.empresa,
      cargo: lead.cargo,
      colaboradores: lead.colaboradores,
      ciudad: lead.ciudad,
      telefono: lead.telefono,
      necesidad: lead.necesidad,
      urgencia: lead.urgencia,
      chatwoot_conversacion_id: lead.chatwoot_conversacion_id,
      ventana_abierta: ventanaAbierta(lead.ultimo_inbound_at, lead.ventana_horas),
    },
  }
}

type ResultadoAgendar =
  | { ok: true; cita_id: string; etiqueta: string; modalidad: string; estado: string }
  | { ok: false; error: string; espacios?: { inicia_at: string; etiqueta: string }[] }

/** El agente reserva una hora libre. Si el lead ya tenía cita, se reprograma. */
export async function agendarDesdeAgente(entrada: {
  phone_number_id: string
  telefono: string
  inicia_at: string
  modalidad: 'virtual' | 'presencial'
}): Promise<ResultadoAgendar> {
  const org = await organizacionPorNumero(entrada.phone_number_id)
  if (!org) return { ok: false, error: 'ORGANIZACION_DESCONOCIDA' }
  const lead = await leadPorTelefono(org.id, entrada.telefono)
  if (!lead) return { ok: false, error: 'LEAD_DESCONOCIDO' }
  if (!org.modalidades.includes(entrada.modalidad))
    return { ok: false, error: 'MODALIDAD_NO_DISPONIBLE' }

  const anterior = await citaVigente(org.id, lead.id)
  const libres = await espaciosLibres(org, anterior?.id)
  const pedido = Date.parse(entrada.inicia_at)
  const otras = () =>
    repartir(libres).map((e) => ({ inicia_at: e.toISOString(), etiqueta: etiquetaHora(e) }))
  if (!libres.some((e) => e.getTime() === pedido)) {
    return { ok: false, error: 'HORA_NO_DISPONIBLE', espacios: otras() }
  }

  const db = supabaseAdmin()
  if (anterior) await db.from('citas').update({ estado: 'cancelada' }).eq('id', anterior.id)
  const { data, error } = await db
    .from('citas')
    .insert({
      organizacion_id: org.id,
      lead_id: lead.id,
      inicia_at: new Date(pedido).toISOString(),
      termina_at: new Date(pedido + org.cita_minutos * 60_000).toISOString(),
      modalidad: entrada.modalidad,
      origen: 'agente',
    })
    .select('*')
    .single()
  if (error || !data) {
    if (anterior) await db.from('citas').update({ estado: anterior.estado }).eq('id', anterior.id)
    return { ok: false, error: 'HORA_NO_DISPONIBLE', espacios: otras() }
  }
  const cita = data as Cita
  const etiqueta = etiquetaHora(cita.inicia_at)

  const cambios: Record<string, unknown> = {}
  if (['nuevo', 'calificado'].includes(lead.etapa)) cambios.etapa = 'agendado'
  if (Object.keys(cambios).length) await db.from('leads').update(cambios).eq('id', lead.id)
  await db.from('actividad').insert({
    organizacion_id: org.id,
    lead_id: lead.id,
    tipo: 'cita',
    contenido: `${anterior ? 'Reprogramó' : 'Reservó'} reunión ${cita.modalidad}: ${etiqueta}. Falta la confirmación del equipo.`,
    autor: 'Agente',
  })

  const evento: EventoCita = anterior ? 'cita_reprogramada_cliente' : 'cita_nueva'
  if (await enviarAviso(evento, datosAviso(org, { ...lead, ...cambios } as Lead, cita))) {
    await db.from('citas').update({ aviso_equipo_at: new Date().toISOString() }).eq('id', cita.id)
  }
  return { ok: true, cita_id: cita.id, etiqueta, modalidad: cita.modalidad, estado: cita.estado }
}
