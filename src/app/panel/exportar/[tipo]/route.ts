import { exigir } from '@/lib/auth'
import { hoyQuito } from '@/lib/formato'
import { EXPORTABLES, type Exportable, exportar } from '@/server/exportar'

/** GET /panel/exportar/leads|citas|actividad|seguimientos → CSV de la organización activa. */
export async function GET(_peticion: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const sesion = await exigir('exportar')
  if (!sesion) return new Response('No tienes permiso para exportar.', { status: 403 })
  const { tipo } = await params
  if (!EXPORTABLES.includes(tipo as Exportable)) return new Response('No existe.', { status: 404 })
  const csv = await exportar(sesion.org.id, tipo as Exportable)
  const nombre = `${sesion.org.slug}-${tipo}-${hoyQuito()}.csv`
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${nombre}"`,
      'cache-control': 'no-store',
    },
  })
}
