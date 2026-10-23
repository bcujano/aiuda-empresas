import { type Charla, EXPLICACIONES, type Informe, type Persona } from '@/lib/informe-modelo'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Borrador del informe de campañas de UNA organización: todo se cuenta en la base y la persona lo
 * ajusta antes de convertirlo en PDF. El informe habla de «campañas»; nunca nombra la fuente de los contactos.
 */

type Pros = {
  nombre: string
  segmento: string | null
  telefono_wa: string | null
  whatsapp_at: string | null
  email_at: string | null
  respondio_at: string | null
  baja_at: string | null
}
type LeadFila = {
  id: string
  telefono: string
  nombre: string | null
  empresa: string | null
  etapa: string
  motivo_descarte: string | null
}
type Msg = { lead_id: string; tipo: string; contenido: string; created_at: string }

const ZONA = 'America/Guayaquil'
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const diaIso = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(iso))
const fechaCorta = (iso: string) => {
  const d = diaIso(iso)
  return `${Number(d.slice(8, 10))} ${MESES[Number(d.slice(5, 7)) - 1]}`
}
const digitos = (t: string | null) => (t ?? '').replace(/\D/g, '')
const INTERESADAS = ['calificado', 'agendado', 'asistio', 'cliente']
const esBot = (l?: LeadFila) => /autom[aá]tic|\bbot\b/i.test(l?.motivo_descarte ?? '')
const EXITO = /(ya )?(convers|habl|contact|llam)\w*.{0,40}(profesional|abogado|equipo|ustedes)/i

const limpiar = (t: string) =>
  t
    .replace(/\+?\d[\d\s-]{7,}\d/g, '•••')
    .replace(/\S+@\S+/g, '•••')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 250)

export const CHARLA_ILUSTRATIVA: Charla = {
  titulo: 'Ejemplo de conversación con el asistente',
  ilustrativa: true,
  mensajes: [
    { de: 'contacto', texto: 'Hola, ¿de qué se trata?' },
    {
      de: 'asistente',
      texto:
        'Hola, le escribe el equipo de Fagal Abogados. Asesoramos a empresas en temas tributarios, laborales y de contratación pública. ¿Le interesaría una reunión breve de 20 minutos con un abogado?',
    },
    { de: 'contacto', texto: 'Tenemos una glosa del SRI pendiente, ¿pueden ayudar?' },
    {
      de: 'asistente',
      texto:
        'Sí, es justo un tema que atendemos. Tengo libre el martes a las 10:00, el miércoles a las 15:00 o el jueves a las 9:00. ¿Cuál le acomoda y la prefiere presencial o virtual?',
    },
    { de: 'contacto', texto: 'El miércoles 15:00, presencial' },
    {
      de: 'asistente',
      texto:
        'Listo, queda agendada para el miércoles 15:00, presencial, en nuestra oficina de Quito. Le llegará un recordatorio. ¿A nombre de quién la registro?',
    },
  ],
}

export async function armarInforme(
  orgId: string,
  opciones: { inversion?: number; propuestaDia?: number } = {},
): Promise<Informe> {
  const db = supabaseAdmin()
  const [{ data: o }, { data: p }, { data: l }, { data: a }, { count: reuniones }] =
    await Promise.all([
      db.from('organizaciones').select('nombre').eq('id', orgId).single(),
      db
        .from('prospectos')
        .select('nombre, segmento, telefono_wa, whatsapp_at, email_at, respondio_at, baja_at')
        .eq('organizacion_id', orgId)
        .limit(5000),
      db
        .from('leads')
        .select('id, telefono, nombre, empresa, etapa, motivo_descarte')
        .eq('organizacion_id', orgId)
        .limit(5000),
      db
        .from('actividad')
        .select('lead_id, tipo, contenido, created_at')
        .eq('organizacion_id', orgId)
        .in('tipo', ['mensaje_entrante', 'mensaje_agente'])
        .order('created_at', { ascending: true })
        .limit(8000),
      db
        .from('citas')
        .select('id', { count: 'exact', head: true })
        .eq('organizacion_id', orgId)
        .in('estado', ['agendada', 'confirmada', 'asistio']),
    ])
  const prospectos = (p ?? []) as Pros[]
  const leads = (l ?? []) as LeadFila[]
  const msgs = (a ?? []) as Msg[]
  const porTel = new Map(leads.map((x) => [digitos(x.telefono), x]))
  const empresaDe = new Map(prospectos.map((x) => [digitos(x.telefono_wa), x.nombre]))
  const delLead = new Map<string, Msg[]>()
  for (const m of msgs) delLead.set(m.lead_id, [...(delLead.get(m.lead_id) ?? []), m])

  // Ventana del informe: los últimos 14 días (hoy incluido), hora de Quito.
  const VENTANA = 14
  const ahora = Date.now()
  const hoy = diaIso(new Date(ahora).toISOString())
  const inicio = diaIso(new Date(ahora - (VENTANA - 1) * 86_400_000).toISOString())
  const diaContacto = (x: Pros) => diaIso((x.whatsapp_at ?? x.email_at) as string)
  const contactados = prospectos.filter(
    (x) => (x.whatsapp_at || x.email_at) && diaContacto(x) >= inicio,
  )
  const reales = contactados.filter(
    (x) => x.respondio_at && !esBot(porTel.get(digitos(x.telefono_wa))),
  )
  const automaticas = contactados.filter((x) => esBot(porTel.get(digitos(x.telefono_wa)))).length
  const interesadas = reales.filter((x) =>
    INTERESADAS.includes(porTel.get(digitos(x.telefono_wa))?.etapa ?? ''),
  )

  const conversaron = leads.filter((x) => empresaDe.has(digitos(x.telefono)) && !esBot(x))
  const persona = (x: LeadFila, nota: string): Persona => {
    const ult = [...(delLead.get(x.id) ?? [])].reverse().find((m) => m.tipo === 'mensaje_entrante')
    return {
      nombre: x.nombre ?? 'Sin nombre',
      empresa: x.empresa ?? empresaDe.get(digitos(x.telefono)) ?? '',
      fecha: ult ? fechaCorta(ult.created_at) : '',
      nota,
    }
  }
  const entrantes = (x: LeadFila) =>
    (delLead.get(x.id) ?? []).filter((m) => m.tipo === 'mensaje_entrante').length
  const calientes = conversaron.filter((x) => INTERESADAS.includes(x.etapa))
  const frios = conversaron.filter((x) => x.etapa === 'descartado')
  const tibios = conversaron.filter(
    (x) => !INTERESADAS.includes(x.etapa) && x.etapa !== 'descartado' && entrantes(x) >= 2,
  )
  const enVentana = new Set(contactados.map((x) => digitos(x.telefono_wa)))
  const rechazos = frios.filter((x) => enVentana.has(digitos(x.telefono))).length
  const bajas = contactados.filter((x) => x.baja_at).length - automaticas

  const porDia = new Map<string, { n: number; resp: number }>()
  for (let i = VENTANA - 1; i >= 0; i--) {
    porDia.set(diaIso(new Date(ahora - i * 86_400_000).toISOString()), { n: 0, resp: 0 })
  }
  for (const x of contactados) {
    const t = porDia.get(diaContacto(x))
    if (!t) continue
    t.n++
    if (reales.includes(x)) t.resp++
  }
  const sectores = new Map<string, { n: number; respondieron: number; interesadas: number }>()
  for (const x of contactados) {
    const k = x.segmento ?? 'Otros'
    const t = sectores.get(k) ?? { n: 0, respondieron: 0, interesadas: 0 }
    t.n++
    if (reales.includes(x)) t.respondieron++
    if (interesadas.includes(x)) t.interesadas++
    sectores.set(k, t)
  }
  const porSector = [...sectores].map(([sector, t]) => ({ sector, ...t })).sort((m, n) => n.n - m.n)
  const foco =
    [...porSector]
      .filter((s) => s.n >= 5 && (s.interesadas > 0 || s.respondieron > 0))
      .sort(
        (m, n) => n.interesadas - m.interesadas || n.respondieron / n.n - m.respondieron / m.n,
      )[0]?.sector ?? ''

  // Caso de éxito: alguien que dice que ya habló con una persona del equipo.
  let caso: { lead: LeadFila; cita: string } | null = null
  for (const x of conversaron) {
    const m = [...(delLead.get(x.id) ?? [])]
      .reverse()
      .find((y) => y.tipo === 'mensaje_entrante' && EXITO.test(y.contenido))
    if (m) {
      caso = { lead: x, cita: limpiar(m.contenido) }
      break
    }
  }

  const real = (x: LeadFila, titulo: string): Charla => ({
    titulo,
    ilustrativa: false,
    mensajes: (delLead.get(x.id) ?? []).slice(-8).map((m) => ({
      de: m.tipo === 'mensaje_entrante' ? ('contacto' as const) : ('asistente' as const),
      texto: limpiar(m.contenido),
    })),
  })
  const charlas: Charla[] = []
  for (const x of [caso?.lead, ...calientes].filter((v): v is LeadFila => !!v)) {
    if (charlas.length >= 2) break
    if ((delLead.get(x.id) ?? []).length >= 4)
      charlas.push(real(x, `Conversación real · ${x.empresa ?? 'empresa interesada'}`))
  }
  if (charlas.length < 2) charlas.push(CHARLA_ILUSTRATIVA)

  const inversion = opciones.inversion ?? 50
  const desde = [...porDia.keys()].sort()[0] ?? inicio
  const sFoco = porSector.find((s) => s.sector === foco)
  const costo = contactados.length ? (inversion / contactados.length).toFixed(2) : '—'
  return {
    cliente: (o as { nombre: string } | null)?.nombre ?? '',
    desde,
    hasta: hoy,
    inversion,
    contactadas: contactados.length,
    respondieron: reales.length,
    interesadas: interesadas.length,
    reuniones: reuniones ?? 0,
    automaticas,
    rechazos,
    bajas: Math.max(0, bajas),
    porDia: [...porDia].sort().map(([dia, t]) => ({ dia, ...t })),
    ventanaDias: VENTANA,
    porSector,
    foco,
    calientes: calientes.slice(0, 5).map((x) => persona(x, 'Quiere reunirse')),
    tibios: tibios.slice(0, 5).map((x) => persona(x, `Conversó (${entrantes(x)} mensajes)`)),
    frios: frios.slice(0, 5).map((x) => persona(x, x.motivo_descarte ?? 'Sin interés por ahora')),
    casoExito: caso
      ? {
          activo: true,
          titulo: 'Caso a verificar',
          persona: persona(caso.lead, 'Dice que ya habló con una persona del equipo'),
          texto: `«${caso.cita}»`,
        }
      : {
          activo: false,
          titulo: 'Caso a verificar',
          persona: { nombre: '', empresa: '', fecha: '', nota: '' },
          texto: '',
        },
    charlas,
    dolares: {
      servicioMensual: 200,
      meses: 3,
      planMensualCliente: 500,
      propuestaDia: opciones.propuestaDia ?? 0,
    },
    conclusiones: [
      `Con la inversión inicial de US$ ${inversion} se contactaron ${contactados.length} empresas (alrededor de US$ ${costo} por empresa).`,
      `${reales.length} respondieron como personas, ${interesadas.length} mostraron interés en reunirse y hay ${reuniones ?? 0} reunión(es) agendada(s).`,
      sFoco
        ? `El sector con mejor respuesta es ${sFoco.sector}: ${sFoco.respondieron} de ${sFoco.n} respondieron.`
        : 'Aún no hay respuestas suficientes por sector para elegir un foco con datos.',
      'El presupuesto de arranque limitó el volumen diario y por eso el avance fue más lento de lo ideal. El testeo cumplió su objetivo: dejó marcado el camino.',
    ],
    pasos: [
      `Inyectar presupuesto por día y subir el volumen de contactos${foco ? `, enfocados en ${foco}` : ''}.`,
      'Acordar el siguiente desembolso conforme al acuerdo vigente.',
      'Verificar el caso a verificar: Fagal confirma si esa reunión ocurrió.',
      'Dar seguimiento esta semana a las personas calientes y tibias.',
      'Cumplir los 3 meses de prueba y medir reuniones y clientes cerrados.',
    ],
    explicaciones: EXPLICACIONES,
  }
}
