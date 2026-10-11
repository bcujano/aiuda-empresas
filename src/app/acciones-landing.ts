'use server'

import { esquemaSolicitud, registrarSolicitud } from '@/server/solicitud-llamada'

export type EstadoSolicitud = { ok?: boolean; error?: string }

/** «Prefiero que me llamen»: valida, descarta bots (campo trampa) y deja el lead. */
export async function pedirLlamada(
  _previo: EstadoSolicitud,
  datos: FormData,
): Promise<EstadoSolicitud> {
  if (String(datos.get('sitio_web') ?? '') !== '') return { ok: true }
  const analisis = esquemaSolicitud.safeParse(Object.fromEntries(datos.entries()))
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? 'Revise sus datos.' }
  }
  const r = await registrarSolicitud(analisis.data)
  if (!r.ok) return { error: 'No pudimos registrar su pedido. Escríbanos por WhatsApp, por favor.' }
  return { ok: true }
}
