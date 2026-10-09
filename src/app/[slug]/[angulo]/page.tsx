import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Landing } from '@/components/landing/landing'
import { landingPorSlug } from '@/server/organizaciones'

export const revalidate = 300

type Params = { params: Promise<{ slug: string; angulo: string }> }

async function cargar(slug: string, anguloSlug: string) {
  const datos = await landingPorSlug(slug)
  const angulo = datos?.angulos.find((a) => a.slug === anguloSlug)
  if (!datos?.org.wa_numero || !angulo) return null
  return { org: { ...datos.org, wa_numero: datos.org.wa_numero }, angulo, otros: datos.angulos }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, angulo } = await params
  const datos = await cargar(slug, angulo)
  if (!datos) return {}
  return {
    title: `${datos.angulo.servicio} · ${datos.org.nombre}`,
    description: datos.angulo.subtitulo,
  }
}

export default async function LandingAngulo({ params }: Params) {
  const { slug, angulo } = await params
  const datos = await cargar(slug, angulo)
  if (!datos) notFound()
  return (
    <Landing
      angulo={datos.angulo}
      org={datos.org}
      otros={datos.otros.filter((a) => a.id !== datos.angulo.id)}
    />
  )
}
