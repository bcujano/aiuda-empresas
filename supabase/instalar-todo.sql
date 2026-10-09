-- ============================================================
-- Aiuda Empresas · instalación completa (pegar UNA vez en el SQL Editor)
-- Migraciones 0001–0003 + Fagal Abogados. Generado desde supabase/.
-- ============================================================

-- ---------- supabase/migrations/0001_organizaciones_y_usuarios.sql ----------
-- 0001 — Organizaciones (cada cliente de Aiuda) y usuarios con tres roles.
--
-- Una organización es un cliente: Fagal, el siguiente, el que venga. Todo dato
-- del negocio cuelga de una organización. Aiuda (superadmin) no pertenece a
-- ninguna: ve todas.

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create table organizaciones (
  id uuid primary key default gen_random_uuid(),
  -- Dirección pública de su landing: /fagal
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Prefijo de las referencias de WhatsApp: FAG-TRI
  codigo text not null unique check (codigo ~ '^[A-Z]{2,5}$'),
  nombre text not null,
  rubro text not null,
  -- Con quién se reúne el lead, tal como se dice en la landing: «un abogado».
  especialista text not null default 'un especialista',
  ciudad text,
  logo_url text,
  -- Color de marca para la landing y la barra del CRM (#RRGGBB).
  color_primario text not null default '#1f3a5f' check (color_primario ~ '^#[0-9a-fA-F]{6}$'),

  -- Plan del CRM. Lo hace cumplir el servidor (src/lib/planes.ts).
  estado_plan text not null default 'prueba'
    check (estado_plan in ('prueba', 'activo', 'restringido', 'suspendido')),
  inicio_contrato date not null default current_date,
  prueba_hasta date not null default (current_date + interval '3 months'),

  -- Módulos encendidos además de los comunes (p. ej. 'pedidos').
  modulos text[] not null default '{}',

  -- WhatsApp del cliente (número propio, WABA de Aiuda).
  wa_numero text check (wa_numero is null or wa_numero ~ '^\+[1-9][0-9]{7,14}$'),
  wa_phone_number_id text unique,
  -- Chatwoot: una cuenta por cliente.
  chatwoot_cuenta_id integer,
  chatwoot_bandeja_id integer,
  -- Píxel de Meta con el que se mide su landing.
  pixel_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizaciones_updated_at before update on organizaciones
  for each row execute function set_updated_at();

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  organizacion_id uuid references organizaciones(id) on delete cascade,
  nombre_completo text not null,
  rol text not null check (rol in ('superadmin', 'admin', 'operador')),
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- El superadmin no pertenece a ninguna organización; los demás, siempre a una.
  constraint usuarios_rol_organizacion check (
    (rol = 'superadmin' and organizacion_id is null)
    or (rol <> 'superadmin' and organizacion_id is not null)
  )
);

create trigger usuarios_updated_at before update on usuarios
  for each row execute function set_updated_at();

create index usuarios_organizacion_idx on usuarios (organizacion_id);

-- ---------- supabase/migrations/0002_comercial.sql ----------
-- 0002 — Lo comercial de cada organización: ángulos de anuncio, leads, citas,
-- actividad, conocimiento del wizard y uso de IA.
-- Toda tabla lleva organizacion_id: el servidor filtra siempre por ella.

-- Un ángulo es un servicio anunciado con su mensaje. Es la unidad de la prueba
-- de nichos: cada anuncio de Meta apunta a un ángulo y el CRM mide su costo
-- por reunión. Los textos de la landing viven aquí, no en el código.
create table angulos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Sufijo de la referencia de WhatsApp: FAG-<codigo>
  codigo text not null check (codigo ~ '^[A-Z0-9]{2,6}$'),
  servicio text not null,
  titular text not null,
  subtitulo text not null,
  -- Lista de dolores en la voz del cliente: «¿Te pasa esto?»
  dolores text[] not null default '{}',
  para_quien text[] not null default '{}',
  no_para_quien text[] not null default '{}',
  -- [{ "pregunta": "...", "respuesta": "..." }]
  preguntas jsonb not null default '[]',
  mensaje_whatsapp text not null,
  -- Anuncios de Meta que traen a este ángulo (para el costo por reunión).
  meta_ad_ids text[] not null default '{}',
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacion_id, slug),
  unique (organizacion_id, codigo)
);

create trigger angulos_updated_at before update on angulos
  for each row execute function set_updated_at();

create table leads (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  telefono text not null check (telefono ~ '^\+[1-9][0-9]{7,14}$'),
  nombre text,
  empresa text,
  ruc text check (ruc is null or ruc ~ '^[0-9]{13}$'),
  cargo text,
  colaboradores text check (colaboradores is null or colaboradores in
    ('1-9', '10-49', '50-199', '200+')),
  ciudad text,
  -- Resumen de la necesidad en palabras del agente. Nunca detalles del caso.
  necesidad text,
  urgencia text check (urgencia is null or urgencia in ('baja', 'media', 'alta')),
  encaje integer check (encaje is null or encaje between 0 and 100),
  etapa text not null default 'nuevo'
    check (etapa in ('nuevo', 'calificado', 'agendado', 'asistio', 'cliente', 'descartado')),
  motivo_descarte text,
  origen text not null
    check (origen in ('anuncio_whatsapp', 'landing', 'whatsapp_directo', 'redes_cliente', 'manual')),
  angulo_id uuid references angulos(id) on delete set null,
  -- Objeto referral tal cual llega de Click-to-WhatsApp.
  referral jsonb,
  meta_ad_id text,
  primer_contacto_at timestamptz not null default now(),
  -- Último mensaje del lead: define si la ventana gratis de WhatsApp está abierta.
  ultimo_inbound_at timestamptz,
  -- 72 h si entró por anuncio Click-to-WhatsApp, 24 h en otro caso.
  ventana_horas integer not null default 24 check (ventana_horas in (24, 72)),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacion_id, telefono)
);

create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();

create index leads_org_etapa_idx on leads (organizacion_id, etapa);
create index leads_org_angulo_idx on leads (organizacion_id, angulo_id);

create table citas (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  inicia_at timestamptz not null,
  termina_at timestamptz not null check (termina_at > inicia_at),
  modalidad text not null default 'virtual' check (modalidad in ('virtual', 'presencial')),
  estado text not null default 'agendada'
    check (estado in ('agendada', 'confirmada', 'asistio', 'no_asistio', 'cancelada')),
  google_event_id text,
  enlace_reunion text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger citas_updated_at before update on citas
  for each row execute function set_updated_at();

create index citas_org_inicio_idx on citas (organizacion_id, inicia_at);

-- Lo que pasó con el lead: mensajes resumidos, cambios de etapa, notas.
create table actividad (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  tipo text not null check (tipo in ('mensaje_entrante', 'mensaje_agente', 'mensaje_persona',
    'cambio_etapa', 'nota', 'cita', 'escalado')),
  contenido text not null,
  autor text,
  created_at timestamptz not null default now()
);

create index actividad_lead_idx on actividad (lead_id, created_at desc);

-- Lo que llena el admin del cliente en el wizard. Alimenta al agente.
create table conocimiento (
  organizacion_id uuid primary key references organizaciones(id) on delete cascade,
  datos jsonb not null default '{}',
  completado_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger conocimiento_updated_at before update on conocimiento
  for each row execute function set_updated_at();

create table uso_ia (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  fecha date not null default current_date,
  proveedor text not null check (proveedor in ('gemini', 'openai')),
  modelo text not null,
  tokens_entrada integer not null default 0,
  tokens_salida integer not null default 0,
  costo_usd numeric(10, 5) not null default 0,
  created_at timestamptz not null default now()
);

create index uso_ia_org_fecha_idx on uso_ia (organizacion_id, fecha);

-- ---------- supabase/migrations/0003_rls.sql ----------
-- 0003 — RLS habilitado y denegando por defecto en todas las tablas.
-- Sin políticas, RLS niega todo a la llave anónima. El acceso legítimo entra
-- con service_role desde el servidor, que filtra por organización en cada
-- consulta (src/server/**). Es defensa en profundidad, no el control principal.

alter table organizaciones enable row level security;
alter table usuarios       enable row level security;
alter table angulos        enable row level security;
alter table leads          enable row level security;
alter table citas          enable row level security;
alter table actividad      enable row level security;
alter table conocimiento   enable row level security;
alter table uso_ia         enable row level security;

-- ---------- supabase/semillas/fagal.sql ----------
-- Semilla de la organización Fagal Abogados y sus 3 ángulos de la primera ronda.
-- Se pega UNA vez en el SQL Editor, después de las migraciones.
-- Los textos no prometen resultados (lo pidió Fagal) y no inventan datos del
-- estudio: años, casos y ciudad llegan con el wizard. Los ajustes se hacen en el CRM.

-- wa_numero: número propio de Fagal en la WABA de Aiuda (Byron, 2026-10-10).
-- El Phone Number ID se carga cuando Meta lo entregue (wa_phone_number_id).
insert into organizaciones (slug, codigo, nombre, rubro, especialista, wa_numero)
values ('fagal', 'FAG', 'Fagal Abogados', 'Estudio jurídico', 'un abogado', '+593992580707')
on conflict (slug) do update set wa_numero = excluded.wa_numero;

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
