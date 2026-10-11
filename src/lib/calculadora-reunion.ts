/**
 * Cuenta de la calculadora de la landing: del dinero en anuncios a reuniones
 * y clientes, con los porcentajes que pone el visitante.
 */

export type Clave = 'inversion' | 'costoConversacion' | 'califica' | 'agenda' | 'cierre' | 'ticket'

export function cuentas(v: Record<Clave, number>, plan: number) {
  const conversaciones = v.costoConversacion > 0 ? v.inversion / v.costoConversacion : 0
  const calificados = conversaciones * (v.califica / 100)
  const reuniones = calificados * (v.agenda / 100)
  const clientes = reuniones * (v.cierre / 100)
  const costoTotal = v.inversion + plan
  return {
    conversaciones,
    calificados,
    reuniones,
    clientes,
    costoPorReunion: reuniones > 0 ? costoTotal / reuniones : null,
    ingreso: clientes * v.ticket,
    costoTotal,
  }
}
