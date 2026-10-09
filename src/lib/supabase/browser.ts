import { createBrowserClient } from '@supabase/ssr'
import { origenSupabase } from '@/lib/env'

/**
 * Cliente del navegador. La llave anónima es lo único que cruza al cliente,
 * y por eso se lee de las NEXT_PUBLIC_*, que Next sustituye al compilar.
 */
export function supabaseBrowser() {
  return createBrowserClient(
    origenSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL as string),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  )
}
