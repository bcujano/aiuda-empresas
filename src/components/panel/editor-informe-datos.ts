import type { Charla } from '@/lib/informe-modelo'

/** Conversación en blanco para agregar al informe. */
export const CHARLA_NUEVA: Charla = {
  titulo: 'Nueva conversación',
  ilustrativa: true,
  mensajes: [
    { de: 'contacto', texto: '' },
    { de: 'asistente', texto: '' },
  ],
}
