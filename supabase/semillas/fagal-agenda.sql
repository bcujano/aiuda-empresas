-- Fagal: agenda, datos del estudio para el agente y dos ángulos nuevos para pautar.
-- Datos dados por Byron el 2026-10-09. Se pega después de la migración 0005.

update organizaciones set
  ciudad = 'Quito',
  direccion = 'Av. 10 de Agosto N24-118 y Av. Colón, edificio Muresco, piso 7, Quito',
  modalidades = array['virtual', 'presencial'],
  cita_minutos = 45,
  cita_intervalo_minutos = 60,
  cita_anticipacion_horas = 3,
  cita_dias_adelante = 10
where slug = 'fagal';

-- Lunes a viernes, 8:00 a 17:00 (fuera de ese horario solo atienden a suscriptores).
insert into horarios_atencion (organizacion_id, dia_semana, desde, hasta)
select o.id, d, '08:00', '17:00'
from organizaciones o, generate_series(1, 5) d
where o.slug = 'fagal'
on conflict (organizacion_id, dia_semana, desde) do nothing;

insert into conocimiento (organizacion_id, datos)
select id, '{
  "experiencia": "Más de 15 años de experiencia.",
  "trayectoria": ["Asesoría corporativa a empresas", "Asesor legal de FENATRAPE", "Convenios interinstitucionales"],
  "direccion": "Av. 10 de Agosto N24-118 y Av. Colón, edificio Muresco, piso 7, Quito",
  "reuniones": "Virtuales o presenciales en la oficina; lo importante es reunirse.",
  "horario": "Lunes a viernes de 8:00 a 17:00. Fuera de ese horario se atiende solo a clientes con suscripción.",
  "honorarios": "Los define el abogado según el caso, en la reunión."
}'::jsonb
from organizaciones where slug = 'fagal'
on conflict (organizacion_id) do update set datos = excluded.datos, updated_at = now();

with org as (select id from organizaciones where slug = 'fagal')
insert into angulos (organizacion_id, slug, codigo, servicio, titular, subtitulo, dolores,
  para_quien, no_para_quien, preguntas, mensaje_whatsapp, orden)
select org.id, a.slug, a.codigo, a.servicio, a.titular, a.subtitulo, a.dolores,
  a.para_quien, a.no_para_quien, a.preguntas::jsonb, a.mensaje_whatsapp, a.orden
from org, (values
  (
    'societario', 'SOC', 'Derecho societario y corporativo',
    'Socios, juntas y decisiones grandes, bien amarradas',
    'Asesoría corporativa para empresas en Ecuador: conflictos entre socios, juntas impugnadas, salida o ingreso de socios, holding y empresas familiares ante la Superintendencia de Compañías.',
    array[
      'Un socio quiere salir, no aporta o bloquea las decisiones.',
      'Te impugnaron una junta o temes que lo hagan.',
      'Quieres ordenar la empresa familiar antes de que haya pleito.',
      'La Superintendencia de Compañías te pidió algo y no sabes cómo responder.'
    ],
    array[
      'Sociedades anónimas y compañías limitadas',
      'Socios, accionistas, gerentes y directorios',
      'Empresas familiares y grupos de empresas'
    ],
    array[
      'Personas que aún no tienen una empresa constituida y solo buscan un trámite simple'
    ],
    '[{"pregunta":"¿Qué pasa cuando escribo?","respuesta":"Un asistente virtual te hace tres preguntas sobre tu empresa y te ofrece horarios libres para reunirte con un abogado de Fagal."},{"pregunta":"¿Tengo que contar mi caso por WhatsApp?","respuesta":"No. Solo pedimos datos generales de la empresa. Los detalles los revisas con el abogado en la reunión."},{"pregunta":"¿La reunión es presencial?","respuesta":"Puede ser virtual o en la oficina de Quito, como te acomode."}]',
    'Hola, mi empresa necesita asesoría societaria con sus socios.', 4
  ),
  (
    'contratacion-publica', 'CON', 'Contratación pública y convenios con el Estado',
    'Vende al Estado sin poner en riesgo tu empresa',
    'Asesoría legal para proveedores y contratistas del Estado en Ecuador: ofertas en el SERCOP, sanciones, contratista incumplido, cobro de planillas y convenios interinstitucionales.',
    array[
      'Te declararon o amenazan con declararte contratista incumplido.',
      'Una entidad no te paga las planillas.',
      'Quieres ofertar pero no sabes si tus papeles aguantan una revisión.',
      'Necesitas firmar un convenio con una institución pública.'
    ],
    array[
      'Proveedores y contratistas del Estado registrados en el SERCOP',
      'Constructoras, consultoras y empresas de servicios que trabajan con el sector público',
      'Fundaciones y gremios que firman convenios interinstitucionales'
    ],
    array[
      'Personas que buscan empleo público'
    ],
    '[{"pregunta":"¿Qué pasa cuando escribo?","respuesta":"Un asistente virtual te hace tres preguntas sobre tu empresa y te ofrece horarios libres para reunirte con un abogado de Fagal."},{"pregunta":"¿Tengo que contar mi caso por WhatsApp?","respuesta":"No. Solo pedimos datos generales de la empresa. Los detalles los revisas con el abogado en la reunión."},{"pregunta":"¿Me ayudan si el plazo ya está corriendo?","respuesta":"Sí. Si hay un plazo, dilo al escribir y te damos la reunión más cercana disponible."}]',
    'Hola, mi empresa trabaja con el Estado y necesita asesoría en contratación pública.', 5
  )
) as a(slug, codigo, servicio, titular, subtitulo, dolores, para_quien, no_para_quien,
  preguntas, mensaje_whatsapp, orden)
on conflict (organizacion_id, slug) do nothing;

-- A quién avisar de cada cita nueva (correo y WhatsApp del equipo de Fagal) y píxel de
-- Meta de las landings. Cambia los valores y descomenta cuando los tengas:
-- update organizaciones set aviso_email = 'correo@fagal.ec', aviso_whatsapp = '+5939XXXXXXXX',
--   pixel_id = '000000000000000' where slug = 'fagal';
