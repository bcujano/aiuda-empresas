'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import { borrarAngulo, esquemaAngulo, guardarAngulo } from '@/server/angulos-edicion'

export async function guardarAnguloAccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const sesion = await exigir('angulos')
  if (!sesion) return { error: 'No tienes permiso para cambiar ángulos.' }
  const analisis = esquemaAngulo.safeParse({
    ...Object.fromEntries(datos.entries()),
    activo: datos.get('activo') === 'on',
  })
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los datos.' }
  const r = await guardarAngulo(sesion.org.id, analisis.data)
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/angulos')
  revalidatePath(`/${sesion.org.slug}`, 'layout')
  return { ok: true, aviso: 'Ángulo guardado. La landing ya muestra los cambios.' }
}

export async function borrarAnguloAccion(id: string): Promise<Resultado> {
  const sesion = await exigir('angulos')
  if (!sesion || sesion.usuario.rol === 'operador') return { error: 'No tienes permiso.' }
  const r = await borrarAngulo(sesion.org.id, id)
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/angulos')
  return { ok: true, aviso: r.aviso }
}
