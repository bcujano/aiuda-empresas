import { redirect } from 'next/navigation'
import { EditorInforme } from '@/components/panel/editor-informe'
import { exigir } from '@/lib/auth'
import { armarInforme } from '@/server/informe'
import { informePendiente } from '@/server/informe-envio'
import { organizacionPorId } from '@/server/organizaciones'

export const dynamic = 'force-dynamic'

/** Editor del informe de campañas: se ajusta todo antes de convertirlo en PDF. */
export default async function Informe({
  searchParams,
}: {
  searchParams: Promise<{ inversion?: string; propuesta?: string; desde?: string; hasta?: string }>
}) {
  const sesion = await exigir('reportes')
  if (!sesion) redirect('/panel')
  const q = await searchParams
  const num = (v?: string) => (Number(v) > 0 ? Number(v) : undefined)
  const borrador = await armarInforme(sesion.org.id, {
    inversion: num(q.inversion),
    propuestaDia: num(q.propuesta),
    desde: q.desde,
    hasta: q.hasta,
  })
  const [pendiente, org] = await Promise.all([
    informePendiente(sesion.org.id),
    organizacionPorId(sesion.org.id),
  ])
  // Si hay un envío programado (y no se pidió recalcular), el editor abre ESE informe.
  const inicial = pendiente?.datos && !q.desde ? pendiente.datos : borrador
  return (
    <EditorInforme
      claveLocal={`informe-${sesion.org.id}`}
      whatsappInicial={org?.aviso_whatsapp ?? ''}
      inicial={inicial}
      pendiente={pendiente}
    />
  )
}
