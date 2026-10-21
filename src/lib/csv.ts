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

/** Lee un CSV (coma, punto y coma o tabulador; comillas; BOM) y devuelve las filas como listas de celdas. */
export function leerCsv(texto: string): string[][] {
  const t = texto.replace(/^\uFEFF/, '')
  const primera = t.split(/\r?\n/, 1)[0] ?? ''
  const sep = [';', '\t', ','].reduce((mejor, s) =>
    primera.split(s).length > primera.split(mejor).length ? s : mejor,
  )
  const filas: string[][] = []
  let fila: string[] = []
  let actual = ''
  let comillas = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (comillas) {
      if (c === '"' && t[i + 1] === '"') {
        actual += '"'
        i++
      } else if (c === '"') comillas = false
      else actual += c
    } else if (c === '"') comillas = true
    else if (c === sep) {
      fila.push(actual)
      actual = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      fila.push(actual)
      actual = ''
      if (fila.some((x) => x.trim() !== '')) filas.push(fila)
      fila = []
    } else actual += c
  }
  fila.push(actual)
  if (fila.some((x) => x.trim() !== '')) filas.push(fila)
  return filas
}
