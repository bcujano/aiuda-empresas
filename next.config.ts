import type { NextConfig } from 'next'

/**
 * Cabeceras de seguridad en TODAS las rutas, incluida /api/agente.
 * - nosniff: el navegador no adivina el tipo de contenido.
 * - strict-origin-when-cross-origin: no se filtra la ruta completa a terceros,
 *   y un id de pedido va en la ruta.
 */
const CABECERAS_SEGURIDAD = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next dev` reescribía CLAUDE.md con un bloque propio; las reglas de este repo se mantienen a mano.
  agentRules: false,
  headers: async () => [{ source: '/:ruta*', headers: CABECERAS_SEGURIDAD }],
}

export default nextConfig
