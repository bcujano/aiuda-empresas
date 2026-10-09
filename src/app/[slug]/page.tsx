import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
import { BotonWhatsApp } from '@/components/landing/boton-whatsapp'
import { PixelMeta } from '@/components/landing/pixel'
import { enlaceWhatsApp, referencia } from '@/lib/whatsapp'
import { landingPorSlug } from '@/server/organizaciones'

export const revalidate = 300

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const datos = await landingPorSlug((await params).slug)
  return datos ? { title: datos.org.nombre } : {}
}

/** Portada del cliente: elige el servicio. Los anuncios llevan directo a cada ángulo. */
export default async function PortadaCliente({ params }: Params) {
  const datos = await landingPorSlug((await params).slug)
  if (!datos?.org.wa_numero) notFound()
  const { org, angulos } = datos
  const numero = org.wa_numero
  if (!numero) notFound()
  const ref = referencia(org.codigo, 'GEN')
  const enlace = enlaceWhatsApp(numero, 'Hola, mi empresa necesita información.', ref)

  return (
    <div
      className="min-h-screen bg-white text-[#101828]"
      style={{ '--marca': org.color_primario } as CSSProperties}
    >
      <PixelMeta pixelId={org.pixel_id} />
      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        {org.logo_url ? (
          // biome-ignore lint/performance/noImgElement: logo externo de tamaño variable
          <img alt={org.nombre} className="h-10 w-auto" src={org.logo_url} />
        ) : (
          <p className="font-bold text-xl tracking-tight">{org.nombre}</p>
        )}
        <h1 className="mt-10 font-bold text-4xl tracking-tight">
          ¿En qué necesita ayuda tu empresa?
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {angulos.map((a) => (
            <Link
              className="rounded-xl border border-[#e4e7ec] p-5 transition-colors hover:border-[var(--marca)]"
              href={`/${org.slug}/${a.slug}`}
              key={a.id}
            >
              <p className="font-semibold">{a.servicio}</p>
              <p className="mt-1 text-[#475467] text-sm">{a.titular}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10">
          <BotonWhatsApp enlace={enlace} referencia={ref} texto="Hablar por WhatsApp" />
        </div>
      </main>
    </div>
  )
}
