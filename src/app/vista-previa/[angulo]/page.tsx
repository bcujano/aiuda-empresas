import { notFound } from 'next/navigation'
import { Landing } from '@/components/landing/landing'
import { ANGULOS_DEMO, ORG_DEMO } from '../../../../tests/fixtures/landing-demo'

/**
 * Solo en desarrollo: ver el diseño de la landing sin base de datos.
 * En producción no existe (404).
 */
export default async function VistaPrevia({ params }: { params: Promise<{ angulo: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { angulo: slug } = await params
  const angulo = ANGULOS_DEMO.find((a) => a.slug === slug)
  if (!angulo) notFound()
  return (
    <Landing angulo={angulo} org={ORG_DEMO} otros={ANGULOS_DEMO.filter((a) => a.slug !== slug)} />
  )
}
