-- Seguimiento automático por WhatsApp: secuencias por situación del lead y cola de envíos.
-- Dentro de la ventana gratis se escribe texto libre; fuera, solo con plantilla aprobada.
-- Si la persona responde, avanza o pide la baja, todo lo pendiente se cancela.

alter table leads add column no_contactar boolean not null default false;
alter table organizaciones add column wa_waba_id text check (wa_waba_id ~ '^[0-9]{6,20}$');

create table secuencias (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  codigo text not null check (codigo in ('sin_respuesta', 'calificado_sin_cita', 'no_asistio')),
  nombre text not null,
  activa boolean not null default true,
  -- [{ "minutos": 180, "texto": "…", "plantilla": null | "nombre_plantilla" }]
  pasos jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  unique (organizacion_id, codigo)
);
alter table secuencias enable row level security;

create table seguimientos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  secuencia text not null,
  paso integer not null,
  programado_at timestamptz not null,
  texto text not null,
  plantilla text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'enviado', 'cancelado', 'fallido', 'sin_ventana')),
  enviado_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
alter table seguimientos enable row level security;
create index seguimientos_cola_idx on seguimientos (estado, programado_at) where estado = 'pendiente';
create index seguimientos_lead_idx on seguimientos (lead_id, estado);
