-- Semilla de la organización Fagal Abogados y sus 3 ángulos de la primera ronda.
-- Se pega UNA vez en el SQL Editor, después de las migraciones.
-- Los textos no prometen resultados (lo pidió Fagal) y no inventan datos del
-- estudio: años, casos y ciudad llegan con el wizard. Los ajustes se hacen en el CRM.

insert into organizaciones (slug, codigo, nombre, rubro, especialista)
values ('fagal', 'FAG', 'Fagal Abogados', 'Estudio jurídico', 'un abogado')
on conflict (slug) do nothing;

with org as (select id from organizaciones where slug = 'fagal')
insert into angulos (organizacion_id, slug, codigo, servicio, titular, subtitulo, dolores,
  para_quien, no_para_quien, preguntas, mensaje_whatsapp, orden)
select org.id, a.slug, a.codigo, a.servicio, a.titular, a.subtitulo, a.dolores,
  a.para_quien, a.no_para_quien, a.preguntas::jsonb, a.mensaje_whatsapp, a.orden
from org, (values
  (
    'tributario', 'TRI', 'Defensa tributaria ante el SRI',
    'Responde al SRI con estrategia, no con prisa',
    'Asesoría legal para empresas que recibieron una glosa, una determinación o un requerimiento del SRI. Un abogado tributarista revisa tu caso antes de que venzan los plazos.',
    array[
      'Te llegó una comunicación de diferencias o una glosa y el plazo ya corre.',
      'Tu contador hizo lo que pudo, pero ahora hace falta un abogado.',
      'Tienes una devolución de IVA detenida desde hace meses.',
      'No sabes si conviene pagar, reclamar o impugnar.'
    ],
    array[
      'Empresas y sociedades con obligaciones tributarias activas',
      'Gerentes, contadores y directores financieros',
      'Casos con un requerimiento, una glosa o un proceso abierto'
    ],
    array[
      'Declaraciones de personas naturales sin conflicto con el SRI',
      'Trámites que solo necesitan un contador'
    ],
    '[{"pregunta":"¿Qué pasa cuando escribo?","respuesta":"Un asistente virtual te hace tres preguntas para entender la situación de tu empresa y te propone horarios para reunirte con un abogado de Fagal."},{"pregunta":"¿Tengo que contar mi caso por WhatsApp?","respuesta":"No. Solo pedimos datos generales de la empresa. Los detalles los revisas directamente con el abogado en la reunión."},{"pregunta":"¿Atienden a empresas de cualquier tamaño?","respuesta":"Atendemos a empresas y sociedades. Si tu caso no es para nosotros, te lo decimos en la primera conversación."}]',
    'Hola, mi empresa necesita asesoría tributaria con el SRI.', 1
  ),
  (
    'laboral', 'LAB', 'Derecho laboral para empleadores',
    'Protege a tu empresa en cada decisión laboral',
    'Asesoría legal para empleadores en Ecuador: despidos, actas de finiquito, inspecciones del Ministerio del Trabajo, reglamentos internos y demandas laborales.',
    array[
      'Necesitas desvincular a alguien y no sabes cómo hacerlo sin riesgo.',
      'Te notificaron una inspección del Ministerio del Trabajo.',
      'Un extrabajador te demandó o amenaza con hacerlo.',
      'Tus contratos o tu reglamento interno ya no están al día.'
    ],
    array[
      'Empresas con 10 o más colaboradores',
      'Dueños, gerentes y jefes de talento humano'
    ],
    array[
      'Trabajadores que quieren demandar a su empleador'
    ],
    '[{"pregunta":"¿Qué pasa cuando escribo?","respuesta":"Un asistente virtual te hace tres preguntas para entender la situación de tu empresa y te propone horarios para reunirte con un abogado de Fagal."},{"pregunta":"¿Tengo que contar mi caso por WhatsApp?","respuesta":"No. Solo pedimos datos generales de la empresa. Los detalles los revisas directamente con el abogado en la reunión."},{"pregunta":"¿Atienden a trabajadores?","respuesta":"Este canal es para empleadores. Si eres trabajador, te indicamos a dónde acudir."}]',
    'Hola, mi empresa necesita asesoría laboral como empleador.', 2
  ),
  (
    'cumplimiento', 'CUM', 'Cumplimiento: protección de datos y UAFE',
    'Pon a tu empresa en regla con la Ley de Protección de Datos',
    'Para empresas que manejan datos de clientes o que reportan a la UAFE: diagnóstico, políticas, cláusulas de consentimiento y procedimientos internos.',
    array[
      'Tienes bases de datos de clientes y no sabes si cumples la ley.',
      'Envías publicidad o mensajes sin un consentimiento documentado.',
      'Tu sector reporta a la UAFE y todo depende de una sola persona.',
      'Un cliente o proveedor grande te pidió demostrar cumplimiento.'
    ],
    array[
      'Constructoras, inmobiliarias, concesionarios, financieras y clínicas',
      'Empresas que manejan datos de clientes, pacientes o usuarios'
    ],
    array[
      'Consultas personales sobre los datos de una persona natural'
    ],
    '[{"pregunta":"¿Qué pasa cuando escribo?","respuesta":"Un asistente virtual te hace tres preguntas para entender la situación de tu empresa y te propone horarios para reunirte con un abogado de Fagal."},{"pregunta":"¿Tengo que contar mi caso por WhatsApp?","respuesta":"No. Solo pedimos datos generales de la empresa. Los detalles los revisas directamente con el abogado en la reunión."},{"pregunta":"¿Sirve si ya tengo una política de privacidad?","respuesta":"Sí. Revisamos lo que ya tienes y te decimos qué falta."}]',
    'Hola, quiero poner a mi empresa en regla con la protección de datos.', 3
  )
) as a(slug, codigo, servicio, titular, subtitulo, dolores, para_quien, no_para_quien,
  preguntas, mensaje_whatsapp, orden)
on conflict (organizacion_id, slug) do nothing;
