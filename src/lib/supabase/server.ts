import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

/**
 * Cliente ligado a las cookies de la petición: es el que sabe quién inició
 * sesión. Respeta RLS, así que solo sirve para leer la sesión, no los datos.
 */
export async function supabaseServer() {
  const almacen = await cookies()

  return createServerClient(env().NEXT_PUBLIC_SUPABASE_URL, env().NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (cookiesNuevas) => {
        try {
          for (const { name, value, options } of cookiesNuevas) {
            almacen.set(name, value, options)
          }
        } catch {
          // Un Server Component no puede escribir cookies; el refresco de
          // sesión lo hace el proxy. Ignorarlo aquí es lo correcto.
        }
      },
    },
  })
}
