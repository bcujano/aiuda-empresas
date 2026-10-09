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
  const { SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL } = env()
  const proyecto = new URL(SUPABASE_URL).hostname.split('.')[0]
  const mismaBase = new URL(NEXT_PUBLIC_SUPABASE_URL).hostname === new URL(SUPABASE_URL).hostname
  try {
    const base = await saludBase()
    return NextResponse.json(
      { entorno: 'ok', proyecto, misma_base_login_y_datos: mismaBase, base },
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
