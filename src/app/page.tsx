import type { Metadata } from 'next'
import { LandingAiuda } from '@/components/aiuda/landing-aiuda'
import { enlaceWhatsApp } from '@/lib/whatsapp'
import { planesPublicos } from '@/server/planes'

export const metadata: Metadata = {
  title: 'Aiuda Empresas · Reuniones con empresas que pueden pagar',
  description:
    'Anuncios en Meta, asistente con IA en WhatsApp que califica y agenda, y CRM propio. Para empresas B2B en Ecuador.',
}
export const revalidate = 3600

/** Número de ventas de Aiuda y píxel: configuración del despliegue, no de un cliente. */
const WHATSAPP_AIUDA = process.env.AIUDA_WHATSAPP ?? '+593985663057'

export default async function Inicio() {
  const planes = await planesPublicos()
  const enlace = enlaceWhatsApp(
    WHATSAPP_AIUDA,
    'Hola, quiero más reuniones para mi empresa con Aiuda Empresas.',
    'AIU-WEB',
  )
  return (
    <LandingAiuda enlace={enlace} pixelId={process.env.AIUDA_PIXEL_ID ?? null} planes={planes} />
  )
}
