'use client'

import { Loader2 } from 'lucide-react'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Children, cloneElement, isValidElement, useMemo, useState, useTransition } from 'react'

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

type Orden = { col: number; dir: 'asc' | 'desc' }
type ConHijos = { children?: ReactNode; orden?: string | number }

/** Texto de una celda para ordenar y filtrar. Una celda puede traer `orden` para ordenar por otro valor. */
function textoDe(nodo: ReactNode): string {
  if (nodo === null || nodo === undefined || typeof nodo === 'boolean') return ''
  if (typeof nodo === 'string' || typeof nodo === 'number') return String(nodo)
  if (Array.isArray(nodo)) return nodo.map(textoDe).join(' ')
  if (isValidElement<ConHijos>(nodo)) return textoDe(nodo.props.children)
  return ''
}

function clave(celda: ReactNode): string | number {
  if (isValidElement<ConHijos>(celda) && celda.props.orden !== undefined) return celda.props.orden
  const t = textoDe(celda).trim()
  const n = Number(t.replace(/[$%\s]/g, '').replace(',', '.'))
  return t !== '' && Number.isFinite(n) ? n : t.toLowerCase()
}

function comparar(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { numeric: true })
}

/**
 * Toda tabla del sistema se puede filtrar (cuadro de búsqueda) y ordenar (clic
 * en el encabezado). Trabaja sobre las filas que recibe, sin tocar el DOM.
 */
export function Tabla({ children }: { children: ReactNode }) {
  const [orden, setOrden] = useState<Orden | null>(null)
  const [filtro, setFiltro] = useState('')
  const hijos = Children.toArray(children)
  const cabecera = hijos.find((h) => isValidElement(h) && h.type === 'thead') as
    | ReactElement<ConHijos>
    | undefined
  const cuerpo = hijos.find((h) => isValidElement(h) && h.type === 'tbody') as
    | ReactElement<ConHijos>
    | undefined

  const filas = useMemo(
    () => (cuerpo ? (Children.toArray(cuerpo.props.children) as ReactElement<ConHijos>[]) : []),
    [cuerpo],
  )
  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    let lista = q ? filas.filter((f) => textoDe(f).toLowerCase().includes(q)) : filas
    if (orden) {
      const celdas = (f: ReactElement<ConHijos>) =>
        Children.toArray(f.props.children)[orden.col] as ReactNode
      lista = [...lista].sort((x, y) => {
        const r = comparar(clave(celdas(x)), clave(celdas(y)))
        return orden.dir === 'asc' ? r : -r
      })
    }
    return lista
  }, [filas, filtro, orden])

  if (!cabecera || !cuerpo) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    )
  }

  const fila = Children.toArray(cabecera.props.children)[0] as ReactElement<ConHijos> | undefined
  const encabezados = fila ? Children.toArray(fila.props.children) : []
  const cabeceraViva = (
    <thead>
      <tr>
        {encabezados.map((th, i) => {
          if (!isValidElement<ThProps>(th) || textoDe(th).trim() === '') return th
          return cloneElement(th, {
            orden: orden?.col === i ? orden.dir : null,
            alOrdenar: () =>
              setOrden((o) =>
                o?.col !== i
                  ? { col: i, dir: 'asc' }
                  : o.dir === 'asc'
                    ? { col: i, dir: 'desc' }
                    : null,
              ),
          })
        })}
      </tr>
    </thead>
  )

  return (
    <div>
      {filas.length > 4 ? (
        <div className="flex items-center gap-3 px-3 py-2">
          <input
            aria-label="Filtrar la tabla"
            className="campo max-w-xs"
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar en esta tabla…"
            type="search"
            value={filtro}
          />
          <span className="text-[var(--texto-suave)] text-xs">
            {visibles.length === filas.length
              ? `${filas.length} filas`
              : `${visibles.length} de ${filas.length}`}
          </span>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {cabeceraViva}
          <tbody>{visibles}</tbody>
        </table>
      </div>
    </div>
  )
}

type ThProps = {
  children: ReactNode
  className?: string
  orden?: 'asc' | 'desc' | null
  alOrdenar?: () => void
}

export function Th({ children, className = '', orden = null, alOrdenar }: ThProps) {
  return (
    <th
      aria-sort={orden === 'asc' ? 'ascending' : orden === 'desc' ? 'descending' : undefined}
      className={`whitespace-nowrap border-[var(--borde)] border-b px-3 py-2 text-left font-medium text-[10px] text-[var(--texto-suave)] uppercase tracking-wider ${className}`}
      scope="col"
    >
      {alOrdenar ? (
        <button
          className="inline-flex min-h-0 items-center gap-1 uppercase tracking-wider hover:text-[var(--texto)]"
          onClick={alOrdenar}
          type="button"
        >
          {children}
          <span aria-hidden>{orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : '↕'}</span>
        </button>
      ) : (
        children
      )}
    </th>
  )
}

export function Td({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
  /** Valor con el que se ordena la columna si no es el texto visible (ej. una fecha ISO). */
  orden?: string | number
}) {
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
