'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import {
  borrarUsuario,
  cambiarUsuario,
  crearUsuario,
  esquemaNuevoUsuario,
  nuevaClave,
} from '@/server/usuarios'

function listo(r: { ok: true } | { ok: false; error: string }, aviso: string): Resultado {
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/usuarios')
  return { ok: true, aviso }
}

export async function crearUsuarioAccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const sesion = await exigir('usuarios')
  if (!sesion) return { error: 'No tienes permiso para crear usuarios.' }
  const analisis = esquemaNuevoUsuario.safeParse(Object.fromEntries(datos.entries()))
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los datos.' }
  return listo(
    await crearUsuario(sesion.org.id, analisis.data),
    'Usuario creado. Pásale su correo y contraseña por un canal privado.',
  )
}

export async function cambiarUsuarioAccion(
  id: string,
  campo: 'rol' | 'estado',
  valor: string,
): Promise<Resultado> {
  const sesion = await exigir('usuarios')
  if (!sesion) return { error: 'No tienes permiso.' }
  if (campo === 'rol' && valor !== 'admin' && valor !== 'operador')
    return { error: 'Rol no válido.' }
  if (campo === 'estado' && valor !== 'activo' && valor !== 'inactivo')
    return { error: 'Estado no válido.' }
  const cambios =
    campo === 'rol'
      ? { rol: valor as 'admin' | 'operador' }
      : { estado: valor as 'activo' | 'inactivo' }
  return listo(await cambiarUsuario(sesion.org.id, id, cambios, sesion.userId), 'Guardado.')
}

export async function nuevaClaveAccion(id: string, clave: string): Promise<Resultado> {
  const sesion = await exigir('usuarios')
  if (!sesion) return { error: 'No tienes permiso.' }
  return listo(await nuevaClave(sesion.org.id, id, clave), 'Contraseña cambiada.')
}

export async function borrarUsuarioAccion(id: string): Promise<Resultado> {
  const sesion = await exigir('usuarios')
  if (!sesion) return { error: 'No tienes permiso.' }
  return listo(await borrarUsuario(sesion.org.id, id, sesion.userId), 'Usuario borrado.')
}
