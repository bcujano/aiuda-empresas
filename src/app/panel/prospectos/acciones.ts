'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import {
  agregarProspectos,
  cambiarProspecto,
  esquemaCampana,
  guardarCampana,
} from '@/server/prospectos-panel'

export async function guardarCampanaAccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const sesion = await exigir('prospectos')
  if (!sesion || sesion.usuario.rol === 'operador') return { error: 'No tienes permiso.' }
  const analisis = esquemaCampana.safeParse({
    ...Object.fromEntries(datos.entries()),
    activa: datos.get('activa') === 'on',
  })
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los datos.' }
  if (!(await guardarCampana(sesion.org.id, analisis.data))) return { error: 'No se pudo guardar.' }
  revalidatePath('/panel/prospectos')
  return {
    ok: true,
    aviso: analisis.data.activa ? 'Campaña encendida.' : 'Campaña guardada y apagada.',
  }
}

export async function agregarProspectosAccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const sesion = await exigir('prospectos')
  if (!sesion || sesion.usuario.rol === 'operador') return { error: 'No tienes permiso.' }
  const r = await agregarProspectos(sesion.org.id, String(datos.get('lista') ?? ''))
  if (r.leidos === 0) return { error: 'No encontré ninguna línea con el nombre de una empresa.' }
  revalidatePath('/panel/prospectos')
  const repetidos = r.leidos - r.nuevos
  return {
    ok: true,
    aviso: `${r.nuevos} agregados${repetidos ? `; ${repetidos} ya estaban (mismo WhatsApp o correo)` : ''}.`,
  }
}

export async function cambiarProspectoAccion(
  id: string,
  accion: 'baja' | 'borrar',
): Promise<Resultado> {
  const sesion = await exigir('prospectos')
  if (!sesion || sesion.usuario.rol === 'operador') return { error: 'No tienes permiso.' }
  if (!(await cambiarProspecto(sesion.org.id, id, accion)))
    return { error: 'No se pudo hacer el cambio.' }
  revalidatePath('/panel/prospectos')
  return { ok: true, aviso: accion === 'baja' ? 'Marcado como baja.' : 'Borrado.' }
}
