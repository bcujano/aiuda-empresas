import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { origenSupabase } from '@/lib/env'

/** Cookies de sesión de Supabase. Si están corruptas, hay que tirarlas. */
function cookiesDeSesion(peticion: NextRequest): string[] {
  return peticion.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((nombre) => nombre.startsWith('sb-'))
}

/**
 * Protección de rutas. En Next 16 vive en src/proxy.ts, no en middleware.ts.
 *
 * Solo comprueba que haya una sesión VÁLIDA. Si el token está caducado o
 * corrupto, se borran las cookies antes de mandar al login: si no, el
 * navegador sigue enviando basura, el proxy cree que hay sesión, rebota el
 * login hacia el panel y se arma un bucle del que no se sale.
 */
export async function proxy(peticion: NextRequest) {
  const respuesta = NextResponse.next({ request: peticion })
  const ruta = peticion.nextUrl.pathname

  const supabase = createServerClient(
    origenSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL as string),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => peticion.cookies.getAll(),
        setAll: (cookiesNuevas) => {
          for (const { name, value, options } of cookiesNuevas) {
            respuesta.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  let haySesion = false
  let sesionRota = false

  try {
    const { data, error } = await supabase.auth.getUser()
    haySesion = !error && data.user !== null
    // Había cookies pero no sirven: token caducado, rotado o de otro proyecto.
    sesionRota = !haySesion && cookiesDeSesion(peticion).length > 0
  } catch {
    haySesion = false
    sesionRota = cookiesDeSesion(peticion).length > 0
  }

  // El proxy solo corre en /panel y /login (ver matcher): las landings de los
  // clientes y /api quedan fuera y son públicas.
  const esPublica = ruta === '/login'

  function limpiar(destino: NextResponse): NextResponse {
    if (!sesionRota) return destino
    for (const nombre of cookiesDeSesion(peticion)) destino.cookies.delete(nombre)
    return destino
  }

  if (!haySesion && !esPublica) {
    return limpiar(NextResponse.redirect(new URL('/login', peticion.url)))
  }

  // Un anónimo con cookies rotas se queda en el login, pero sin la basura.
  if (!haySesion && esPublica) return limpiar(respuesta)

  if (ruta === '/login') {
    return NextResponse.redirect(new URL('/panel', peticion.url))
  }

  return respuesta
}

export const config = {
  // Solo el CRM pide sesión. Las landings (/fagal…) son públicas y /api/agente
  // se autentica con su propio secreto, no con la sesión del navegador.
  matcher: ['/panel/:ruta*', '/login'],
}
