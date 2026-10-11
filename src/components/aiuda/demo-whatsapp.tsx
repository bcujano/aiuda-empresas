'use client'

import { CalendarCheck, CheckCheck, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DEMOS } from './contenido'

/**
 * Teléfono con una conversación de muestra que se reproduce sola, una por
 * rubro. Va rotulada «Simulación»: enseña cómo trabaja el asistente, no es un
 * chat real de un cliente. Quien pidió menos movimiento ve todo de una vez.
 */
export function DemoWhatsApp() {
  const [rubro, setRubro] = useState(0)
  const [visibles, setVisibles] = useState(0)
  const [escribiendo, setEscribiendo] = useState(false)
  const [manual, setManual] = useState(false)
  const lista = useRef<HTMLDivElement>(null)
  const demo = DEMOS[rubro] ?? DEMOS[0]
  const total = demo ? demo.mensajes.length : 0

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibles(total + 1)
      return
    }
    if (visibles > total) {
      if (manual) return
      const t = setTimeout(() => {
        setRubro((rubro + 1) % DEMOS.length)
        setVisibles(0)
      }, 4500)
      return () => clearTimeout(t)
    }
    const siguiente = demo?.mensajes[visibles]
    const esAgente = siguiente?.de === 'agente'
    setEscribiendo(esAgente)
    const t = setTimeout(
      () => {
        setEscribiendo(false)
        setVisibles((v) => v + 1)
      },
      visibles === 0 ? 600 : esAgente ? 1700 : 1100,
    )
    return () => clearTimeout(t)
  }, [visibles, total, rubro, manual, demo])

  useEffect(() => {
    if (visibles < 0) return
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' })
  }, [visibles])

  function cambiar(i: number) {
    setRubro(i)
    setVisibles(0)
    setEscribiendo(false)
    setManual(true)
  }

  if (!demo) return null
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-3 flex flex-wrap justify-center gap-1.5" role="tablist">
        {DEMOS.map((d, i) => (
          <button
            aria-selected={i === rubro}
            className={`rounded-full px-3 py-1.5 font-medium text-xs transition-colors ${
              i === rubro
                ? 'bg-[var(--tinta)] text-white'
                : 'bg-white text-[var(--tinta-suave)] ring-1 ring-[var(--linea)] hover:text-[var(--tinta)]'
            }`}
            key={d.rubro}
            onClick={() => cambiar(i)}
            role="tab"
            type="button"
          >
            {d.rubro}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border-[6px] border-[var(--tinta)] bg-[#efe7dc] shadow-2xl shadow-[rgb(15_30_51/0.25)]">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
          <span className="flex size-9 items-center justify-center rounded-full bg-white/20 font-bold text-sm">
            {demo.empresa.charAt(0)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-sm">{demo.empresa}</span>
            <span className="block text-[11px] text-white/80">
              {escribiendo ? 'escribiendo…' : 'en línea'}
            </span>
          </span>
          <Video aria-hidden size={18} />
        </div>

        <div
          aria-live="polite"
          className="flex h-[22rem] flex-col gap-2 overflow-y-auto px-3 py-4 text-[13px] leading-snug"
          ref={lista}
        >
          <span className="mx-auto mb-1 rounded-md bg-[#fff3c4] px-2 py-0.5 font-semibold text-[#7a5b00] text-[10px] uppercase tracking-wide">
            Simulación
          </span>
          {demo.mensajes.slice(0, visibles).map((m) => (
            <p
              className={`burbuja max-w-[85%] rounded-lg px-3 py-2 shadow-sm ${
                m.de === 'lead' ? 'self-end bg-[#d9fdd3]' : 'self-start bg-white'
              }`}
              key={`${demo.rubro}-${m.texto}`}
            >
              {m.texto}
              {m.de === 'lead' ? (
                <CheckCheck aria-hidden className="ml-1 inline text-[#53bdeb]" size={14} />
              ) : null}
            </p>
          ))}
          {escribiendo ? (
            <p className="burbuja self-start rounded-lg bg-white px-3 py-2 shadow-sm">
              <span className="sr-only">El asistente está escribiendo</span>
              {[0, 1, 2].map((p) => (
                <span
                  aria-hidden
                  className="punto-escribiendo mx-0.5 inline-block size-1.5 rounded-full bg-[#667781]"
                  key={p}
                  style={{ animationDelay: `${p * 0.2}s` }}
                />
              ))}
            </p>
          ) : null}
          {visibles > total ? (
            <div className="burbuja mt-1 flex items-center gap-2 self-center rounded-xl bg-[var(--tinta)] px-3 py-2 text-white text-xs">
              <CalendarCheck aria-hidden className="text-[#5ee0a7]" size={16} />
              <span>
                Reunión agendada · {demo.cita}
                <span className="block text-[10px] text-white/70">
                  Aviso enviado al equipo · recordatorios programados
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
