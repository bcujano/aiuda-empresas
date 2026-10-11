'use client'

import { useId, useState } from 'react'
import { type Clave, cuentas } from '@/lib/calculadora-reunion'

/**
 * Calculadora de costo por reunión. Los valores iniciales son supuestos de
 * ejemplo, rotulados así y editables: la cuenta es del visitante, con sus
 * números. No es una promesa de resultados.
 */

const CAMPOS: { clave: Clave; texto: string; prefijo?: string; sufijo?: string; paso: number }[] = [
  { clave: 'inversion', texto: 'Inversión mensual en anuncios', prefijo: '$', paso: 50 },
  {
    clave: 'costoConversacion',
    texto: 'Costo por conversación en WhatsApp',
    prefijo: '$',
    paso: 0.5,
  },
  { clave: 'califica', texto: 'De cada 100 que escriben, califican', sufijo: '%', paso: 5 },
  { clave: 'agenda', texto: 'De los calificados, agendan', sufijo: '%', paso: 5 },
  { clave: 'cierre', texto: 'De las reuniones, usted cierra', sufijo: '%', paso: 5 },
  { clave: 'ticket', texto: 'Valor de un cliente nuevo', prefijo: '$', paso: 100 },
]

const INICIAL: Record<Clave, number> = {
  inversion: 300,
  costoConversacion: 3,
  califica: 30,
  agenda: 50,
  cierre: 20,
  ticket: 1500,
}

const USD = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const USD2 = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

export function Calculadora({ precioPlan }: { precioPlan: number }) {
  const [v, setV] = useState(INICIAL)
  const base = useId()
  const r = cuentas(v, precioPlan)
  const redondo = (n: number) => Math.round(n).toLocaleString('es-EC')

  return (
    <div className="grid gap-6 rounded-3xl bg-white p-5 shadow-[0_20px_60px_-30px_rgb(15_30_51/0.35)] ring-1 ring-[var(--linea)] sm:p-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        {CAMPOS.map((c) => (
          <div className="flex flex-col gap-1.5" key={c.clave}>
            <label className="text-[var(--tinta-suave)] text-sm" htmlFor={`${base}-${c.clave}`}>
              {c.texto}
            </label>
            <div className="flex items-center rounded-xl bg-[var(--marfil)] px-3 ring-1 ring-[var(--linea)] focus-within:ring-2 focus-within:ring-[var(--esmeralda)]">
              {c.prefijo ? <span className="text-[var(--tinta-suave)]">{c.prefijo}</span> : null}
              <input
                className="min-h-11 w-full bg-transparent px-1 font-semibold text-lg outline-none"
                id={`${base}-${c.clave}`}
                inputMode="decimal"
                min={0}
                onChange={(e) =>
                  setV({ ...v, [c.clave]: Math.max(0, Number(e.target.value) || 0) })
                }
                step={c.paso}
                type="number"
                value={v[c.clave]}
              />
              {c.sufijo ? <span className="text-[var(--tinta-suave)]">{c.sufijo}</span> : null}
            </div>
          </div>
        ))}
        <p className="text-[var(--tinta-suave)] text-xs sm:col-span-2">
          Los números iniciales son supuestos de ejemplo. Cámbielos por los suyos: la cuenta se
          rehace al instante. No es una promesa de resultados.
        </p>
      </div>

      <div className="flex flex-col justify-between gap-5 rounded-2xl bg-[var(--tinta)] p-6 text-white">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Conversaciones', redondo(r.conversaciones)],
            ['Calificados', redondo(r.calificados)],
            ['Reuniones', redondo(r.reuniones)],
            ['Clientes nuevos', r.clientes.toLocaleString('es-EC', { maximumFractionDigits: 1 })],
          ].map(([t, n]) => (
            <div key={t}>
              <dt className="text-white/60">{t} al mes</dt>
              <dd className="font-bold text-2xl tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
        <div className="border-white/15 border-t pt-5">
          <p className="text-sm text-white/70">Costo por reunión (anuncios + plan Básico)</p>
          <p className="font-bold text-4xl text-[#5ee0a7] tabular-nums">
            {r.costoPorReunion === null ? '—' : USD2.format(r.costoPorReunion)}
          </p>
          <p className="mt-3 text-sm text-white/70">
            Inversión total {USD.format(r.costoTotal)} · ventas estimadas{' '}
            <span className="font-semibold text-white">{USD.format(r.ingreso)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
