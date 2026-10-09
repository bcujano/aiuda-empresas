import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CabeceraTarjeta, Tabla, Tarjeta, Td, Th, Vacio } from '@/components/ui/primitivos'
import { verifyAuth } from '@/lib/auth'
import { ETAPA_LEGIBLE, fechaHora } from '@/lib/formato'
import { PLAN_LEGIBLE } from '@/lib/planes'
import { listarAngulos, proximasCitas } from '@/server/citas-y-angulos'
import { conteoPorEtapa, embudoPorAngulo, listarLeads } from '@/server/leads'
import { ETAPAS } from '@/types/database'

function porcentaje(parte: number, total: number): string {
  return total === 0 ? '—' : `${Math.round((parte / total) * 100)} %`
}

export default async function Resumen() {
  const sesion = await verifyAuth()
  if (!sesion) redirect('/login')
  if (!sesion.org) redirect('/panel/organizaciones')

  const org = sesion.org
  const [leads, angulos, citas] = await Promise.all([
    listarLeads(org.id),
    listarAngulos(org.id),
    proximasCitas(org.id),
  ])
  const conteo = conteoPorEtapa(leads)
  const embudo = embudoPorAngulo(leads, angulos)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-bold text-2xl tracking-tight">{org.nombre}</h1>
        <p className="text-[var(--texto-suave)] text-sm">
          Plan: {PLAN_LEGIBLE[sesion.plan ?? org.estado_plan]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ETAPAS.map((etapa) => (
          <Link
            className="tarjeta p-4 hover:border-[var(--primario)]"
            href="/panel/pipeline"
            key={etapa}
          >
            <p className="text-[var(--texto-suave)] text-xs">{ETAPA_LEGIBLE[etapa]}</p>
            <p className="mt-1 font-bold text-2xl">{conteo[etapa]}</p>
          </Link>
        ))}
      </div>

      <Tarjeta>
        <CabeceraTarjeta titulo="Embudo por ángulo" />
        {leads.length === 0 ? (
          <Vacio mensaje="Todavía no hay leads. Aparecen aquí cuando alguien escribe al WhatsApp del cliente." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Ángulo</Th>
                <Th className="text-right">Leads</Th>
                <Th className="text-right">Calificados</Th>
                <Th className="text-right">Reuniones</Th>
                <Th className="text-right">Lead → reunión</Th>
              </tr>
            </thead>
            <tbody>
              {embudo.map((fila) => (
                <tr key={fila.angulo?.id ?? 'sin'}>
                  <Td>
                    {fila.angulo
                      ? `${fila.angulo.servicio} (${fila.angulo.codigo})`
                      : 'Sin ángulo identificado'}
                  </Td>
                  <Td className="text-right">{fila.leads}</Td>
                  <Td className="text-right">{fila.calificados}</Td>
                  <Td className="text-right">{fila.agendados}</Td>
                  <Td className="text-right">{porcentaje(fila.agendados, fila.leads)}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta
          titulo="Próximas reuniones"
          extra={
            <Link className="text-sm text-[var(--primario)]" href="/panel/citas">
              Ver todas
            </Link>
          }
        />
        {citas.length === 0 ? (
          <Vacio mensaje="No hay reuniones agendadas." />
        ) : (
          <ul className="divide-y divide-[var(--borde)]">
            {citas.slice(0, 5).map((c) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                key={c.id}
              >
                <Link className="font-medium hover:underline" href={`/panel/leads/${c.lead.id}`}>
                  {c.lead.empresa ?? c.lead.nombre ?? c.lead.telefono}
                </Link>
                <span className="text-[var(--texto-suave)]">{fechaHora(c.inicia_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
