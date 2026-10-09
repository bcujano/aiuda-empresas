import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aiuda Empresas',
  description: 'Anuncios, agente de IA en WhatsApp y CRM para empresas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
