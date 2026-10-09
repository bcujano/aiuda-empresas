/**
 * Enlaces de WhatsApp de las landings. Cada mensaje lleva una referencia
 * `<ORG>-<ANGULO>` (p. ej. FAG-TRI): el agente la lee para saber de qué
 * servicio viene el lead y el CRM la usa para medir cada ángulo.
 */

export function referencia(codigoOrg: string, codigoAngulo: string): string {
  return `${codigoOrg}-${codigoAngulo}`
}

export function enlaceWhatsApp(numeroE164: string, mensaje: string, ref: string): string {
  const numero = numeroE164.replace(/^\+/, '')
  const texto = `${mensaje} (Ref. ${ref})`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

/** Extrae la referencia de un mensaje entrante. Devuelve null si no hay. */
export function leerReferencia(texto: string): { org: string; angulo: string } | null {
  const coincidencia = /\bRef\.?\s*([A-Z]{2,5})-([A-Z0-9]{2,6})\b/i.exec(texto)
  if (!coincidencia?.[1] || !coincidencia[2]) return null
  return { org: coincidencia[1].toUpperCase(), angulo: coincidencia[2].toUpperCase() }
}

/**
 * ¿Está abierta la ventana gratis de WhatsApp? 72 h si el lead entró por un
 * anuncio Click-to-WhatsApp, 24 h en otro caso. Fuera de ella no se escribe.
 */
export function ventanaAbierta(
  ultimoInbound: string | null,
  horas: 24 | 72,
  ahora: Date = new Date(),
): boolean {
  if (!ultimoInbound) return false
  const limite = Date.parse(ultimoInbound) + horas * 3_600_000
  return ahora.getTime() < limite
}
