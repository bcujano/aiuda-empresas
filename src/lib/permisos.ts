import type { Rol } from '@/types/database'

/**
 * Qué puede hacer cada rol. Vive aparte de auth.ts porque la barra lateral es
 * un componente de cliente y auth.ts arrastra next/headers.
 *
 * Esto decide qué se VE. Lo que se PUEDE hacer lo vuelve a comprobar el
 * servidor en cada acción, junto con el plan de la organización (planes.ts).
 */
export type Area =
  | 'leads'
  | 'citas'
  | 'angulos'
  | 'reportes'
  | 'exportar'
  | 'usuarios'
  | 'conocimiento'
  | 'organizaciones'

const PERMISOS: Record<Rol, ReadonlySet<Area>> = {
  superadmin: new Set([
    'leads',
    'citas',
    'angulos',
    'reportes',
    'exportar',
    'usuarios',
    'conocimiento',
    'organizaciones',
  ]),
  admin: new Set(['leads', 'citas', 'angulos', 'reportes', 'exportar', 'usuarios', 'conocimiento']),
  operador: new Set(['leads', 'citas']),
}

export function puede(rol: Rol, area: Area): boolean {
  return PERMISOS[rol].has(area)
}

export const ROL_LEGIBLE: Record<Rol, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  operador: 'Operador',
}
