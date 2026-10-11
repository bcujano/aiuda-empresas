import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Rol, Usuario } from '@/types/database'

/**
 * Usuarios del CRM de UNA organización (administradores y operadores). El
 * superadmin de Aiuda no aparece aquí ni se puede crear desde el panel.
 */

export type UsuarioConCorreo = Usuario & { email: string }
type R = { ok: true } | { ok: false; error: string }

export async function listarUsuarios(orgId: string): Promise<UsuarioConCorreo[]> {
  const db = supabaseAdmin()
  const { data } = await db
    .from('usuarios')
    .select('*')
    .eq('organizacion_id', orgId)
    .order('created_at')
  const filas = (data ?? []) as Usuario[]
  return Promise.all(
    filas.map(async (u) => {
      const { data: auth } = await db.auth.admin.getUserById(u.auth_user_id)
      return { ...u, email: auth.user?.email ?? '' }
    }),
  )
}

export const esquemaNuevoUsuario = z.object({
  email: z.string().trim().toLowerCase().email('El correo no es válido'),
  nombre_completo: z.string().trim().min(3, 'Escribe el nombre').max(120),
  rol: z.enum(['admin', 'operador']),
  clave: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres').max(72),
})

export async function crearUsuario(
  orgId: string,
  d: z.infer<typeof esquemaNuevoUsuario>,
): Promise<R> {
  const db = supabaseAdmin()
  const { data, error } = await db.auth.admin.createUser({
    email: d.email,
    password: d.clave,
    email_confirm: true,
  })
  if (error || !data.user) {
    return {
      ok: false,
      error: /already|registered|exists/i.test(error?.message ?? '')
        ? 'Ese correo ya tiene usuario.'
        : 'No se pudo crear el usuario.',
    }
  }
  const { error: errorFicha } = await db.from('usuarios').insert({
    auth_user_id: data.user.id,
    organizacion_id: orgId,
    nombre_completo: d.nombre_completo,
    rol: d.rol,
  })
  if (errorFicha) {
    await db.auth.admin.deleteUser(data.user.id)
    return { ok: false, error: 'No se pudo crear la ficha del usuario.' }
  }
  return { ok: true }
}

async function delOrg(orgId: string, id: string): Promise<Usuario | null> {
  const { data } = await supabaseAdmin()
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .eq('organizacion_id', orgId)
    .maybeSingle()
  const u = data as Usuario | null
  return u && u.rol !== 'superadmin' ? u : null
}

export async function cambiarUsuario(
  orgId: string,
  id: string,
  cambios: { rol?: Exclude<Rol, 'superadmin'>; estado?: 'activo' | 'inactivo' },
  quienPide: string,
): Promise<R> {
  const u = await delOrg(orgId, id)
  if (!u) return { ok: false, error: 'Ese usuario no es de este cliente.' }
  if (u.auth_user_id === quienPide)
    return { ok: false, error: 'No puedes cambiar tu propio rol o estado.' }
  const { error } = await supabaseAdmin()
    .from('usuarios')
    .update(cambios)
    .eq('id', id)
    .eq('organizacion_id', orgId)
  return error ? { ok: false, error: 'No se pudo guardar.' } : { ok: true }
}

export async function nuevaClave(orgId: string, id: string, clave: string): Promise<R> {
  if (clave.length < 10)
    return { ok: false, error: 'La contraseña debe tener al menos 10 caracteres.' }
  const u = await delOrg(orgId, id)
  if (!u) return { ok: false, error: 'Ese usuario no es de este cliente.' }
  const { error } = await supabaseAdmin().auth.admin.updateUserById(u.auth_user_id, {
    password: clave,
  })
  return error ? { ok: false, error: 'No se pudo cambiar la contraseña.' } : { ok: true }
}

/** Borra el acceso (usuario de login y ficha). Sus registros en el CRM se conservan. */
export async function borrarUsuario(orgId: string, id: string, quienPide: string): Promise<R> {
  const u = await delOrg(orgId, id)
  if (!u) return { ok: false, error: 'Ese usuario no es de este cliente.' }
  if (u.auth_user_id === quienPide) return { ok: false, error: 'No puedes borrarte a ti mismo.' }
  const { error } = await supabaseAdmin().auth.admin.deleteUser(u.auth_user_id)
  return error ? { ok: false, error: 'No se pudo borrar el usuario.' } : { ok: true }
}
