import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Cliente con service_role: ignora RLS por diseño de Supabase.
 * Solo se usa desde src/server/**, que filtra SIEMPRE por organización.
 * Las pantallas de src/app/** nunca lo importan directamente.
 */
let cliente: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin() no puede usarse en el navegador: expondría el service_role.')
  }
  if (!cliente) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env()
    cliente = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cliente
}
