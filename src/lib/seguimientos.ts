/**
 * Reglas puras del seguimiento por WhatsApp (sin base de datos): cuándo se
 * puede escribir, cómo se rellena el texto y cuándo la persona pidió la baja.
 */

export type Paso = { minutos: number; texto: string; plantilla: string | null }

/** Horario en que se envía seguimiento: 08:00 a 19:59 de Quito (UTC-5 fijo). */
export function horaDeEnviar(ahora: Date): boolean {
  const hora = (ahora.getUTCHours() + 24 - 5) % 24
  return hora >= 8 && hora < 20
}

/** Rellena {nombre} {organizacion} {especialista} {servicio}; si falta el nombre, lo omite con elegancia. */
export function rellenar(texto: string, v: Record<string, string | null | undefined>): string {
  return texto
    .replace(/\s*\{nombre\}/g, v.nombre ? ` ${v.nombre}` : '')
    .replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '')
    .replace(/^\s+/, '')
    .replace(/\s+([,.?!])/g, '$1')
    .replace(/^,\s*/, '')
    .replace(/^\p{Ll}/u, (c) => c.toUpperCase())
}

const BAJA =
  /\b(baja|stop|no me (escriban|escribas|contacten|interesa)|no gracias|dejen de escribir|eliminen mi n[uú]mero)\b/i

/** ¿La persona pidió que no le escriban más? */
export function pideBaja(texto: string | undefined | null): boolean {
  return !!texto && BAJA.test(texto)
}

/** Quito: ¿la ventana gratis sigue abierta al menos 5 minutos más? */
export function ventanaLibre(ultimoInbound: string | null, horas: number, ahora: Date): boolean {
  if (!ultimoInbound) return false
  return Date.parse(ultimoInbound) + horas * 3_600_000 - 5 * 60_000 > ahora.getTime()
}
