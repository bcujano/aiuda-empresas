import type { Angulo } from '@/types/database'

/**
 * Datos de muestra para /vista-previa (solo desarrollo) y pruebas. Copia de
 * supabase/semillas/fagal.sql; una prueba falla si dejan de coincidir.
 * El número es ficticio.
 */
export const ORG_DEMO = {
  nombre: 'Fagal Abogados',
  slug: 'fagal',
  codigo: 'FAG',
  especialista: 'un abogado',
  logo_url: null,
  color_primario: '#1f3a5f',
  pixel_id: null,
  wa_numero: '+593990000000',
}

export const ANGULOS_DEMO: Angulo[] = [
  {
    id: 'demo-0',
    organizacion_id: 'demo',
    slug: 'tributario',
    codigo: 'TRI',
    servicio: 'Defensa tributaria ante el SRI',
    titular: 'Responde al SRI con estrategia, no con prisa',
    subtitulo:
      'Asesoría legal para empresas que recibieron una glosa, una determinación o un requerimiento del SRI. Un abogado tributarista revisa tu caso antes de que venzan los plazos.',
    dolores: [
      'Te llegó una comunicación de diferencias o una glosa y el plazo ya corre.',
      'Tu contador hizo lo que pudo, pero ahora hace falta un abogado.',
      'Tienes una devolución de IVA detenida desde hace meses.',
      'No sabes si conviene pagar, reclamar o impugnar.',
    ],
    para_quien: [
      'Empresas y sociedades con obligaciones tributarias activas',
      'Gerentes, contadores y directores financieros',
      'Casos con un requerimiento, una glosa o un proceso abierto',
    ],
    no_para_quien: [
      'Declaraciones de personas naturales sin conflicto con el SRI',
      'Trámites que solo necesitan un contador',
    ],
    preguntas: [
      {
        pregunta: '¿Qué pasa cuando escribo?',
        respuesta:
          'Un asistente virtual te hace tres preguntas para entender la situación de tu empresa y te propone horarios para reunirte con un abogado de Fagal.',
      },
      {
        pregunta: '¿Tengo que contar mi caso por WhatsApp?',
        respuesta:
          'No. Solo pedimos datos generales de la empresa. Los detalles los revisas directamente con el abogado en la reunión.',
      },
      {
        pregunta: '¿Atienden a empresas de cualquier tamaño?',
        respuesta:
          'Atendemos a empresas y sociedades. Si tu caso no es para nosotros, te lo decimos en la primera conversación.',
      },
    ],
    mensaje_whatsapp: 'Hola, mi empresa necesita asesoría tributaria con el SRI.',
    meta_ad_ids: [],
    orden: 1,
    activo: true,
  },
  {
    id: 'demo-1',
    organizacion_id: 'demo',
    slug: 'laboral',
    codigo: 'LAB',
    servicio: 'Derecho laboral para empleadores',
    titular: 'Protege a tu empresa en cada decisión laboral',
    subtitulo:
      'Asesoría legal para empleadores en Ecuador: despidos, actas de finiquito, inspecciones del Ministerio del Trabajo, reglamentos internos y demandas laborales.',
    dolores: [
      'Necesitas desvincular a alguien y no sabes cómo hacerlo sin riesgo.',
      'Te notificaron una inspección del Ministerio del Trabajo.',
      'Un extrabajador te demandó o amenaza con hacerlo.',
      'Tus contratos o tu reglamento interno ya no están al día.',
    ],
    para_quien: [
      'Empresas con 10 o más colaboradores',
      'Dueños, gerentes y jefes de talento humano',
    ],
    no_para_quien: ['Trabajadores que quieren demandar a su empleador'],
    preguntas: [
      {
        pregunta: '¿Qué pasa cuando escribo?',
        respuesta:
          'Un asistente virtual te hace tres preguntas para entender la situación de tu empresa y te propone horarios para reunirte con un abogado de Fagal.',
      },
      {
        pregunta: '¿Tengo que contar mi caso por WhatsApp?',
        respuesta:
          'No. Solo pedimos datos generales de la empresa. Los detalles los revisas directamente con el abogado en la reunión.',
      },
      {
        pregunta: '¿Atienden a trabajadores?',
        respuesta:
          'Este canal es para empleadores. Si eres trabajador, te indicamos a dónde acudir.',
      },
    ],
    mensaje_whatsapp: 'Hola, mi empresa necesita asesoría laboral como empleador.',
    meta_ad_ids: [],
    orden: 2,
    activo: true,
  },
  {
    id: 'demo-2',
    organizacion_id: 'demo',
    slug: 'cumplimiento',
    codigo: 'CUM',
    servicio: 'Cumplimiento: protección de datos y UAFE',
    titular: 'Pon a tu empresa en regla con la Ley de Protección de Datos',
    subtitulo:
      'Para empresas que manejan datos de clientes o que reportan a la UAFE: diagnóstico, políticas, cláusulas de consentimiento y procedimientos internos.',
    dolores: [
      'Tienes bases de datos de clientes y no sabes si cumples la ley.',
      'Envías publicidad o mensajes sin un consentimiento documentado.',
      'Tu sector reporta a la UAFE y todo depende de una sola persona.',
      'Un cliente o proveedor grande te pidió demostrar cumplimiento.',
    ],
    para_quien: [
      'Constructoras, inmobiliarias, concesionarios, financieras y clínicas',
      'Empresas que manejan datos de clientes, pacientes o usuarios',
    ],
    no_para_quien: ['Consultas personales sobre los datos de una persona natural'],
    preguntas: [
      {
        pregunta: '¿Qué pasa cuando escribo?',
        respuesta:
          'Un asistente virtual te hace tres preguntas para entender la situación de tu empresa y te propone horarios para reunirte con un abogado de Fagal.',
      },
      {
        pregunta: '¿Tengo que contar mi caso por WhatsApp?',
        respuesta:
          'No. Solo pedimos datos generales de la empresa. Los detalles los revisas directamente con el abogado en la reunión.',
      },
      {
        pregunta: '¿Sirve si ya tengo una política de privacidad?',
        respuesta: 'Sí. Revisamos lo que ya tienes y te decimos qué falta.',
      },
    ],
    mensaje_whatsapp: 'Hola, quiero poner a mi empresa en regla con la protección de datos.',
    meta_ad_ids: [],
    orden: 3,
    activo: true,
  },
]
