import Link from 'next/link'
import { bloque, sumarDias } from '@/lib/calendario'
import type { CitaConLead } from '@/server/citas-y-angulos'

/**
 * Semana tipo Google Calendar: una columna por día, una fila por hora y cada
 * reunión como un bloque. Se puede leer sin JavaScript (componente de servidor).
 */

const HORA_INICIO = 7
const HORA_FIN = 20
const ALTO_HORA = 56 // px
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const COLOR_ESTADO: Record<string, string> = {
  agendada: 'border-[var(--aviso)] bg-[var(--aviso-suave)] text-[var(--aviso)]',
  confirmada: 'border-[var(--exito)] bg-[var(--exito-suave)] text-[var(--exito)]',
  asistio: 'border-[var(--primario)] bg-[var(--primario)] text-white',
  no_asistio: 'border-[var(--peligro)] bg-[var(--peligro-suave)] text-[var(--peligro)]',
  cancelada: 'border-[var(--borde)] bg-[var(--fondo)] text-[var(--texto-suave)] line-through',
}

export function Calendario({
  lunes,
  hoy,
  citas,
  seleccionada,
  horario,
}: {
  lunes: string
  hoy: string
  citas: CitaConLead[]
  seleccionada?: string
  /** Tramos de atención por día (1 = lunes) en minutos desde medianoche, para sombrear lo cerrado. */
  horario: Record<number, [number, number][]>
}) {
  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)
  const alto = (HORA_FIN - HORA_INICIO) * ALTO_HORA
  const px = (minutos: number) => (minutos / 60) * ALTO_HORA

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-[48px_repeat(7,1fr)]">
        <div />
        {DIAS.map((d, i) => {
          const dia = sumarDias(lunes, i)
          const esHoy = dia === hoy
          return (
            <div className="border-[var(--borde)] border-b px-2 pb-2 text-center" key={d}>
              <p className="text-[var(--texto-suave)] text-xs uppercase">{d}</p>
              <p
                className={`mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full font-semibold ${esHoy ? 'bg-[var(--primario)] text-white' : ''}`}
              >
                {Number(dia.slice(8))}
              </p>
            </div>
          )
        })}

        <div className="relative" style={{ height: alto }}>
          {horas.map((h) => (
            <span
              className="-translate-y-2 absolute right-2 text-[10px] text-[var(--texto-suave)]"
              key={h}
              style={{ top: px((h - HORA_INICIO) * 60) }}
            >
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {DIAS.map((d, i) => {
          const tramos = horario[i + 1] ?? []
          return (
            <div
              className="relative border-[var(--borde)] border-l bg-[repeating-linear-gradient(135deg,var(--fondo),var(--fondo)_6px,transparent_6px,transparent_12px)]"
              key={d}
              style={{ height: alto }}
            >
              {tramos.map(([desde, hasta]) => (
                <div
                  className="absolute inset-x-0 bg-[var(--superficie)]"
                  key={desde}
                  style={{
                    top: px(Math.max(desde - HORA_INICIO * 60, 0)),
                    height: px(Math.min(hasta, HORA_FIN * 60) - Math.max(desde, HORA_INICIO * 60)),
                  }}
                />
              ))}
              {horas.map((h) => (
                <div
                  className="absolute inset-x-0 border-[var(--borde)] border-t"
                  key={h}
                  style={{ top: px((h - HORA_INICIO) * 60) }}
                />
              ))}
              {citas.map((c) => {
                const b = bloque(c.inicia_at, c.termina_at, lunes, HORA_INICIO, HORA_FIN)
                if (!b || b.columna !== i) return null
                const quien = c.lead.empresa ?? c.lead.nombre ?? c.lead.telefono
                return (
                  <Link
                    className={`absolute inset-x-1 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-[11px] leading-tight shadow-sm hover:z-10 hover:shadow-md ${COLOR_ESTADO[c.estado] ?? ''} ${seleccionada === c.id ? 'ring-2 ring-[var(--primario)]' : ''}`}
                    href={`/panel/citas?semana=${lunes}&cita=${c.id}`}
                    key={c.id}
                    scroll={false}
                    style={{ top: px(b.arriba), height: Math.max(px(b.alto), 22) }}
                  >
                    <span className="block truncate font-semibold">{quien}</span>
                    <span className="block truncate opacity-80">
                      {c.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
