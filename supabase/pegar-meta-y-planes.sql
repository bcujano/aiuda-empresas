-- Pegar UNA vez en el SQL Editor de Supabase (aiuda-empresas): migración 0006 + datos de Meta de Fagal.

-- Planes de suscripción de Aiuda y conexión de cada organización con Meta y Drive.
-- El token de Meta NO vive aquí: es uno solo de Aiuda (usuario del sistema del
-- Business Manager) y está en las variables de entorno. Aquí van solo los IDs.

create table planes (
  codigo text primary key check (codigo ~ '^[a-z0-9-]{2,30}$'),
  nombre text not null,
  precio_mensual numeric(10, 2) not null check (precio_mensual >= 0),
  mas_iva boolean not null default true,
  descripcion text not null default '',
  modulos text[] not null default '{}',
  limites jsonb not null default '{}',
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table planes enable row level security;

insert into planes (codigo, nombre, precio_mensual, descripcion, orden) values
  ('basico', 'Básico', 200, 'Pauta en Meta, agente de WhatsApp que califica y agenda, CRM y agenda.', 1),
  ('crecimiento', 'Crecimiento', 1200, 'Más ángulos y presupuesto gestionado, seguimiento automático y reportes.', 2),
  ('escala', 'Escala', 2500, 'Prospección activa y señales de compra además de la pauta.', 3),
  ('corporativo', 'Corporativo', 10000, 'Equipo dedicado, todos los módulos y metas de reuniones.', 4)
on conflict (codigo) do nothing;

alter table organizaciones
  add column plan_codigo text not null default 'basico' references planes(codigo),
  add column precio_acordado numeric(10, 2),
  add column meta_ad_account_id text check (meta_ad_account_id ~ '^[0-9]{6,20}$'),
  add column meta_page_id text check (meta_page_id ~ '^[0-9]{6,20}$'),
  add column meta_ig_id text check (meta_ig_id ~ '^[0-9]{6,20}$'),
  add column drive_carpeta_id text;

-- Fagal: plan Básico ($200 + IVA) y su pauta desde la cuenta publicitaria y página de Aiuda.
update organizaciones set
  plan_codigo = 'basico',
  precio_acordado = 200,
  meta_ad_account_id = '146375004761568',
  meta_page_id = '835033990167463',
  meta_ig_id = '17841412271290888'
where slug = 'fagal';
