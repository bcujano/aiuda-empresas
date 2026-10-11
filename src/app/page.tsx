import type { Metadata } from 'next'
import { LandingAiuda } from '@/components/aiuda/landing-aiuda'
import { enlaceWhatsApp } from '@/lib/whatsapp'
import { pruebaSocial } from '@/server/landing-aiuda'
import { planesPublicos } from '@/server/planes'

export const metadata: Metadata = {
  title: 'Aiuda Empresas · Sus anuncios traen mensajes, nosotros los convertimos en reuniones',
  description:
    'Anuncios en Meta, asistente con IA en WhatsApp que responde en segundos, califica y agenda en su calendario, y CRM propio. Para empresas B2B en Ecuador.',
  openGraph: {
    title: 'Aiuda Empresas',
    description: 'Sus anuncios traen mensajes. Nosotros los convertimos en reuniones.',
    locale: 'es_EC',
    type: 'website',
  },
}
export const revalidate = 600

/** Número de ventas de Aiuda, píxel y foto: configuración del despliegue, no de un cliente. */
const WHATSAPP_AIUDA = process.env.AIUDA_WHATSAPP ?? '+593985663057'

export default async function Inicio() {
  const [planes, prueba] = await Promise.all([planesPublicos(), pruebaSocial()])
  const enlace = enlaceWhatsApp(
    WHATSAPP_AIUDA,
    'Hola, quiero más reuniones para mi empresa con Aiuda Empresas.',
    'AIU-WEB',
  )
  return (
    <LandingAiuda
      enlace={enlace}
      fotoFundador={process.env.AIUDA_FUNDADOR_FOTO ?? null}
      pixelId={process.env.AIUDA_PIXEL_ID ?? null}
      planes={planes}
      prueba={prueba}
    />
  )
}
