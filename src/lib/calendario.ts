/**
 * Cuentas de la vista de calendario semanal. Puras: fechas de Quito (UTC-5 fijo)
 * como texto AAAA-MM-DD y posiciones en minutos.
 */

const DESFASE_MS = 5 * 3_600_000
const DIA_MS = 86_400_000

/** AAAA-MM-DD de Quito para un instante. */
export function diaQuito(instante: Date | string): string {
  return new Date(new Date(instante).getTime() - DESFASE_MS).toISOString().slice(0, 10)
}

export function sumarDias(dia: string, n: number): string {
  return new Date(Date.parse(`${dia}T00:00:00Z`) + n * DIA_MS).toISOString().slice(0, 10)
}

/** Lunes de la semana que contiene `dia` (o la de hoy si no viene o es inválido). */
export function lunesDe(dia: string | undefined, ahora: Date = new Date()): string {
  const base = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : diaQuito(ahora)
  const js = new Date(`${base}T00:00:00Z`).getUTCDay()
  return sumarDias(base, js === 0 ? -6 : 1 - js)
}

/** Instante UTC en que empieza ese día en Quito. */
export function inicioDia(dia: string): Date {
  return new Date(Date.parse(`${dia}T00:00:00Z`) + DESFASE_MS)
}

/** Minutos desde la medianoche de Quito. */
export function minutoDelDia(instante: Date | string): number {
  const local = new Date(new Date(instante).getTime() - DESFASE_MS)
  return local.getUTCHours() * 60 + local.getUTCMinutes()
}

/** Bloque de una cita dentro de la grilla: columna (0 = lunes) y posición vertical. */
export function bloque(
  inicia: string,
  termina: string,
  lunes: string,
  horaInicio: number,
  horaFin: number,
): { columna: number; arriba: number; alto: number } | null {
  const columna = Math.round(
    (Date.parse(`${diaQuito(inicia)}T00:00:00Z`) - Date.parse(`${lunes}T00:00:00Z`)) / DIA_MS,
  )
  if (columna < 0 || columna > 6) return null
  const desde = Math.max(minutoDelDia(inicia), horaInicio * 60)
  const hasta = Math.min(
    minutoDelDia(inicia) + (Date.parse(termina) - Date.parse(inicia)) / 60_000,
    horaFin * 60,
  )
  if (hasta <= desde) return null
  return { columna, arriba: desde - horaInicio * 60, alto: hasta - desde }
}
