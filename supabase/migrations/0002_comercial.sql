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
