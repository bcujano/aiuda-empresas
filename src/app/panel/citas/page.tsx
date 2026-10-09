import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendario } from '@/components/panel/calendario'
import { DetalleCita } from '@/components/panel/detalle-cita'
import { CabeceraTarjeta, Tarjeta, Vacio } from '@/components/ui/primitivos'
import { exigir } from '@/lib/auth'
import { diaQuito, inicioDia, lunesDe, sumarDias } from '@/lib/calendario'
import { fecha } from '@/lib/formato'
import { citasEntre, horarioDeOrganizacion } from '@/server/citas-y-angulos'

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; cita?: string }>
}) {
  const sesion = await exigir('citas')
  if (!sesion) redirect('/panel')
  const { semana, cita } = await searchParams
  const lunes = lunesDe(semana)
  const [citas, horario] = await Promise.all([
    citasEntre(sesion.org.id, inicioDia(lunes), inicioDia(sumarDias(lunes, 7))),
    horarioDeOrganizacion(sesion.org.id),
  ])
  const elegida = citas.find((c) => c.id === cita)
  const vivas = citas.filter((c) => c.estado === 'agendada' || c.estado === 'confirmada')
  const porConfirmar = vivas.filter((c) => c.estado === 'agendada').length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Agenda</h1>
          <p className="text-[var(--texto-suave)] text-sm">
            Semana del {fecha(lunes)} · {vivas.length} reuniones
            {porConfirmar ? ` · ${porConfirmar} por confirmar` : ''}
          </p>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            aria-label="Semana anterior"
            className="boton boton-suave"
            href={`/panel/citas?semana=${sumarDias(lunes, -7)}`}
          >
            <ChevronLeft size={16} />
          </Link>
          <Link className="boton boton-suave" href="/panel/citas">
            Hoy
          </Link>
          <Link
            aria-label="Semana siguiente"
            className="boton boton-suave"
            href={`/panel/citas?semana=${sumarDias(lunes, 7)}`}
          >
            <ChevronRight size={16} />
          </Link>
        </nav>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Leyenda clase="bg-[var(--aviso)]" texto="Por confirmar" />
        <Leyenda clase="bg-[var(--exito)]" texto="Confirmada" />
        <Leyenda clase="bg-[var(--primario)]" texto="Asistió" />
        <Leyenda clase="bg-[var(--borde)]" texto="Cancelada" />
        <Leyenda
          clase="bg-[repeating-linear-gradient(135deg,var(--borde),var(--borde)_3px,transparent_3px,transparent_6px)]"
          texto="Fuera del horario de atención"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Tarjeta className="p-3">
          <Calendario
            citas={citas}
            horario={horario}
            hoy={diaQuito(new Date())}
            lunes={lunes}
            seleccionada={elegida?.id}
          />
        </Tarjeta>
        <Tarjeta>
          <CabeceraTarjeta titulo="Detalle de la reunión" />
          {elegida ? (
            <DetalleCita cita={elegida} />
          ) : (
            <Vacio mensaje="Toca una reunión del calendario para ver sus avisos y recordatorios." />
          )}
        </Tarjeta>
      </div>
    </div>
  )
}

function Leyenda({ clase, texto }: { clase: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--texto-suave)]">
      <span className={`inline-block size-3 rounded-sm ${clase}`} />
      {texto}
    </span>
  )
}
