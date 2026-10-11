import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Plan } from '@/types/database'

/** Planes activos de Aiuda, del más barato al más completo. Si la tabla aún no existe, lista vacía. */
export async function planesPublicos(): Promise<Plan[]> {
  try {
    return await leer()
  } catch {
    return []
  }
}

async function leer(): Promise<Plan[]> {
  const { data, error } = await supabaseAdmin()
    .from('planes')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })
  if (error) return []
  return ((data ?? []) as Plan[]).map((p) => ({ ...p, incluye: p.incluye ?? [] }))
}
