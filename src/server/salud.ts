import { supabaseAdmin } from '@/lib/supabase/admin'

/** ¿La app ve la base? Devuelve conteos o el código de error de Supabase (sin secretos). */
export async function saludBase(): Promise<
  | { ok: true; organizaciones: number; angulos: number }
  | { ok: false; codigo: string; mensaje: string }
> {
  const db = supabaseAdmin()
  const orgs = await db.from('organizaciones').select('id', { count: 'exact', head: true })
  if (orgs.error) {
    return { ok: false, codigo: orgs.error.code ?? 'desconocido', mensaje: orgs.error.message }
  }
  const angulos = await db.from('angulos').select('id', { count: 'exact', head: true })
  if (angulos.error) {
    return {
      ok: false,
      codigo: angulos.error.code ?? 'desconocido',
      mensaje: angulos.error.message,
    }
  }
  return { ok: true, organizaciones: orgs.count ?? 0, angulos: angulos.count ?? 0 }
}
