import { exigir } from '@/lib/auth'
import { hoyQuito } from '@/lib/formato'
import { esquemaInforme } from '@/lib/informe-modelo'
import { informePdf } from '@/lib/informe-pdf'

export const dynamic = 'force-dynamic'

/** POST /panel/informe/pdf → convierte el informe ya revisado y ajustado en PDF. No guarda nada. */
export async function POST(peticion: Request) {
  const sesion = await exigir('reportes')
  if (!sesion) return new Response('No tienes permiso para generar el informe.', { status: 403 })
  const datos = String((await peticion.formData()).get('datos') ?? '')
  let json: unknown
  try {
    json = JSON.parse(datos)
  } catch {
    return new Response('El informe no se pudo leer.', { status: 400 })
  }
  const analisis = esquemaInforme.safeParse(json)
  if (!analisis.success) {
    return new Response(
      `Revisa el informe: ${analisis.error.issues[0]?.path.join('.') ?? ''} ${analisis.error.issues[0]?.message ?? 'datos inválidos'}.`,
      { status: 400 },
    )
  }
  const pdf = await informePdf(analisis.data)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="informe-${sesion.org.slug}-${hoyQuito()}.pdf"`,
      'cache-control': 'no-store',
    },
  })
}
