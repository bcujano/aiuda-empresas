import { redirect } from 'next/navigation'
import { EditorInforme } from '@/components/panel/editor-informe'
import { exigir } from '@/lib/auth'
import { armarInforme } from '@/server/informe'

export const dynamic = 'force-dynamic'

/** Editor del informe de campañas: se ajusta todo antes de convertirlo en PDF. */
export default async function Informe({
  searchParams,
}: {
  searchParams: Promise<{ inversion?: string; propuesta?: string }>
}) {
  const sesion = await exigir('reportes')
  if (!sesion) redirect('/panel')
  const q = await searchParams
  const num = (v?: string) => (Number(v) > 0 ? Number(v) : undefined)
  const borrador = await armarInforme(sesion.org.id, {
    inversion: num(q.inversion),
    propuestaDia: num(q.propuesta),
  })
  return <EditorInforme claveLocal={`informe-${sesion.org.id}`} inicial={borrador} />
}
