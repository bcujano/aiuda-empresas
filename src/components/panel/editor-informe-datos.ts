import type { Charla, Informe } from '@/lib/informe-modelo'

/** Conversación en blanco para agregar al informe. */
export const CHARLA_NUEVA: Charla = {
  titulo: 'Nueva conversación',
  ilustrativa: true,
  mensajes: [
    { de: 'contacto', texto: '' },
    { de: 'asistente', texto: '' },
  ],
}

/** Dirección del informe recalculado con las fechas, inversión y propuesta que se ven en pantalla. */
export function enlaceRecalcular(d: Informe): string {
  const q = new URLSearchParams({
    desde: d.desde,
    hasta: d.hasta,
    inversion: String(d.inversion),
    propuesta: String(d.dolares.propuestaDia),
  })
  return `/panel/informe?${q}`
}
