/**
 * Textos de la landing de Aiuda Ads, el servicio de anuncios + asistente de
 * WhatsApp de Aiuda Empresas (la marca madre).
 * Sin cifras ni testimonios inventados: los datos externos llevan su fuente y
 * los clientes y reseñas salen de la base (src/server/landing-aiuda.ts).
 */

export type Mensaje = { de: 'lead' | 'agente'; texto: string }
export type Demo = { rubro: string; empresa: string; mensajes: Mensaje[]; cita: string }

/** Conversaciones de muestra para la demo. Se rotulan como «Simulación» en pantalla. */
export const DEMOS: Demo[] = [
  {
    rubro: 'Estudio jurídico',
    empresa: 'Estudio jurídico',
    mensajes: [
      { de: 'lead', texto: 'Hola, a mi empresa le llegó una glosa del SRI. (Ref. ANUNCIO)' },
      {
        de: 'agente',
        texto:
          'Hola, gracias por escribir. Le ayudo a coordinar una reunión con un abogado tributarista. ¿Cuál es el nombre de su empresa y su cargo?',
      },
      { de: 'lead', texto: 'Importadora Andes, soy el gerente financiero.' },
      {
        de: 'agente',
        texto:
          'Perfecto. Tengo libre el martes a las 10:00 o el miércoles a las 15:00, presencial o por videollamada. ¿Cuál prefiere?',
      },
      { de: 'lead', texto: 'Martes 10:00, presencial.' },
    ],
    cita: 'Martes 10:00 · presencial',
  },
  {
    rubro: 'Constructora',
    empresa: 'Constructora',
    mensajes: [
      { de: 'lead', texto: 'Buenas, queremos cotizar la construcción de una bodega.' },
      {
        de: 'agente',
        texto:
          '¡Hola! Con gusto. Para que el ingeniero llegue preparado: ¿en qué ciudad está el terreno y de cuántos metros sería la bodega?',
      },
      { de: 'lead', texto: '🎤 Nota de voz · 0:24' },
      {
        de: 'agente',
        texto:
          'Entendido: Calderón, unos 800 m² y ya tienen el terreno. ¿Le sirve una visita técnica el jueves a las 9:00?',
      },
      { de: 'lead', texto: 'Sí, el jueves está bien.' },
    ],
    cita: 'Jueves 9:00 · visita técnica',
  },
  {
    rubro: 'Software B2B',
    empresa: 'Software B2B',
    mensajes: [
      { de: 'lead', texto: 'Hola, vi el anuncio del sistema de facturación para empresas.' },
      {
        de: 'agente',
        texto:
          'Hola, gracias por escribir. ¿Cuántas personas de su equipo facturan hoy y qué sistema usan?',
      },
      { de: 'lead', texto: 'Somos 12 y usamos hojas de cálculo.' },
      {
        de: 'agente',
        texto:
          'Le muestro una demo de 30 minutos con un asesor. ¿Hoy a las 16:00 o mañana a las 11:00?',
      },
      { de: 'lead', texto: 'Mañana 11:00 por favor.' },
    ],
    cita: 'Mañana 11:00 · videollamada',
  },
  {
    rubro: 'Contadores',
    empresa: 'Firma contable',
    mensajes: [
      { de: 'lead', texto: 'Necesitamos un contador externo, son las 23:40, ¿atienden?' },
      {
        de: 'agente',
        texto:
          'Sí, le atiendo ahora. ¿Su empresa es sociedad o persona natural, y cuántas facturas emite al mes más o menos?',
      },
      { de: 'lead', texto: 'Sociedad, unas 300 facturas.' },
      {
        de: 'agente',
        texto:
          'Gracias. Mañana a las 8:30 un contador puede reunirse con usted por videollamada. ¿Le reservo ese espacio?',
      },
      { de: 'lead', texto: 'Perfecto.' },
    ],
    cita: 'Mañana 8:30 · videollamada',
  },
  {
    rubro: 'Inmobiliaria',
    empresa: 'Inmobiliaria',
    mensajes: [
      { de: 'lead', texto: 'Hola, me interesa el departamento de 2 habitaciones del anuncio.' },
      {
        de: 'agente',
        texto:
          '¡Hola! Con gusto. ¿Lo busca para vivir o para invertir, y piensa pagarlo de contado o con crédito?',
      },
      { de: 'lead', texto: 'Para vivir, con crédito del BIESS.' },
      {
        de: 'agente',
        texto:
          'Perfecto. Un asesor le muestra el departamento el sábado a las 10:00 o el lunes a las 17:00. ¿Cuál le queda mejor?',
      },
      { de: 'lead', texto: 'El sábado.' },
    ],
    cita: 'Sábado 10:00 · visita al departamento',
  },
  {
    rubro: 'Clínica dental',
    empresa: 'Clínica dental',
    mensajes: [
      { de: 'lead', texto: 'Buenas noches, ¿cuánto cuesta un diseño de sonrisa?' },
      {
        de: 'agente',
        texto:
          'Hola, gracias por escribir. El valor depende de la valoración, que hace el odontólogo en la primera cita. ¿Le ayudo a reservarla?',
      },
      { de: 'lead', texto: 'Sí, ¿tienen algo esta semana?' },
      {
        de: 'agente',
        texto: 'Tengo el miércoles a las 16:00 o el viernes a las 11:00. ¿Cuál prefiere?',
      },
      { de: 'lead', texto: 'Viernes 11:00.' },
    ],
    cita: 'Viernes 11:00 · valoración',
  },
  {
    rubro: 'Clínica estética',
    empresa: 'Clínica estética',
    mensajes: [
      { de: 'lead', texto: '📷 Foto' },
      { de: 'lead', texto: 'Quiero tratar estas manchas, ¿qué me recomiendan?' },
      {
        de: 'agente',
        texto:
          'Gracias por la foto. El tratamiento lo define la especialista en una valoración sin costo. ¿Le reservo el jueves a las 15:00?',
      },
      { de: 'lead', texto: 'Perfecto, el jueves.' },
    ],
    cita: 'Jueves 15:00 · valoración',
  },
  {
    rubro: 'Spa de uñas',
    empresa: 'Spa de uñas',
    mensajes: [
      { de: 'lead', texto: 'Hola, ¿tienen turno para uñas acrílicas mañana?' },
      {
        de: 'agente',
        texto: '¡Hola! Sí. Mañana tengo libre a las 10:30 y a las 16:00. ¿Cuál le reservo?',
      },
      { de: 'lead', texto: '16:00 porfa.' },
      {
        de: 'agente',
        texto: 'Listo, su turno queda mañana a las 16:00. Le escribo un recordatorio antes. 💅',
      },
    ],
    cita: 'Mañana 16:00 · uñas acrílicas',
  },
]

export const RUBROS = [
  'Estudios jurídicos',
  'Firmas contables',
  'Constructoras',
  'Inmobiliarias',
  'Clínicas dentales',
  'Clínicas estéticas',
  'Spas y centros de belleza',
  'Software y servicios B2B',
]

/** Datos de terceros, siempre con su fuente. */
export const FUENTE_HBR = {
  nombre: 'Harvard Business Review, «The Short Life of Online Sales Leads»',
  url: 'https://hbr.org/2011/03/the-short-life-of-online-sales-leads',
}

export const DATOS_PROBLEMA = [
  {
    cifra: '7×',
    texto:
      'más probable calificar a un interesado si se le contacta dentro de la primera hora, frente a contactarlo una hora después.',
  },
  {
    cifra: '60×',
    texto: 'más probable que si se espera 24 horas o más para responder.',
  },
  {
    cifra: '42 h',
    texto: 'tardaban en promedio las empresas B2B en dar la primera respuesta.',
  },
]

export const PASOS = [
  {
    titulo: 'Atraemos',
    cuando: 'Semana 1',
    texto:
      'Anuncios en Meta por servicio y por dolor concreto. Cada anuncio y cada landing llevan su código para saber qué funciona.',
  },
  {
    titulo: 'Atendemos',
    cuando: 'En segundos',
    texto:
      'El asistente responde por WhatsApp de día y de noche. Entiende texto, notas de voz e imágenes.',
  },
  {
    titulo: 'Calificamos',
    cuando: 'En la misma conversación',
    texto:
      'Pregunta lo justo: empresa, cargo, tamaño y necesidad. A quien no es su cliente lo despide con amabilidad.',
  },
  {
    titulo: 'Agendamos',
    cuando: 'En su agenda real',
    texto:
      'Ofrece solo horas libres. Su equipo recibe el aviso con el resumen y la persona recibe recordatorios.',
  },
]

export const INCLUYE = [
  {
    titulo: 'Asistente en WhatsApp',
    texto: 'Texto, notas de voz e imágenes. Una persona puede tomar la conversación cuando quiera.',
  },
  {
    titulo: 'Agenda visual',
    texto: 'Reservar, mover, confirmar y marcar asistencia. Sin cruces de horario.',
  },
  {
    titulo: 'Avisos al equipo',
    texto: 'Cada reunión nueva llega por correo y por WhatsApp con el resumen del interesado.',
  },
  { titulo: 'Recordatorios', texto: '24 horas y 2 horas antes, para que la persona sí llegue.' },
  {
    titulo: 'Seguimiento automático',
    texto: 'A quien dejó de responder, dentro de las reglas de WhatsApp.',
  },
  {
    titulo: 'CRM propio',
    texto: 'Pipeline, leads, notas y exportación a Excel. Usuarios con roles.',
  },
  { titulo: 'Landings con píxel', texto: 'Una por servicio, medidas con el píxel de Meta.' },
  {
    titulo: 'Medición por ángulo',
    texto: 'Cuánto cuesta cada interesado calificado y cada reunión, por anuncio.',
  },
]

export type Celda = boolean | string
export const COMPARACION: { fila: string; aiuda: Celda; vendedor: Celda; agencia: Celda }[] = [
  {
    fila: 'Responde en segundos, a toda hora',
    aiuda: true,
    vendedor: 'En horario laboral',
    agencia: false,
  },
  { fila: 'Califica antes de agendar', aiuda: true, vendedor: true, agencia: false },
  { fila: 'Agenda en su calendario real', aiuda: true, vendedor: true, agencia: false },
  { fila: 'Crea y mide los anuncios', aiuda: true, vendedor: false, agencia: true },
  {
    fila: 'Cada conversación queda en un CRM',
    aiuda: true,
    vendedor: 'Si lo registra',
    agencia: false,
  },
  {
    fila: 'Costo por reunión medido',
    aiuda: true,
    vendedor: false,
    agencia: 'Solo costo por mensaje',
  },
  {
    fila: 'Vacaciones, rotación, capacitación',
    aiuda: 'No aplica',
    vendedor: 'Sí',
    agencia: 'No aplica',
  },
]

export const GARANTIAS = [
  {
    titulo: 'La pauta es suya',
    texto: 'La inversión en anuncios se paga directo a Meta, desde su cuenta. Usted ve cada dólar.',
  },
  {
    titulo: 'Sus datos son suyos',
    texto: 'Leads, conversaciones y reuniones se exportan a Excel cuando quiera.',
  },
  {
    titulo: 'Nunca escribimos primero',
    texto: 'Solo atendemos a quien escribe, dentro de las reglas de WhatsApp y de la LOPDP.',
  },
  {
    titulo: 'El asistente no promete',
    texto: 'No da asesoría ni precios: entiende, califica y agenda con su equipo.',
  },
]

export const PREGUNTAS = [
  {
    pregunta: '¿Cuánto debo invertir en anuncios?',
    respuesta:
      'Se arranca con poco y se sube con datos. La inversión la decide usted y se paga directo a Meta, aparte del plan. Con la calculadora de esta página puede ver qué costo por reunión necesita para que le convenga.',
  },
  {
    pregunta: '¿En cuánto tiempo llegan las reuniones?',
    respuesta:
      'No prometemos plazos. En la primera semana quedan los anuncios, el asistente y la agenda en marcha; desde ahí medimos cada semana qué servicio trae reuniones y movemos el presupuesto hacia lo que funciona.',
  },
  {
    pregunta: '¿El asistente suena como un robot?',
    respuesta:
      'Escribe en español natural, con el tono de su empresa, y solo usa la información que usted cargó. Si algo no lo sabe, dice que su equipo lo confirma en la reunión.',
  },
  {
    pregunta: '¿Puedo ver lo que el asistente conversa?',
    respuesta:
      'Sí. Cada conversación queda en su CRM y en la bandeja de su equipo, y cualquiera puede tomarla en el momento.',
  },
  {
    pregunta: '¿Necesito un número de WhatsApp nuevo?',
    respuesta:
      'Su empresa usa un número propio para el asistente, con su nombre y su logo, conectado a la API oficial de WhatsApp.',
  },
  {
    pregunta: '¿Hay permanencia mínima?',
    respuesta:
      'Lo conversamos en la primera reunión según el plan. La pauta y los datos siempre quedan a su nombre.',
  },
  {
    pregunta: '¿Cómo cuidan los datos de mis clientes?',
    respuesta:
      'Cada empresa tiene su espacio aislado; nadie más ve sus datos. Tratamos la información según la Ley Orgánica de Protección de Datos Personales de Ecuador y usted puede pedir su eliminación.',
  },
]
