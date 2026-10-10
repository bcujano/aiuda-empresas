import { redirect } from 'next/navigation'
import { AgendaCalendario } from '@/components/panel/agenda-calendario'
import { exigir } from '@/lib/auth'
import { leadsParaAgendar } from '@/server/agenda-equipo'
import { horarioDeOrganizacion } from '@/server/citas-y-angulos'

const hhmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export default async function Agenda() {
  const sesion = await exigir('citas')
  if (!sesion) redirect('/panel')
  const [horario, leads] = await Promise.all([
    horarioDeOrganizacion(sesion.org.id),
    leadsParaAgendar(sesion.org.id),
  ])
  const tramos = Object.entries(horario).flatMap(([dia, lista]) =>
    lista.map(([desde, hasta]) => ({ dia: Number(dia), desde: hhmm(desde), hasta: hhmm(hasta) })),
  )
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Agenda</h1>
        <p className="text-[var(--texto-suave)] text-sm">
          Ámbar: por confirmar · Verde: confirmada · Azul: asistió · Rojo: no asistió · Gris:
          cancelada
        </p>
      </div>
      <AgendaCalendario horario={tramos} leads={leads} modalidades={sesion.org.modalidades} />
    </div>
  )
}
