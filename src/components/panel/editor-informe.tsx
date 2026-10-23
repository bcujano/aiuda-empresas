'use client'

import { FileText, RotateCcw } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { cuentasDolares, type Informe } from '@/lib/informe-modelo'
import { CHARLA_NUEVA } from './editor-informe-datos'
import {
  EditorCharla,
  Explicacion,
  ListaPersonas,
  ListaTextos,
  llave,
  Num,
  Txt,
} from './editor-informe-piezas'

/**
 * Editor del informe del cliente. Todo parte de las cifras reales; cada número y texto se puede ajustar
 * antes de generar el PDF. Los ajustes se recuerdan en este navegador.
 */

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="tarjeta flex flex-col gap-3 p-4">
      <h2 className="font-semibold text-base">{titulo}</h2>
      {children}
    </section>
  )
}

export function EditorInforme({ inicial, claveLocal }: { inicial: Informe; claveLocal: string }) {
  const [d, setD] = useState<Informe>(inicial)
  const [restaurado, setRestaurado] = useState(false)

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(claveLocal)
      if (guardado) setD(JSON.parse(guardado) as Informe)
    } catch {}
    setRestaurado(true)
  }, [claveLocal])
  useEffect(() => {
    if (!restaurado) return
    try {
      localStorage.setItem(claveLocal, JSON.stringify(d))
    } catch {}
  }, [d, claveLocal, restaurado])

  const poner = <K extends keyof Informe>(k: K, v: Informe[K]) => setD((x) => ({ ...x, [k]: v }))
  const exp = (k: keyof Informe['explicaciones'], v: string) =>
    poner('explicaciones', { ...d.explicaciones, [k]: v })
  const dol = (k: keyof Informe['dolares'], v: number) => poner('dolares', { ...d.dolares, [k]: v })
  const c = cuentasDolares(d.dolares, d.inversion)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Informe para el cliente</h1>
          <p className="max-w-2xl text-[var(--texto-suave)] text-sm">
            Parte de las cifras reales. Ajusta números, textos, personas y conversaciones; luego
            genera el PDF. Tus ajustes se recuerdan en este navegador.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="boton boton-suave"
            onClick={() => {
              if (window.confirm('¿Volver a las cifras reales y perder tus ajustes?')) {
                setD(inicial)
                try {
                  localStorage.removeItem(claveLocal)
                } catch {}
              }
            }}
            type="button"
          >
            <RotateCcw size={14} /> Volver a las cifras reales
          </button>
          <form action="/panel/informe/pdf" method="post" target="_blank" rel="noopener">
            <input name="datos" type="hidden" value={JSON.stringify(d)} />
            <button className="boton boton-primario" type="submit">
              <FileText size={14} /> Generar PDF
            </button>
          </form>
        </div>
      </div>

      <Bloque titulo="1 · Cifras del testeo">
        <div className="grid gap-3 sm:grid-cols-3">
          <Txt alCambiar={(v) => poner('cliente', v)} etiqueta="Cliente" valor={d.cliente} />
          <Txt alCambiar={(v) => poner('desde', v)} etiqueta="Desde (AAAA-MM-DD)" valor={d.desde} />
          <Txt alCambiar={(v) => poner('hasta', v)} etiqueta="Hasta (AAAA-MM-DD)" valor={d.hasta} />
          <Num
            alCambiar={(n) => poner('inversion', n)}
            etiqueta="Inversión del testeo (US$)"
            valor={d.inversion}
          />
          <Num
            alCambiar={(n) => poner('contactadas', n)}
            etiqueta="Empresas contactadas"
            valor={d.contactadas}
          />
          <Num
            alCambiar={(n) => poner('respondieron', n)}
            etiqueta="Respondieron como personas"
            valor={d.respondieron}
          />
          <Num
            alCambiar={(n) => poner('interesadas', n)}
            etiqueta="Interesadas en reunión"
            valor={d.interesadas}
          />
          <Num
            alCambiar={(n) => poner('reuniones', n)}
            etiqueta="Reuniones agendadas"
            valor={d.reuniones}
          />
          <Num
            alCambiar={(n) => poner('automaticas', n)}
            etiqueta="Respuestas automáticas"
            valor={d.automaticas}
          />
          <Num
            alCambiar={(n) => poner('rechazos', n)}
            etiqueta="Dijeron que no"
            valor={d.rechazos}
          />
          <Num
            alCambiar={(n) => poner('bajas', n)}
            etiqueta="Pidieron no recibir más"
            valor={d.bajas}
          />
        </div>
        <Explicacion alCambiar={(v) => exp('cifras', v)} valor={d.explicaciones.cifras} />
        <Explicacion alCambiar={(v) => exp('embudo', v)} valor={d.explicaciones.embudo} />
      </Bloque>

      <Bloque titulo="2 · Actividad por día y por sector">
        <div className="grid gap-2 sm:grid-cols-4">
          {d.porDia.map((x, i) => (
            <div className="grid grid-cols-2 gap-1" key={x.dia}>
              <Num
                alCambiar={(n) =>
                  poner(
                    'porDia',
                    d.porDia.map((y, j) => (j === i ? { ...y, n } : y)),
                  )
                }
                etiqueta={`${x.dia.slice(5)} contactadas`}
                valor={x.n}
              />
              <Num
                alCambiar={(n) =>
                  poner(
                    'porDia',
                    d.porDia.map((y, j) => (j === i ? { ...y, resp: n } : y)),
                  )
                }
                etiqueta="respondieron"
                valor={x.resp}
              />
            </div>
          ))}
        </div>
        <Explicacion alCambiar={(v) => exp('actividad', v)} valor={d.explicaciones.actividad} />
        <div className="flex flex-col gap-2">
          {d.porSector.map((s, i) => {
            const ponerS = (cambio: Partial<typeof s>) =>
              poner(
                'porSector',
                d.porSector.map((y, j) => (j === i ? { ...y, ...cambio } : y)),
              )
            return (
              <div className="grid items-end gap-2 sm:grid-cols-4" key={s.sector}>
                <Txt alCambiar={(v) => ponerS({ sector: v })} etiqueta="Sector" valor={s.sector} />
                <Num alCambiar={(n) => ponerS({ n })} etiqueta="Contactadas" valor={s.n} />
                <Num
                  alCambiar={(n) => ponerS({ respondieron: n })}
                  etiqueta="Respondieron"
                  valor={s.respondieron}
                />
                <Num
                  alCambiar={(n) => ponerS({ interesadas: n })}
                  etiqueta="Interesadas"
                  valor={s.interesadas}
                />
              </div>
            )
          })}
        </div>
        <Txt
          alCambiar={(v) => poner('foco', v)}
          etiqueta="Sector a atacar en la siguiente etapa"
          valor={d.foco}
        />
        <Explicacion alCambiar={(v) => exp('sectores', v)} valor={d.explicaciones.sectores} />
      </Bloque>

      <Bloque titulo="3 · Calientes, tibios y fríos (máximo 5 cada uno)">
        <ListaPersonas
          alCambiar={(l) => poner('calientes', l)}
          lista={d.calientes}
          titulo="Calientes: quieren reunirse"
        />
        <ListaPersonas
          alCambiar={(l) => poner('tibios', l)}
          lista={d.tibios}
          titulo="Tibios: conversaron o preguntaron"
        />
        <ListaPersonas
          alCambiar={(l) => poner('frios', l)}
          lista={d.frios}
          titulo="Fríos: sin interés por ahora"
        />
        <Explicacion alCambiar={(v) => exp('calor', v)} valor={d.explicaciones.calor} />
      </Bloque>

      <Bloque titulo="4 · Caso destacado a verificar">
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={d.casoExito.activo}
            onChange={(e) => poner('casoExito', { ...d.casoExito, activo: e.target.checked })}
            type="checkbox"
          />
          Mostrar este caso en el informe
        </label>
        <ListaPersonas
          alCambiar={(l) =>
            poner('casoExito', { ...d.casoExito, persona: l[0] ?? d.casoExito.persona })
          }
          lista={[d.casoExito.persona]}
          titulo="Persona (en «Nota» va lo que pides verificar)"
        />
        <Txt
          alCambiar={(v) => poner('casoExito', { ...d.casoExito, texto: v })}
          etiqueta="Lo que dijo (cita)"
          largo
          valor={d.casoExito.texto}
        />
        <Explicacion alCambiar={(v) => exp('exito', v)} valor={d.explicaciones.exito} />
      </Bloque>

      <Bloque titulo="5 · Conversaciones del asistente (máximo 2 en el PDF)">
        {d.charlas.map((ch, i) => (
          <EditorCharla
            alCambiar={(n) =>
              poner(
                'charlas',
                d.charlas.map((y, j) => (j === i ? n : y)),
              )
            }
            alQuitar={() =>
              poner(
                'charlas',
                d.charlas.filter((_, j) => j !== i),
              )
            }
            charla={ch}
            key={llave(`k`, i)}
          />
        ))}
        {d.charlas.length < 3 ? (
          <button
            className="boton boton-suave self-start"
            onClick={() => poner('charlas', [...d.charlas, structuredClone(CHARLA_NUEVA)])}
            type="button"
          >
            Agregar conversación
          </button>
        ) : null}
        <Explicacion alCambiar={(v) => exp('charlas', v)} valor={d.explicaciones.charlas} />
      </Bloque>

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
    </div>
  )
}
