/**
 * Plantillas de WhatsApp que usa la plataforma. Cada cliente las tiene con su
 * prefijo (ej. fagal_recordatorio_cita) en su propia cuenta de WhatsApp.
 * Los textos son del producto, sin datos de ningún cliente: todo va en variables.
 */

export type PlantillaBase = {
  base: string
  categoria: 'UTILITY' | 'MARKETING'
  uso: string
  cuerpo: string
  ejemplo: string[]
}

export const PLANTILLAS: PlantillaBase[] = [
  {
    base: 'aviso_cita_equipo',
    categoria: 'UTILITY',
    uso: 'Aviso al equipo de cada reunión nueva',
    cuerpo:
      'Nueva reunión agendada por el asistente de {{1}}.\nCliente: {{2}}\nEmpresa: {{3}}\nTema: {{4}}\nFecha: {{5}} ({{6}})\nConfirme o cambie la hora en este enlace: {{7}}\nGracias.',
    ejemplo: [
      'Estudio Ejemplo',
      'Ana Pérez',
      'Constructora Andes',
      'Glosa del SRI',
      'martes 13 de octubre, 10:00',
      'virtual',
      'https://aiuda-empresas.vercel.app/cita/123',
    ],
  },
  {
    base: 'recordatorio_cita',
    categoria: 'UTILITY',
    uso: 'Recordatorio al cliente 24 h y 2 h antes',
    cuerpo:
      'Le recordamos su reunión con {{1}}: {{2}} ({{3}}). Si necesita cambiarla, responda a este mensaje.',
    ejemplo: ['Estudio Ejemplo', 'martes 13 de octubre, 10:00', 'virtual'],
  },
  {
    base: 'cita_confirmada_cliente',
    categoria: 'UTILITY',
    uso: 'Confirmación al cliente cuando el equipo confirma o mueve',
    cuerpo:
      'Su reunión con {{1}} quedó confirmada: {{2}} ({{3}}). Si necesita cambiarla, responda a este mensaje.',
    ejemplo: ['Estudio Ejemplo', 'martes 13 de octubre, 10:00', 'virtual'],
  },
  {
    base: 'seguimiento_lead',
    categoria: 'MARKETING',
    uso: 'Seguimiento cuando la ventana gratis ya se cerró',
    cuerpo:
      'Hola {{1}}, ¿sigue interesado en {{2}}? Puedo ofrecerle horarios para una reunión con {{3}}. Si no desea recibir más mensajes, responda BAJA.',
    ejemplo: ['Ana', 'defensa tributaria', 'Estudio Ejemplo'],
  },
]

export function nombrePlantilla(prefijo: string | null | undefined, base: string): string {
  return `${prefijo ?? ''}${base}`
}
