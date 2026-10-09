import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente del navegador. La llave anónima es lo único que cruza al cliente,
 * y por eso se lee de las NEXT_PUBLIC_*, que Next sustituye al compilar.
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  )
}
