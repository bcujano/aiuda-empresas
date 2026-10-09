import type { Area } from '@/lib/permisos'
import type { EstadoPlan, Organizacion } from '@/types/database'

/**
 * Lo que cada plan del CRM permite. Se cruza con el rol: hace falta el permiso
 * del rol Y que el plan lo incluya. El superadmin (Aiuda) no está sujeto al
 * plan: siempre puede entrar a arreglar o exportar.
 *
 * - prueba / activo: todo.
 * - restringido: ve leads y citas; sin reportes, sin exportar, sin usuarios
 *   nuevos, sin tocar ángulos ni conocimiento; conversaciones de 30 días.
 * - suspendido: sin acceso.
 */
const AREAS_POR_PLAN: Record<EstadoPlan, ReadonlySet<Area>> = {
  prueba: new Set([
    'leads',
    'citas',
    'angulos',
    'reportes',
    'exportar',
    'usuarios',
    'conocimiento',
  ]),
  activo: new Set([
    'leads',
    'citas',
    'angulos',
    'reportes',
    'exportar',
    'usuarios',
    'conocimiento',
  ]),
  restringido: new Set(['leads', 'citas']),
  suspendido: new Set(),
}

/** Días de historial de conversación visibles por plan (null = todo). */
export const DIAS_HISTORIAL: Record<EstadoPlan, number | null> = {
  prueba: null,
  activo: null,
  restringido: 30,
  suspendido: 0,
}

export function planPermite(estado: EstadoPlan, area: Area): boolean {
  return AREAS_POR_PLAN[estado].has(area)
}

/**
 * Estado efectivo: una prueba vencida se comporta como restringida aunque
 * nadie haya cambiado la fila todavía. `hoy` va en formato AAAA-MM-DD (Quito).
 */
export function estadoEfectivo(
  org: Pick<Organizacion, 'estado_plan' | 'prueba_hasta'>,
  hoy: string,
): EstadoPlan {
  if (org.estado_plan === 'prueba' && hoy > org.prueba_hasta) return 'restringido'
  return org.estado_plan
}

/** Días que faltan para que termine la prueba (negativo si ya terminó). */
export function diasDePrueba(pruebaHasta: string, hoy: string): number {
  const fin = Date.parse(`${pruebaHasta}T00:00:00Z`)
  const inicio = Date.parse(`${hoy}T00:00:00Z`)
  return Math.round((fin - inicio) / 86_400_000)
}

/** Aviso que ve el cliente sobre su plan. null = nada que avisar. */
export function avisoDePlan(
  org: Pick<Organizacion, 'estado_plan' | 'prueba_hasta'>,
  hoy: string,
): { tono: 'neutro' | 'aviso' | 'peligro'; texto: string } | null {
  const estado = estadoEfectivo(org, hoy)
  if (estado === 'restringido') {
    return {
      tono: 'peligro',
      texto:
        'Tu CRM está en modo limitado. Para recuperar reportes y exportaciones, activa tu plan.',
    }
  }
  if (estado !== 'prueba') return null
  const dias = diasDePrueba(org.prueba_hasta, hoy)
  if (dias <= 7) {
    return {
      tono: 'aviso',
      texto: `Tu prueba gratis termina en ${dias} ${dias === 1 ? 'día' : 'días'}.`,
    }
  }
  if (dias <= 30) {
    return { tono: 'neutro', texto: `Tu prueba gratis termina en ${dias} días.` }
  }
  return null
}

export const PLAN_LEGIBLE: Record<EstadoPlan, string> = {
  prueba: 'Prueba gratis',
  activo: 'Activo',
  restringido: 'Restringido',
  suspendido: 'Suspendido',
}
