'use client'

import FullCalendar, { type EventInput } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import esLocale from '@fullcalendar/react/locales/es'
import formaTheme from '@fullcalendar/react/themes/forma'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/forma/theme.css'
import '@fullcalendar/react/themes/forma/palettes/blue.css'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { citasDelRangoAccion, estadoCitaAccion, moverCitaAccion } from '@/app/panel/citas/acciones'
import { DetalleCita } from '@/components/panel/detalle-cita'
import { NuevaCita } from '@/components/panel/nueva-cita'
import { Aviso, type Resultado } from '@/components/ui/primitivos'
import type { CitaConLead } from '@/server/citas-y-angulos'

const COLOR: Record<string, string> = {
  agendada: '#d97706',
  confirmada: '#1e7a46',
  asistio: '#1f3a5f',
  no_asistio: '#b3261e',
  cancelada: '#98a2b3',
}

type LeadAgendable = { id: string; nombre: string | null; empresa: string | null; telefono: string }

export function AgendaCalendario({
  horario,
  leads,
  modalidades,
}: {
  /** Tramos de atención: día (1 = lunes) y horas HH:MM. */
  horario: { dia: number; desde: string; hasta: string }[]
  leads: LeadAgendable[]
  modalidades: string[]
}) {
  const [elegida, setElegida] = useState<CitaConLead | null>(null)
  const [nueva, setNueva] = useState<string | null>(null)
  const [estado, setEstado] = useState<Resultado>({})
  const [pendiente, iniciar] = useTransition()

  // Las reuniones se piden después de pintar (nunca durante el render) y cada vez que cambia el rango.
  const [rango, setRango] = useState<{ desde: string; hasta: string } | null>(null)
  const [eventos, setEventos] = useState<EventInput[]>([])
  const [version, setVersion] = useState(0)
  useEffect(() => {
    // `version` sube al guardar un cambio: vuelve a pedir el mismo rango.
    if (!rango || version < 0) return
    let vigente = true
    citasDelRangoAccion(rango.desde, rango.hasta).then((citas) => {
      if (!vigente) return
      setEventos(
        citas.map((c) => ({
          id: c.id,
          title: `${c.lead.empresa ?? c.lead.nombre ?? c.lead.telefono} · ${c.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}`,
          start: c.inicia_at,
          end: c.termina_at,
          color: COLOR[c.estado],
          editable: c.estado === 'agendada' || c.estado === 'confirmada',
          extendedProps: { cita: c },
        })),
      )
    })
    return () => {
      vigente = false
    }
  }, [rango, version])
  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const ejecutar = (accion: () => Promise<Resultado>, alTerminar?: () => void) =>
    iniciar(async () => {
      const r = await accion()
      setEstado(r)
      if (r.ok) alTerminar?.()
      recargar()
    })

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <section className="tarjeta p-3">
        <FullCalendar
          allDaySlot={false}
          businessHours={horario.map((h) => ({
            daysOfWeek: [h.dia % 7],
            startTime: h.desde,
            endTime: h.hasta,
          }))}
          editable
          eventClick={(info) => {
            setNueva(null)
            setElegida(info.event.extendedProps.cita as CitaConLead)
          }}
          eventDrop={(info) => {
            const { start, end } = info.event
            if (
              !start ||
              !end ||
              !window.confirm(
                `¿Mover la reunión a ${start.toLocaleString('es-EC')}? Se le avisará al cliente.`,
              )
            ) {
              info.revert()
              return
            }
            ejecutar(() => moverCitaAccion(info.event.id, start.toISOString(), end.toISOString()))
          }}
          eventResize={(info) => {
            const { start, end } = info.event
            if (!start || !end) return info.revert()
            ejecutar(() => moverCitaAccion(info.event.id, start.toISOString(), end.toISOString()))
          }}
          datesSet={(info) => {
            const desde = info.start.toISOString()
            const hasta = info.end.toISOString()
            setTimeout(
              () =>
                setRango((r) => (r?.desde === desde && r.hasta === hasta ? r : { desde, hasta })),
              0,
            )
          }}
          events={eventos}
          headerToolbar={{
            start: 'prev,next today',
            center: 'title',
            end: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek',
          }}
          height="auto"
          initialView="timeGridWeek"
          locale={esLocale}
          nowIndicator
          plugins={[formaTheme, dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          select={(info) => {
            setElegida(null)
            setNueva(info.start.toISOString())
          }}
          selectable
          selectMirror
          slotMaxTime="20:00:00"
          slotMinTime="07:00:00"
          timeZone="America/Guayaquil"
        />
      </section>

      <aside className="tarjeta flex flex-col">
        {nueva ? (
          <NuevaCita
            inicia={nueva}
            leads={leads}
            modalidades={modalidades}
            onCerrar={() => setNueva(null)}
            onCreada={recargar}
          />
        ) : elegida ? (
          <>
            <DetalleCita cita={elegida} />
            {elegida.estado === 'agendada' || elegida.estado === 'confirmada' ? (
              <div className="flex flex-wrap gap-2 border-[var(--borde)] border-t p-5">
                {elegida.estado === 'agendada' ? (
                  <button
                    className="boton boton-primario"
                    disabled={pendiente}
                    onClick={() =>
                      ejecutar(
                        () => estadoCitaAccion(elegida.id, 'confirmada'),
                        () => setElegida({ ...elegida, estado: 'confirmada' }),
                      )
                    }
                    type="button"
                  >
                    Confirmar
                  </button>
                ) : null}
                <button
                  className="boton boton-suave"
                  disabled={pendiente}
                  onClick={() =>
                    ejecutar(
                      () => estadoCitaAccion(elegida.id, 'asistio'),
                      () => setElegida({ ...elegida, estado: 'asistio' }),
                    )
                  }
                  type="button"
                >
                  Asistió
                </button>
                <button
                  className="boton boton-suave"
                  disabled={pendiente}
                  onClick={() =>
                    ejecutar(
                      () => estadoCitaAccion(elegida.id, 'no_asistio'),
                      () => setElegida({ ...elegida, estado: 'no_asistio' }),
                    )
                  }
                  type="button"
                >
                  No asistió
                </button>
                <button
                  className="boton boton-peligro"
                  disabled={pendiente}
                  onClick={() => {
                    if (window.confirm('¿Cancelar la reunión? Se le avisará al cliente.')) {
                      ejecutar(
                        () => estadoCitaAccion(elegida.id, 'cancelada'),
                        () => setElegida({ ...elegida, estado: 'cancelada' }),
                      )
                    }
                  }}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="p-5 text-[var(--texto-suave)] text-sm">
            Toca una reunión para ver sus avisos y recordatorios. Arrástrala para moverla. Toca un
            espacio vacío para agendar a mano.
          </p>
        )}
        <div className="px-5 pb-4">
          <Aviso estado={estado} />
        </div>
      </aside>
    </div>
  )
}
