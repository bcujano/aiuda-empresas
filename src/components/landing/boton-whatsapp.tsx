'use client'

import { MessageCircle } from 'lucide-react'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Botón que abre WhatsApp con el mensaje listo y la referencia del ángulo.
 * Registra «Contact» en el píxel antes de salir (si la página tiene píxel).
 */
export function BotonWhatsApp({
  enlace,
  referencia,
  texto,
  tamano = 'grande',
  className = '',
}: {
  enlace: string
  referencia: string
  texto: string
  tamano?: 'grande' | 'chico'
  className?: string
}) {
  const medidas = tamano === 'grande' ? 'min-h-14 px-6 text-base' : 'min-h-11 px-4 text-sm'
  return (
    <a
      className={`inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[var(--marca)] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${medidas} ${className}`}
      href={enlace}
      onClick={() => window.fbq?.('track', 'Contact', { content_name: referencia })}
      rel="noopener"
      target="_blank"
    >
      <MessageCircle aria-hidden size={tamano === 'grande' ? 20 : 16} />
      {texto}
    </a>
  )
}
