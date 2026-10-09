import { notFound, redirect } from 'next/navigation'
import { FormEtapa, FormNota } from '@/components/panel/formularios'
import { CabeceraTarjeta, Etiqueta, Tarjeta, Vacio } from '@/components/ui/primitivos'
import { exigir } from '@/lib/auth'
import { ETAPA_LEGIBLE, fechaHora, ORIGEN_LEGIBLE } from '@/lib/formato'
import { DIAS_HISTORIAL } from '@/lib/planes'
import { ventanaAbierta } from '@/lib/whatsapp'
import { citasDeLead, listarAngulos } from '@/server/citas-y-angulos'
import { actividadDeLead, leadPorId } from '@/server/leads'

const TIPO_LEGIBLE = {
  mensaje_entrante: 'Escribió',
  mensaje_agente: 'Agente',
  mensaje_persona: 'Equipo',
  cambio_etapa: 'Etapa',
  nota: 'Nota',
  cita: 'Reunión',
  escalado: 'Escalado',
} as const

export default async function FichaLead({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigir('leads')
  if (!sesion) redirect('/panel')
  const { id } = await params

  const lead = await leadPorId(sesion.org.id, id)
  if (!lead) notFound()
  const [actividad, citas, angulos] = await Promise.all([
    actividadDeLead(sesion.org.id, lead.id, sesion.plan),
    citasDeLead(sesion.org.id, lead.id),
    listarAngulos(sesion.org.id),
  ])
  const angulo = angulos.find((a) => a.id === lead.angulo_id)
  const dias = DIAS_HISTORIAL[sesion.plan]

  const datos: [string, string | null][] = [
    ['Contacto', lead.nombre],
    ['Cargo', lead.cargo],
    ['Empresa', lead.empresa],
    ['RUC', lead.ruc],
    ['Colaboradores', lead.colaboradores],
    ['Ciudad', lead.ciudad],
    ['Teléfono', lead.telefono],
    ['Necesidad', lead.necesidad],
    ['Urgencia', lead.urgencia],
    ['Encaje', lead.encaje === null ? null : `${lead.encaje} / 100`],
    ['Ángulo', angulo ? `${angulo.servicio} (${angulo.codigo})` : null],
    ['Origen', ORIGEN_LEGIBLE[lead.origen]],
    ['Primer contacto', fechaHora(lead.primer_contacto_at)],
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-bold text-2xl tracking-tight">
          {lead.empresa ?? lead.nombre ?? lead.telefono}
        </h1>
        <Etiqueta tono="primario">{ETAPA_LEGIBLE[lead.etapa]}</Etiqueta>
        {ventanaAbierta(lead.ultimo_inbound_at, lead.ventana_horas) ? (
          <Etiqueta tono="exito">WhatsApp abierto: se le puede responder gratis</Etiqueta>
        ) : (
          <Etiqueta>WhatsApp cerrado: esperar a que escriba</Etiqueta>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <CabeceraTarjeta titulo="Datos" />
          <dl className="grid gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-2">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt className="text-[var(--texto-suave)] text-xs">{etiqueta}</dt>
                <dd className="mt-0.5">
                  {valor ?? <span className="text-[var(--texto-suave)]">Sin dato</span>}
                </dd>
              </div>
            ))}
          </dl>
          {lead.motivo_descarte ? (
            <p className="border-[var(--borde)] border-t px-4 py-3 text-sm">
              Motivo de descarte: {lead.motivo_descarte}
            </p>
          ) : null}
        </Tarjeta>

        <div className="flex flex-col gap-4">
          <Tarjeta className="p-4">
            <FormEtapa etapa={lead.etapa} leadId={lead.id} />
          </Tarjeta>
          <Tarjeta className="p-4">
            <FormNota leadId={lead.id} />
          </Tarjeta>
        </div>
      </div>

      <Tarjeta>
        <CabeceraTarjeta titulo="Reuniones" />
        {citas.length === 0 ? (
          <Vacio mensaje="Sin reuniones con este lead." />
        ) : (
          <ul className="divide-y divide-[var(--borde)] text-sm">
            {citas.map((c) => (
              <li className="flex flex-wrap justify-between gap-2 px-4 py-3" key={c.id}>
                <span>
                  {fechaHora(c.inicia_at)} · {c.modalidad}
                </span>
                <Etiqueta>{c.estado}</Etiqueta>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Actividad"
          extra={
            dias !== null ? (
              <span className="text-[var(--texto-suave)] text-xs">Últimos {dias} días</span>
            ) : undefined
          }
        />
        {actividad.length === 0 ? (
          <Vacio mensaje="Sin actividad registrada." />
        ) : (
          <ul className="divide-y divide-[var(--borde)] text-sm">
            {actividad.map((a) => (
              <li className="px-4 py-3" key={a.id}>
                <p className="text-[var(--texto-suave)] text-xs">
                  {TIPO_LEGIBLE[a.tipo]}
                  {a.autor ? ` · ${a.autor}` : ''} · {fechaHora(a.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{a.contenido}</p>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
