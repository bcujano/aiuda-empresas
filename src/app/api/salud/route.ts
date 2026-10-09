import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { saludBase } from '@/server/salud'

export const dynamic = 'force-dynamic'

/**
 * Diagnóstico de la puesta en marcha: qué variables faltan (solo nombres) y si
 * la base responde. Nunca devuelve valores de variables.
 */
export async function GET() {
  try {
    env()
  } catch (error) {
    const faltan = String((error as Error).message)
      .split('\n')
      .slice(1)
      .map((l) => l.trim().replace(/^- /, ''))
    return NextResponse.json({ entorno: 'incompleto', detalle: faltan }, { status: 500 })
  }
  // El identificador del proyecto es público (va en la URL); las llaves no se muestran.
  const { SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env()
  const proyecto = new URL(SUPABASE_URL).hostname.split('.')[0]
  const mismaBase = new URL(NEXT_PUBLIC_SUPABASE_URL).hostname === new URL(SUPABASE_URL).hostname
  try {
    const base = await saludBase()
    return NextResponse.json(
      {
        entorno: 'ok',
        proyecto,
        misma_base_login_y_datos: mismaBase,
        llave_servidor: tipoDeLlave(SUPABASE_SERVICE_ROLE_KEY),
        base,
      },
      { status: base.ok ? 200 : 500 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        entorno: 'ok',
        base: { ok: false, codigo: 'excepcion', mensaje: (error as Error).message },
      },
      { status: 500 },
    )
  }
}

/**
 * Qué clase de llave hay en SUPABASE_SERVICE_ROLE_KEY, sin mostrarla. Si es la
 * pública, RLS esconde todas las filas y la app ve la base vacía sin error.
 */
function tipoDeLlave(llave: string): string {
  if (llave.startsWith('sb_secret_')) return 'secreta (correcto)'
  if (llave.startsWith('sb_publishable_')) return 'PUBLICA: debe ser la secreta'
  const partes = llave.split('.')
  if (partes.length === 3 && partes[1]) {
    try {
      const rol = JSON.parse(Buffer.from(partes[1], 'base64url').toString()).role
      return rol === 'service_role' ? 'service_role (correcto)' : `${rol}: debe ser service_role`
    } catch {
      return 'no reconocida'
    }
  }
  return 'no reconocida'
}
