'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Charla, Persona } from '@/lib/informe-modelo'

/** Piezas del editor del informe: campos y listas editables. */

export function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <span aria-hidden className="text-[var(--texto-suave)]">
        {etiqueta}
      </span>
      {children}
    </div>
  )
}

export function Num({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string
  valor: number
  alCambiar: (n: number) => void
}) {
  return (
    <Campo etiqueta={etiqueta}>
      <input
        className="campo"
        min={0}
        onChange={(e) => alCambiar(Number(e.target.value) || 0)}
        step="any"
        type="number"
        value={valor}
      />
    </Campo>
  )
}

export function Txt({
  etiqueta,
  valor,
  alCambiar,
  largo = false,
}: {
  etiqueta: string
  valor: string
  alCambiar: (t: string) => void
  largo?: boolean
}) {
  return (
    <Campo etiqueta={etiqueta}>
      {largo ? (
        <textarea
          className="campo min-h-16"
          onChange={(e) => alCambiar(e.target.value)}
          value={valor}
        />
      ) : (
        <input
          aria-label={etiqueta}
          className="campo"
          onChange={(e) => alCambiar(e.target.value)}
          value={valor}
        />
      )}
    </Campo>
  )
}

export function Explicacion({
  valor,
  alCambiar,
}: {
  valor: string
  alCambiar: (t: string) => void
}) {
  return (
    <Txt
      alCambiar={alCambiar}
      etiqueta="Explicación breve que verá el cliente"
      largo
      valor={valor}
    />
  )
}

/** Llave de lista posicional: estas listas se editan en sitio y no tienen identificador propio. */
export const llave = (prefijo: string, i: number) => `${prefijo}:${i}`

const VACIA: Persona = { nombre: '', empresa: '', fecha: '', nota: '' }

export function ListaPersonas({
  titulo,
  lista,
  alCambiar,
}: {
  titulo: string
  lista: Persona[]
  alCambiar: (l: Persona[]) => void
}) {
  const poner = (i: number, k: keyof Persona, v: string) =>
    alCambiar(lista.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-sm">{titulo}</p>
      {lista.map((p, i) => (
        <div
          className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_90px_1.4fr_auto]"
          key={llave(`k`, i)}
        >
          <Txt alCambiar={(v) => poner(i, 'nombre', v)} etiqueta="Nombre" valor={p.nombre} />
          <Txt alCambiar={(v) => poner(i, 'empresa', v)} etiqueta="Empresa" valor={p.empresa} />
          <Txt alCambiar={(v) => poner(i, 'fecha', v)} etiqueta="Fecha" valor={p.fecha} />
          <Txt alCambiar={(v) => poner(i, 'nota', v)} etiqueta="Nota" valor={p.nota} />
          <button
            aria-label="Quitar"
            className="boton boton-suave"
            onClick={() => alCambiar(lista.filter((_, j) => j !== i))}
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {lista.length < 5 ? (
        <button
          className="boton boton-suave self-start"
          onClick={() => alCambiar([...lista, { ...VACIA }])}
          type="button"
        >
          <Plus size={14} /> Agregar
        </button>
      ) : null}
    </div>
  )
}

export function EditorCharla({
  charla,
  alCambiar,
  alQuitar,
}: {
  charla: Charla
  alCambiar: (c: Charla) => void
  alQuitar: () => void
}) {
  const poner = (i: number, cambio: Partial<Charla['mensajes'][number]>) =>
    alCambiar({
      ...charla,
      mensajes: charla.mensajes.map((m, j) => (j === i ? { ...m, ...cambio } : m)),
    })
  return (
    <div className="tarjeta flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <Txt
            alCambiar={(v) => alCambiar({ ...charla, titulo: v })}
            etiqueta="Título de la conversación"
            valor={charla.titulo}
          />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            checked={charla.ilustrativa}
            onChange={(e) => alCambiar({ ...charla, ilustrativa: e.target.checked })}
            type="checkbox"
          />
          Marcar como ejemplo ilustrativo (simulada)
        </label>
        <button className="boton boton-suave" onClick={alQuitar} type="button">
          <Trash2 size={14} /> Quitar conversación
        </button>
      </div>
      {charla.mensajes.map((m, i) => (
        <div className="grid items-start gap-2 sm:grid-cols-[130px_1fr_auto]" key={llave(`k`, i)}>
          <select
            className="campo"
            onChange={(e) => poner(i, { de: e.target.value as 'contacto' | 'asistente' })}
            value={m.de}
          >
            <option value="contacto">La empresa</option>
            <option value="asistente">El asistente</option>
          </select>
          <textarea
            className="campo min-h-12"
            onChange={(e) => poner(i, { texto: e.target.value })}
            value={m.texto}
          />
          <button
            aria-label="Quitar mensaje"
            className="boton boton-suave"
            onClick={() =>
              alCambiar({ ...charla, mensajes: charla.mensajes.filter((_, j) => j !== i) })
            }
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {charla.mensajes.length < 12 ? (
        <button
          className="boton boton-suave self-start"
          onClick={() =>
            alCambiar({
              ...charla,
              mensajes: [
                ...charla.mensajes,
                {
                  de: charla.mensajes.at(-1)?.de === 'contacto' ? 'asistente' : 'contacto',
                  texto: '',
                },
              ],
            })
          }
          type="button"
        >
          <Plus size={14} /> Agregar mensaje
        </button>
      ) : null}
    </div>
  )
}

export function ListaTextos({
  titulo,
  lista,
  alCambiar,
}: {
  titulo: string
  lista: string[]
  alCambiar: (l: string[]) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-sm">{titulo}</p>
      {lista.map((t, i) => (
        <div className="flex items-start gap-2" key={llave(`k`, i)}>
          <textarea
            className="campo min-h-12"
            onChange={(e) => alCambiar(lista.map((x, j) => (j === i ? e.target.value : x)))}
            value={t}
          />
          <button
            aria-label="Quitar"
            className="boton boton-suave"
            onClick={() => alCambiar(lista.filter((_, j) => j !== i))}
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        className="boton boton-suave self-start"
        onClick={() => alCambiar([...lista, ''])}
        type="button"
      >
        <Plus size={14} /> Agregar
      </button>
    </div>
  )
}
