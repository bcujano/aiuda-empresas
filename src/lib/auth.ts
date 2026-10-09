import { cookies } from 'next/headers'
import { hoyQuito } from '@/lib/formato'
import { type Area, puede } from '@/lib/permisos'
import { estadoEfectivo, planPermite } from '@/lib/planes'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { supabaseServer } from '@/lib/supabase/server'
import type { EstadoPlan, Organizacion, Usuario } from '@/types/database'

/** Cookie con la organización que el superadmin está mirando. */
export const COOKIE_ORG = 'org_activa'

export type Sesion = {
  userId: string
  email: string
  usuario: Usuario
  /** Organización en la que se trabaja. null = superadmin sin elegir todavía. */
  org: Organizacion | null
  /** Estado efectivo del plan de esa organización (prueba vencida = restringido). */
  plan: EstadoPlan | null
}

/**
 * Sesión válida con ficha de usuario activa. Nunca lanza: un token inválido,
 * un usuario sin ficha o inactivo es un anónimo.
 *
 * La organización NO la elige el navegador salvo para el superadmin: un admin
 * u operador trabaja siempre en la suya, diga lo que diga la cookie.
 */
export async function verifyAuth(): Promise<Sesion | null> {
  try {
    const supabase = await supabaseServer()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null

    const db = supabaseAdmin()
    const { data: fila } = await db
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()
    const usuario = fila as Usuario | null
    if (usuario?.estado !== 'activo') return null

    let orgId = usuario.organizacion_id
    if (usuario.rol === 'superadmin') {
      orgId = (await cookies()).get(COOKIE_ORG)?.value ?? null
    }

    let org: Organizacion | null = null
    if (orgId) {
      const { data: filaOrg } = await db
        .from('organizaciones')
        .select('*')
        .eq('id', orgId)
        .maybeSingle()
      org = (filaOrg as Organizacion | null) ?? null
    }
    // Un admin u operador cuya organización no existe no tiene dónde trabajar.
    if (usuario.rol !== 'superadmin' && !org) return null

    const plan = org ? estadoEfectivo(org, hoyQuito()) : null
    return { userId: data.user.id, email: data.user.email ?? '', usuario, org, plan }
  } catch {
    return null
  }
}

/**
 * ¿Puede esta sesión usar un área en su organización? Hace falta el permiso del
 * rol Y que el plan lo incluya. El superadmin no está sujeto al plan.
 */
export function permite(sesion: Sesion, area: Area): boolean {
  if (!puede(sesion.usuario.rol, area)) return false
  if (sesion.usuario.rol === 'superadmin') return true
  return sesion.plan !== null && planPermite(sesion.plan, area)
}

export type SesionConOrg = Sesion & { org: Organizacion; plan: EstadoPlan }

/** Sesión con organización elegida y permiso sobre el área, o null. */
export async function exigir(area: Area): Promise<SesionConOrg | null> {
  const sesion = await verifyAuth()
  if (!sesion?.org || !sesion.plan) return null
  if (!permite(sesion, area)) return null
  return sesion as SesionConOrg
}
