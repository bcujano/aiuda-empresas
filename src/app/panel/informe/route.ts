import { exigir } from '@/lib/auth'
import { hoyQuito } from '@/lib/formato'
import { informePdf } from '@/lib/informe-pdf'
import { armarInforme } from '@/server/informe'

export const dynamic = 'force-dynamic'

/** GET /panel/informe → informe de campañas en PDF de la organización activa. */
export async function GET() {
  const sesion = await exigir('reportes')
  if (!sesion) return new Response('No tienes permiso para ver el informe.', { status: 403 })
  const pdf = await informePdf(await armarInforme(sesion.org.id))
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="informe-${sesion.org.slug}-${hoyQuito()}.pdf"`,
      'cache-control': 'no-store',
    },
  })
}
