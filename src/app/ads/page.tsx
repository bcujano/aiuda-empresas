import type { Metadata } from 'next'
import { LandingAiuda } from '@/components/aiuda/landing-aiuda'
import { enlaceWhatsApp } from '@/lib/whatsapp'
import { pruebaSocial } from '@/server/landing-aiuda'
import { planesPublicos } from '@/server/planes'

export const metadata: Metadata = {
  title: 'Aiuda Ads · Sus anuncios traen mensajes, nosotros los convertimos en reuniones',
  description:
    'Anuncios en Meta y un asistente con IA en WhatsApp que responde en segundos, califica y agenda en su calendario, con CRM propio. Un servicio de Aiuda Empresas.',
  openGraph: {
    title: 'Aiuda Ads',
    description: 'Sus anuncios traen mensajes. Nosotros los convertimos en reuniones.',
    locale: 'es_EC',
    type: 'website',
  },
}
export const revalidate = 600

/** Número de ventas de Aiuda y píxel: configuración del despliegue, no de un cliente. */
const WHATSAPP_AIUDA = process.env.AIUDA_WHATSAPP ?? '+593985663057'

export default async function AiudaAds() {
  const [planes, prueba] = await Promise.all([planesPublicos(), pruebaSocial()])
  const enlace = enlaceWhatsApp(
    WHATSAPP_AIUDA,
    'Hola, quiero más reuniones para mi negocio con Aiuda Ads.',
    'AIU-ADS',
  )
  return (
    <LandingAiuda
      enlace={enlace}
      pixelId={process.env.AIUDA_PIXEL_ID ?? null}
      planes={planes}
      prueba={prueba}
    />
  )
}
