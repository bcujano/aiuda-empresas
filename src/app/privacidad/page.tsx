import type { Metadata } from 'next'
import { PaginaLegal } from '@/components/pagina-legal'

export const metadata: Metadata = { title: 'Política de privacidad · Aiuda Empresas' }

export default function Privacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad">
      <p>
        Aiuda opera canales de atención por WhatsApp y páginas web para empresas clientes. Esta
        política explica qué datos tratamos cuando nos escribes y cómo los protegemos, conforme a la
        Ley Orgánica de Protección de Datos Personales del Ecuador.
      </p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>Tu número de WhatsApp y el nombre de tu perfil.</li>
        <li>
          Lo que nos escribes: nombre, empresa, cargo, ciudad y el tema general que necesitas.
        </li>
        <li>El anuncio o la página desde donde nos escribiste.</li>
      </ul>
      <p>No pedimos detalles de casos, documentos ni datos sensibles por este canal.</p>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Responder tus mensajes y agendar una reunión con la empresa que contactaste.</li>
        <li>Medir qué anuncios funcionan, de forma agregada.</li>
      </ul>
      <p>
        Las respuestas iniciales las da un asistente virtual con inteligencia artificial; una
        persona del equipo puede tomar la conversación en cualquier momento.
      </p>
      <h2>Con quién se comparten</h2>
      <p>
        Solo con la empresa a la que escribiste, para atender tu solicitud, y con los proveedores
        técnicos que hacen funcionar el servicio (mensajería de WhatsApp, alojamiento y bases de
        datos). No vendemos tus datos.
      </p>
      <h2>Cuánto tiempo los guardamos</h2>
      <p>Mientras dure la relación con la empresa contactada o hasta que pidas su eliminación.</p>
      <h2>Tus derechos</h2>
      <p>
        Puedes pedir acceso, rectificación o eliminación de tus datos en cualquier momento. Mira
        cómo en{' '}
        <a className="underline" href="/eliminacion-de-datos">
          eliminación de datos
        </a>
        .
      </p>
    </PaginaLegal>
  )
}
