import { exigir } from '@/lib/auth'
import { hoyQuito } from '@/lib/formato'
import { informePdf } from '@/lib/informe-pdf'
import { armarInforme } from '@/server/informe'

export const dynamic = 'force-dynamic'

/** GET /panel/informe → informe de campañas en PDF de la organización activa. */
export async function GET(peticion: Request) {
  const sesion = await exigir('reportes')
  if (!sesion) return new Response('No tienes permiso para ver el informe.', { status: 403 })
  const pdf = await informePdf(await armarInforme(sesion.org.id, opciones(peticion)))
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="informe-${sesion.org.slug}-${hoyQuito()}.pdf"`,
      'cache-control': 'no-store',
    },
  })
}

function opciones(peticion: Request) {
  const q = new URL(peticion.url).searchParams
  const numero = (k: string) => {
    const n = Number(q.get(k))
    return Number.isFinite(n) && n > 0 && n < 100000 ? n : undefined
  }
  return { inversion: numero('inversion'), propuestaDia: numero('propuesta') ?? null }
}
