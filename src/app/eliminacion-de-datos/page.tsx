import type { Metadata } from 'next'
import { PaginaLegal } from '@/components/pagina-legal'

export const metadata: Metadata = { title: 'Eliminación de datos · Aiuda Empresas' }

export default function EliminacionDeDatos() {
  return (
    <PaginaLegal titulo="Cómo eliminar tus datos">
      <p>
        Si nos escribiste por WhatsApp y quieres que borremos tus datos, envía la palabra
        <strong> ELIMINAR</strong> al mismo número de WhatsApp al que escribiste. Una persona del
        equipo confirmará tu identidad por ese chat y eliminará tus datos de nuestros sistemas en un
        plazo máximo de 15 días.
      </p>
      <p>
        También puedes pedir acceso o corrección de tus datos por el mismo medio. Más detalles en la{' '}
        <a className="underline" href="/privacidad">
          política de privacidad
        </a>
        .
      </p>
    </PaginaLegal>
  )
}
