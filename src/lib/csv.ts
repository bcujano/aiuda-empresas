/**
 * CSV que Excel abre bien en español: separador «;», comillas cuando hace
 * falta y marca BOM para que respete tildes y ñ.
 */
export type Columna<T> = {
  titulo: string
  valor: (fila: T) => string | number | boolean | null | undefined
}

function celda(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function aCsv<T>(filas: T[], columnas: Columna<T>[]): string {
  const cabecera = columnas.map((c) => celda(c.titulo)).join(';')
  const cuerpo = filas.map((f) => columnas.map((c) => celda(c.valor(f))).join(';'))
  return `﻿${[cabecera, ...cuerpo].join('\r\n')}\r\n`
}
