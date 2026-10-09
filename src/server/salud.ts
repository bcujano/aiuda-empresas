import { supabaseAdmin } from '@/lib/supabase/admin'

type Lectura = { filas: number } | { error: string }

/** Lee de verdad (no solo cuenta): un error de permisos aparece como error, no como 0. */
async function leer(tabla: string): Promise<Lectura> {
  const { data, error, status } = await supabaseAdmin().from(tabla).select('*').limit(100)
  if (error) return { error: `${status} ${error.code ?? ''} ${error.message}`.trim() }
  return { filas: data?.length ?? 0 }
}

/** ¿La app ve la base? Filas por tabla o el error exacto de Supabase (sin secretos). */
export async function saludBase() {
  const [organizaciones, angulos, usuarios] = await Promise.all([
    leer('organizaciones'),
    leer('angulos'),
    leer('usuarios'),
  ])
  const auth = await supabaseAdmin().auth.admin.listUsers({ page: 1, perPage: 50 })
  const login: Lectura = auth.error
    ? { error: auth.error.message }
    : { filas: auth.data.users.length }
  const ok = [organizaciones, angulos, usuarios, login].every((l) => 'filas' in l)
  return { ok, organizaciones, angulos, usuarios_crm: usuarios, usuarios_login: login }
}
