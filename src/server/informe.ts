import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Datos del informe de campañas de UNA organización, todos contados en la base.
 * El informe nunca nombra la fuente de los contactos: habla de «campañas».
 */

export type Charla = {
  sector: string | null
  mensajes: { de: 'contacto' | 'asistente'; texto: string }[]
}
export type Informe = {
  organizacion: { nombre: string; color: string }
  desde: string
  hasta: string
  contactadas: number
  respondieron: number
  interesadas: number
  reuniones: number
  porDia: { dia: string; n: number }[]
  porSector: { sector: string; n: number; respondieron: number; interesadas: number }[]
  /** Sector con mejor respuesta real (null mientras no haya datos para elegir). */
  foco: string | null
  inversion: number
  propuestaDia: number | null
  charlas: Charla[]
}

type Pros = {
  nombre: string
  segmento: string | null
  telefono_wa: string | null
  whatsapp_at: string | null
  email_at: string | null
  respondio_at: string | null
}
type LeadFila = { id: string; telefono: string; etapa: string; motivo_descarte: string | null }

const ZONA = 'America/Guayaquil'
const dia = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(iso))
const digitos = (t: string | null) => (t ?? '').replace(/\D/g, '')
const INTERESADAS = ['calificado', 'agendado', 'asistio', 'cliente']

function limpiar(texto: string, empresas: string[]): string {
  let t = texto.replace(/\+?\d[\d\s-]{7,}\d/g, '•••').replace(/\S+@\S+/g, '•••')
  for (const e of empresas) if (e.length > 3) t = t.split(e).join('su empresa')
  return t.replace(/\s+/g, ' ').trim().slice(0, 220)
}

export async function armarInforme(
  orgId: string,
  opciones: { inversion?: number; propuestaDia?: number | null } = {},
): Promise<Informe> {
  const db = supabaseAdmin()
  const [{ data: o }, { data: p }, { data: l }, { count: reuniones }] = await Promise.all([
    db.from('organizaciones').select('nombre, color_primario').eq('id', orgId).single(),
    db
      .from('prospectos')
      .select('nombre, segmento, telefono_wa, whatsapp_at, email_at, respondio_at')
      .eq('organizacion_id', orgId)
      .limit(5000),
    db
      .from('leads')
      .select('id, telefono, etapa, motivo_descarte')
      .eq('organizacion_id', orgId)
      .limit(5000),
    db
      .from('citas')
      .select('id', { count: 'exact', head: true })
      .eq('organizacion_id', orgId)
      .in('estado', ['agendada', 'confirmada', 'asistio']),
  ])
  const org = (o as { nombre: string; color_primario: string } | null) ?? {
    nombre: '',
    color_primario: '#1f3a5f',
  }
  const prospectos = (p ?? []) as Pros[]
  const leads = (l ?? []) as LeadFila[]
  const lead = new Map(leads.map((x) => [digitos(x.telefono), x]))
  const esBot = (x: LeadFila | undefined) => /autom[aá]tic|bot/i.test(x?.motivo_descarte ?? '')

  const contactados = prospectos.filter((x) => x.whatsapp_at || x.email_at)
  const respondieron = contactados.filter(
    (x) => x.respondio_at && !esBot(lead.get(digitos(x.telefono_wa))),
  )
  const interesadas = respondieron.filter((x) =>
    INTERESADAS.includes(lead.get(digitos(x.telefono_wa))?.etapa ?? ''),
  )

  const porDia = new Map<string, number>()
  for (const x of contactados) {
    const d = dia((x.whatsapp_at ?? x.email_at) as string)
    porDia.set(d, (porDia.get(d) ?? 0) + 1)
  }
  const sectores = new Map<string, { n: number; respondieron: number; interesadas: number }>()
  for (const x of contactados) {
    const k = x.segmento ?? 'Otros'
    const t = sectores.get(k) ?? { n: 0, respondieron: 0, interesadas: 0 }
    t.n++
    if (respondieron.includes(x)) t.respondieron++
    if (interesadas.includes(x)) t.interesadas++
    sectores.set(k, t)
  }
  const porSector = [...sectores].map(([sector, t]) => ({ sector, ...t })).sort((a, b) => b.n - a.n)
  // Foco: más interesadas; si empatan, mejor tasa de respuesta; hace falta una muestra mínima.
  const foco =
    [...porSector]
      .filter((s) => s.n >= 5 && (s.interesadas > 0 || s.respondieron > 0))
      .sort(
        (a, b) => b.interesadas - a.interesadas || b.respondieron / b.n - a.respondieron / a.n,
      )[0]?.sector ?? null

  // Charlas destacadas: primero las de quien mostró interés.
  const elegidas = interesadas
    .slice(0, 2)
    .map((x) => ({ x, lead: lead.get(digitos(x.telefono_wa)) }))
  const charlas: Charla[] = []
  for (const { x, lead: ld } of elegidas) {
    if (!ld) continue
    const { data } = await db
      .from('actividad')
      .select('tipo, contenido, created_at')
      .eq('organizacion_id', orgId)
      .eq('lead_id', ld.id)
      .in('tipo', ['mensaje_entrante', 'mensaje_agente'])
      .order('created_at', { ascending: false })
      .limit(6)
    const filas = ((data ?? []) as { tipo: string; contenido: string }[]).reverse()
    charlas.push({
      sector: x.segmento,
      mensajes: filas.map((f) => ({
        de: f.tipo === 'mensaje_entrante' ? 'contacto' : 'asistente',
        texto: limpiar(f.contenido, [x.nombre]),
      })),
    })
  }

  const fechas = contactados.map((x) => dia((x.whatsapp_at ?? x.email_at) as string)).sort()
  return {
    organizacion: { nombre: org.nombre, color: org.color_primario },
    desde: fechas[0] ?? dia(new Date().toISOString()),
    hasta: dia(new Date().toISOString()),
    contactadas: contactados.length,
    respondieron: respondieron.length,
    interesadas: interesadas.length,
    reuniones: reuniones ?? 0,
    porDia: [...porDia].sort().map(([d, n]) => ({ dia: d, n })),
    porSector,
    foco,
    inversion: opciones.inversion ?? 50,
    propuestaDia: opciones.propuestaDia ?? null,
    charlas,
  }
}
