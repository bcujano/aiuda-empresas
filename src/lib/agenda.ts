import { ZONA } from '@/lib/formato'

/**
 * Cálculo de espacios libres de la agenda. Puro y sin base de datos: recibe el
 * horario de atención y las citas ocupadas y devuelve las horas de inicio
 * posibles. Quito es UTC-5 fijo, así que la hora local se pasa a UTC sumando 5.
 */

export type TramoHorario = { dia_semana: number; desde: string; hasta: string }
export type Ocupado = { inicia_at: string; termina_at: string }

export type ReglasAgenda = {
  minutos: number
  intervalo: number
  anticipacionHoras: number
  diasAdelante: number
}

const DESFASE_HORAS = 5
const MINUTO = 60_000

function aMinutos(hora: string): number {
  const [h = '0', m = '0'] = hora.split(':')
  return Number(h) * 60 + Number(m)
}

/** Fecha de Quito (año, mes, día) del instante dado. */
function fechaQuito(instante: Date): { y: number; m: number; d: number } {
  const local = new Date(instante.getTime() - DESFASE_HORAS * 3_600_000)
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate() }
}

export function calcularEspacios(
  horarios: TramoHorario[],
  ocupados: Ocupado[],
  reglas: ReglasAgenda,
  ahora: Date,
): Date[] {
  const minimo = ahora.getTime() + reglas.anticipacionHoras * 3_600_000
  const rangos = ocupados.map((o) => [Date.parse(o.inicia_at), Date.parse(o.termina_at)] as const)
  const hoy = fechaQuito(ahora)
  const salida: Date[] = []

  for (let i = 0; i <= reglas.diasAdelante; i++) {
    const base = Date.UTC(hoy.y, hoy.m, hoy.d + i)
    const diaJs = new Date(base).getUTCDay()
    const diaSemana = diaJs === 0 ? 7 : diaJs
    for (const tramo of horarios.filter((h) => h.dia_semana === diaSemana)) {
      const fin = aMinutos(tramo.hasta)
      for (let t = aMinutos(tramo.desde); t + reglas.minutos <= fin; t += reglas.intervalo) {
        const inicio = base + (t + DESFASE_HORAS * 60) * MINUTO
        const termino = inicio + reglas.minutos * MINUTO
        if (inicio < minimo) continue
        if (rangos.some(([a, b]) => inicio < b && termino > a)) continue
        salida.push(new Date(inicio))
      }
    }
  }
  return salida.sort((a, b) => a.getTime() - b.getTime())
}

/** Pocos espacios repartidos: como máximo `porDia` por día y `total` en total. */
export function repartir(espacios: Date[], porDia = 3, total = 12): Date[] {
  const cuenta = new Map<string, number>()
  const salida: Date[] = []
  for (const e of espacios) {
    const dia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(e)
    const n = cuenta.get(dia) ?? 0
    if (n >= porDia) continue
    cuenta.set(dia, n + 1)
    salida.push(e)
    if (salida.length >= total) break
  }
  return salida
}

/** «martes 14 de octubre, 10:00» en hora de Quito. */
export function etiquetaHora(instante: Date | string): string {
  const fecha = new Date(instante)
  const dia = new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fecha)
  const hora = new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fecha)
  return `${dia.replace(',', '')}, ${hora}`
}
