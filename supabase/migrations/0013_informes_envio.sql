-- Informes del cliente guardados tal como se revisaron y programados para salir por correo.
create table informes_envio (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  datos jsonb not null,
  destino text not null,
  asunto text not null,
  enviar_at timestamptz not null,
  enviado_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
alter table informes_envio enable row level security;
create index informes_envio_cola_idx on informes_envio (enviar_at) where enviado_at is null;
