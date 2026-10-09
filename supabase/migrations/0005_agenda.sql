-- Agenda propia de cada cliente: horario de atención, reglas de las citas,
-- a quién avisar y lo que hace falta para confirmar y recordar sin cruces.

create extension if not exists btree_gist;

-- Reglas de agenda y contactos de aviso de la organización.
alter table organizaciones
  add column cita_minutos integer not null default 45 check (cita_minutos between 15 and 240),
  add column cita_intervalo_minutos integer not null default 60
    check (cita_intervalo_minutos between 15 and 240),
  add column cita_anticipacion_horas integer not null default 3
    check (cita_anticipacion_horas between 0 and 72),
  add column cita_dias_adelante integer not null default 10
    check (cita_dias_adelante between 1 and 60),
  add column modalidades text[] not null default array['virtual', 'presencial'],
  add column direccion text,
  add column aviso_email text,
  add column aviso_whatsapp text;

-- Horario de atención: una fila por día y tramo (1 = lunes … 7 = domingo).
create table horarios_atencion (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 1 and 7),
  desde time not null,
  hasta time not null check (hasta > desde),
  unique (organizacion_id, dia_semana, desde)
);
alter table horarios_atencion enable row level security;

-- Seguimiento de la cita: quién la propuso, confirmación del equipo y recordatorios.
alter table citas
  add column token uuid not null default gen_random_uuid() unique,
  add column origen text not null default 'agente' check (origen in ('agente', 'equipo')),
  add column confirmada_at timestamptz,
  add column aviso_equipo_at timestamptz,
  add column recordatorio_24h_at timestamptz,
  add column recordatorio_2h_at timestamptz;

-- Nunca dos citas vivas de la misma organización que se crucen.
alter table citas add constraint citas_sin_cruce exclude using gist (
  organizacion_id with =,
  tstzrange(inicia_at, termina_at) with &&
) where (estado in ('agendada', 'confirmada'));

create index citas_recordatorios_idx on citas (estado, inicia_at)
  where estado in ('agendada', 'confirmada');
