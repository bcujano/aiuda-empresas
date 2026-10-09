'use client'

import { Loader2 } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useState, useTransition } from 'react'

/** Piezas compartidas. Densas, utilitarias y con foco visible. */

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`tarjeta ${className}`}>{children}</section>
}

export function CabeceraTarjeta({ titulo, extra }: { titulo: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-[var(--borde)] border-b px-4 py-3">
      <h2 className="font-semibold text-sm">{titulo}</h2>
      {extra}
    </div>
  )
}

/** Envoltorio corto para las pantallas que solo necesitan un título. */
export function TituloSeccion({ children }: { children: ReactNode }) {
  return <CabeceraTarjeta titulo={children} />
}

export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap border-[var(--borde)] border-b px-3 py-2 text-left font-medium text-[10px] text-[var(--texto-suave)] uppercase tracking-wider ${className}`}
      scope="col"
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`border-[var(--borde)] border-b px-3 py-2 align-middle ${className}`}>
      {children}
    </td>
  )
}

type VarianteBoton = 'primario' | 'suave' | 'peligro'

export function Boton({
  className = '',
  variante = 'primario',
  ...props
}: ComponentProps<'button'> & { variante?: VarianteBoton }) {
  return <button className={`boton boton-${variante} ${className}`} type="button" {...props} />
}

export function Campo({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`campo ${className}`} {...props} />
}

export function Seleccion({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`campo ${className}`} {...props} />
}

export function Etiquetado({
  texto,
  para,
  children,
  className = '',
}: {
  texto: string
  para: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="font-medium text-sm" htmlFor={para}>
        {texto}
      </label>
      {children}
    </div>
  )
}

/** Estado vacío: siempre con un mensaje que dice qué falta. */
export function Vacio({ mensaje, accion }: { mensaje: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <p className="text-[var(--texto-suave)] text-sm">{mensaje}</p>
      {accion}
    </div>
  )
}

export type Tono = 'neutro' | 'exito' | 'aviso' | 'peligro' | 'primario'

const TONOS: Record<Tono, string> = {
  neutro: 'bg-[var(--fondo)] text-[var(--texto-suave)]',
  exito: 'bg-[var(--exito-suave)] text-[var(--exito)]',
  aviso: 'bg-[var(--aviso-suave)] text-[var(--aviso)]',
  peligro: 'bg-[var(--peligro-suave)] text-[var(--peligro)]',
  primario: 'bg-[var(--primario)] text-white',
}

export function Etiqueta({ children, tono = 'neutro' }: { children: ReactNode; tono?: Tono }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 font-medium text-xs ${TONOS[tono]}`}
    >
      {children}
    </span>
  )
}

export type Resultado = { error?: string; aviso?: string; ok?: boolean }

export function Aviso({ estado }: { estado: Resultado }) {
  if (estado.error) {
    return (
      <p
        className="rounded-lg bg-[var(--peligro-suave)] px-3 py-2 text-[var(--peligro)] text-sm"
        role="alert"
      >
        {estado.error}
      </p>
    )
  }
  if (estado.aviso) {
    return (
      <p
        className="rounded-lg bg-[var(--exito-suave)] px-3 py-2 text-[var(--exito)] text-sm"
        role="status"
      >
        {estado.aviso}
      </p>
    )
  }
  return null
}

/**
 * Botón que ejecuta una acción de servidor y muestra su resultado.
 * Con `confirmacion` pide confirmación nombrando lo que va a pasar: borrar
 * algo nunca debe ser un clic distraído.
 */
export function BotonAccion({
  texto,
  onEjecutar,
  variante = 'suave',
  confirmacion,
  icono,
  className = '',
}: {
  texto: string
  onEjecutar: () => Promise<Resultado>
  variante?: VarianteBoton
  confirmacion?: string
  icono?: ReactNode
  className?: string
}) {
  const [estado, setEstado] = useState<Resultado>({})
  const [pendiente, iniciar] = useTransition()

  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <Boton
        disabled={pendiente}
        onClick={() => {
          if (confirmacion && !window.confirm(confirmacion)) return
          iniciar(async () => setEstado(await onEjecutar()))
        }}
        variante={variante}
      >
        {pendiente ? <Loader2 className="animate-spin" size={14} /> : icono}
        {texto}
      </Boton>
      <Aviso estado={estado} />
    </span>
  )
}
