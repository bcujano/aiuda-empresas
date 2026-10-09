import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Etiqueta } from '@/components/ui/primitivos'
import { exigir } from '@/lib/auth'
import { ETAPA_LEGIBLE, fechaHora, ORIGEN_LEGIBLE } from '@/lib/formato'
import { ventanaAbierta } from '@/lib/whatsapp'
import { listarAngulos } from '@/server/citas-y-angulos'
import { listarLeads } from '@/server/leads'
import { ETAPAS } from '@/types/database'

export default async function Pipeline() {
  const sesion = await exigir('leads')
  if (!sesion) redirect('/panel')

  const [leads, angulos] = await Promise.all([
    listarLeads(sesion.org.id),
    listarAngulos(sesion.org.id),
  ])
  const codigoAngulo = new Map(angulos.map((a) => [a.id, a.codigo]))

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl tracking-tight">Pipeline</h1>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ETAPAS.map((etapa) => {
          const columna = leads.filter((l) => l.etapa === etapa)
          return (
            <section
              className="columna-pipeline w-72 shrink-0 rounded-xl bg-[var(--borde)]/40 p-2"
              key={etapa}
            >
              <h2 className="flex items-center justify-between px-2 py-1 font-semibold text-sm">
                {ETAPA_LEGIBLE[etapa]}
                <span className="text-[var(--texto-suave)] text-xs">{columna.length}</span>
              </h2>
              <div className="mt-2 flex flex-col gap-2">
                {columna.map((lead) => {
                  const abierta = ventanaAbierta(lead.ultimo_inbound_at, lead.ventana_horas)
                  return (
                    <Link
                      className="tarjeta tarjeta-arrastrable block p-3 text-sm"
                      href={`/panel/leads/${lead.id}`}
                      key={lead.id}
                    >
                      <p className="font-medium">{lead.empresa ?? lead.nombre ?? lead.telefono}</p>
                      {lead.empresa && lead.nombre ? (
                        <p className="text-[var(--texto-suave)] text-xs">
                          {lead.nombre}
                          {lead.cargo ? ` · ${lead.cargo}` : ''}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {lead.angulo_id ? (
                          <Etiqueta>{codigoAngulo.get(lead.angulo_id)}</Etiqueta>
                        ) : null}
                        <Etiqueta>{ORIGEN_LEGIBLE[lead.origen]}</Etiqueta>
                        {abierta ? <Etiqueta tono="exito">WhatsApp abierto</Etiqueta> : null}
                      </div>
                      <p className="mt-2 text-[var(--texto-suave)] text-xs">
                        {fechaHora(lead.updated_at)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
