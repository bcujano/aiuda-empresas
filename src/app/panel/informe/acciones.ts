'use server'

import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import { esquemaInforme } from '@/lib/informe-modelo'
import {
  cancelarInformePendiente,
  esquemaProgramacion,
  programarInforme,
} from '@/server/informe-envio'

/** Guarda el informe tal como quedó en el editor y lo programa para salir por correo. */
export async function programarInformeAccion(
  datos: string,
  destino: string,
  whatsapp: string,
  asunto: string,
  enviarLocal: string,
): Promise<Resultado> {
  const sesion = await exigir('reportes')
  if (!sesion || sesion.usuario.rol === 'operador') return { error: 'No tienes permiso.' }
  let json: unknown
  try {
    json = JSON.parse(datos)
  } catch {
    return { error: 'El informe no se pudo leer.' }
  }
  const informe = esquemaInforme.safeParse(json)
  if (!informe.success)
    return {
      error: `Revisa el informe: ${informe.error.issues[0]?.path.join('.')} ${informe.error.issues[0]?.message}`,
    }
  // La hora se escribe en hora de Quito (UTC-5, sin cambio de hora).
  const hora = new Date(`${enviarLocal}:00-05:00`)
  if (Number.isNaN(hora.getTime())) return { error: 'La fecha y hora de envío no son válidas.' }
  const p = esquemaProgramacion.safeParse({
    destino,
    whatsapp,
    asunto,
    enviar_at: hora.toISOString(),
  })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Revisa los datos de envío.' }
  if (!(await programarInforme(sesion.org.id, informe.data, p.data))) {
    return { error: 'No se pudo guardar. ¿Corriste el SQL de informes_envio?' }
  }
  return {
    ok: true,
    aviso: `Informe guardado. Saldrá por WhatsApp a +${p.data.whatsapp} el ${enviarLocal.replace('T', ' a las ')} (hora de Quito).`,
  }
}

export async function cancelarInformeAccion(): Promise<Resultado> {
  const sesion = await exigir('reportes')
  if (!sesion || sesion.usuario.rol === 'operador') return { error: 'No tienes permiso.' }
  if (!(await cancelarInformePendiente(sesion.org.id))) return { error: 'No se pudo cancelar.' }
  return { ok: true, aviso: 'Envío cancelado. No saldrá ningún informe.' }
}
