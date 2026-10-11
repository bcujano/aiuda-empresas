import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Plan } from '@/types/database'

/**
 * Planes reales de la base. El de Crecimiento va destacado como recomendado
 * (ancla de precio): es el que tiene el sistema completo de entrada.
 */

const USD = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const RECOMENDADO = 'crecimiento'

export function PlanesAiuda({
  planes,
  boton,
}: {
  planes: Plan[]
  boton: (claro: boolean) => ReactNode
}) {
  if (planes.length === 0) return <div className="mt-8">{boton(false)}</div>
  return (
    <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
      {planes.map((p) => {
        const destacado = p.codigo === RECOMENDADO
        return (
          <article
            className={`relative flex flex-col rounded-3xl p-6 ${
              destacado
                ? 'bg-[var(--tinta)] text-white shadow-2xl shadow-[rgb(15_30_51/0.35)] xl:-my-4 xl:py-10'
                : 'bg-white ring-1 ring-[var(--linea)]'
            }`}
            key={p.codigo}
          >
            {destacado ? (
              <span className="absolute -top-3 left-6 rounded-full bg-[var(--esmeralda)] px-3 py-1 font-semibold text-white text-xs">
                Recomendado
              </span>
            ) : null}
            <h3 className="font-bold text-xl">{p.nombre}</h3>
            <p
              className={`mt-1 min-h-10 text-sm ${destacado ? 'text-white/70' : 'text-[var(--tinta-suave)]'}`}
            >
              {p.descripcion}
            </p>
            <p className="mt-4">
              <span className="font-bold text-4xl tabular-nums">
                {USD.format(p.precio_mensual)}
              </span>
              <span
                className={`text-sm ${destacado ? 'text-white/70' : 'text-[var(--tinta-suave)]'}`}
              >
                {' '}
                /mes{p.mas_iva ? ' + IVA' : ''}
              </span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
              {p.incluye.map((t) => {
                const pronto = t.includes('(en preparación)')
                return (
                  <li className="flex gap-2" key={t}>
                    <Check
                      aria-hidden
                      className={`mt-0.5 shrink-0 ${destacado ? 'text-[#5ee0a7]' : 'text-[var(--esmeralda)]'}`}
                      size={16}
                    />
                    <span className={pronto ? 'opacity-60' : ''}>{t}</span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-8">{boton(destacado)}</div>
          </article>
        )
      })}
    </div>
  )
}
