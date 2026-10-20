-- Contacto en frío de cada cliente: la lista de prospectos (empresas con datos públicos) y la
-- campaña que decide cuántos se contactan por día y con qué texto de correo.
-- WhatsApp sale con plantilla aprobada de Meta; el correo, por el n8n del avisos.

create table prospectos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  nombre text not null,
  segmento text,
  -- Ángulo (servicio) con el que se les habla: define la referencia del enlace.
  angulo_codigo text,
  telefono text,
  telefono_wa text check (telefono_wa is null or telefono_wa ~ '^\+[1-9][0-9]{7,14}$'),
  email text,
  website text,
  direccion text,
  token uuid not null default gen_random_uuid() unique,
  whatsapp_at timestamptz,
  email_at timestamptz,
  respondio_at timestamptz,
  baja_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
alter table prospectos enable row level security;
create unique index prospectos_wa_idx on prospectos (organizacion_id, telefono_wa) where telefono_wa is not null;
create unique index prospectos_email_idx on prospectos (organizacion_id, lower(email)) where email is not null;

create table campanas_frio (
  organizacion_id uuid primary key references organizaciones(id) on delete cascade,
  activa boolean not null default false,
  por_dia integer not null default 30 check (por_dia between 1 and 200),
  -- Nombre base de la plantilla de WhatsApp (se le antepone el prefijo del cliente).
  plantilla text not null default 'contacto_inicial',
  asunto text not null,
  -- Variables: {empresa} {segmento} {organizacion} {enlace} {baja}
  cuerpo text not null,
  -- Días de espera para escribir por correo a quien ya recibió el WhatsApp y no respondió.
  dias_correo integer not null default 3 check (dias_correo between 1 and 30),
  updated_at timestamptz not null default now()
);
alter table campanas_frio enable row level security;
