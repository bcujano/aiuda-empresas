'use client'

import { cuentasDolares, type Informe } from '@/lib/informe-modelo'
import { Bloque, Explicacion, ListaTextos, Num } from './editor-informe-piezas'

/** Bloques 6 y 7 del editor del informe: los dólares, las conclusiones y los próximos pasos. */
export function BloquesFinales({
  d,
  poner,
  exp,
}: {
  d: Informe
  poner: <K extends keyof Informe>(k: K, v: Informe[K]) => void
  exp: (k: keyof Informe['explicaciones'], v: string) => void
}) {
  const dol = (k: keyof Informe['dolares'], v: number) => poner('dolares', { ...d.dolares, [k]: v })
  const c = cuentasDolares(d.dolares, d.inversion)
  return (
    <>
      <Bloque titulo="6 · Los dólares">
        <div className="grid gap-3 sm:grid-cols-4">
          <Num
            alCambiar={(n) => dol('servicioMensual', n)}
            etiqueta="Servicio al mes (US$ + IVA)"
            valor={d.dolares.servicioMensual}
          />
          <Num
            alCambiar={(n) => dol('meses', n)}
            etiqueta="Meses de prueba"
            valor={d.dolares.meses}
          />
          <Num
            alCambiar={(n) => dol('planMensualCliente', n)}
            etiqueta="Plan del cliente nuevo (US$/mes)"
            valor={d.dolares.planMensualCliente}
          />
          <Num
            alCambiar={(n) => dol('propuestaDia', n)}
            etiqueta="Propuesta de inversión (US$ por día)"
            valor={d.dolares.propuestaDia}
          />
        </div>
        <p className="text-sm">
          Costo de la prueba: <b>US$ {c.costoTrimestre + d.inversion}</b> · Un cliente nuevo vale{' '}
          <b>US$ {c.valorAnual}</b> al año · Una reunión que cierre paga la prueba{' '}
          <b>{c.veces.toFixed(1)}</b> veces.
        </p>
        <Explicacion alCambiar={(v) => exp('dolares', v)} valor={d.explicaciones.dolares} />
      </Bloque>

      <Bloque titulo="7 · Conclusiones y próximos pasos">
        <ListaTextos
          alCambiar={(l) => poner('conclusiones', l)}
          lista={d.conclusiones}
          titulo="Conclusiones"
        />
        <ListaTextos
          alCambiar={(l) => poner('pasos', l)}
          lista={d.pasos}
          titulo="Lo que haremos de aquí en adelante"
        />
      </Bloque>
    </>
  )
}
