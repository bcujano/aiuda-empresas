-- Pegar en el SQL Editor de Supabase (aiuda-empresas). Se puede correr varias veces.
-- Equivale a la migración 0007 + secuencias de Fagal.

-- Seguimiento automático por WhatsApp: secuencias por situación del lead y cola de envíos.
-- Dentro de la ventana gratis se escribe texto libre; fuera, solo con plantilla aprobada.
-- Si la persona responde, avanza o pide la baja, todo lo pendiente se cancela.

alter table leads add column if not exists no_contactar boolean not null default false;
alter table organizaciones add column if not exists wa_waba_id text check (wa_waba_id ~ '^[0-9]{6,20}$');

create table if not exists secuencias (
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

create table if not exists seguimientos (
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
create index if not exists seguimientos_cola_idx on seguimientos (estado, programado_at) where estado = 'pendiente';
create index if not exists seguimientos_lead_idx on seguimientos (lead_id, estado);

-- Fagal: secuencias de seguimiento. Los minutos cuentan desde el último mensaje del asistente.
-- Variables: {nombre} {organizacion} {especialista} {servicio}. Se editan en el CRM.
update organizaciones set wa_waba_id = '28998833426402954' where slug = 'fagal';

insert into secuencias (organizacion_id, codigo, nombre, pasos)
select o.id, s.codigo, s.nombre, s.pasos::jsonb
from organizaciones o, (values
  ('sin_respuesta', 'No respondió', '[
    {"minutos": 180, "texto": "Hola {nombre}, ¿pudo revisar mi mensaje? Si me cuenta en una frase qué necesita su empresa, le propongo horarios para reunirse con {especialista} de {organizacion}.", "plantilla": null},
    {"minutos": 1260, "texto": "Le escribo una última vez por aquí: si todavía necesita ayuda con {servicio}, respóndame y le comparto los horarios disponibles.", "plantilla": null},
    {"minutos": 2880, "texto": "Hola {nombre}, ¿sigue interesado en {servicio}? Puedo ofrecerle horarios para una reunión con {organizacion}.", "plantilla": "seguimiento_lead"}
  ]'),
  ('calificado_sin_cita', 'Calificado sin reunión', '[
    {"minutos": 120, "texto": "{nombre}, quedó pendiente elegir el horario de su reunión con {especialista} de {organizacion}. ¿Le comparto las opciones disponibles?", "plantilla": null},
    {"minutos": 1320, "texto": "Le recuerdo que tenemos horarios libres esta semana para revisar su tema de {servicio}. ¿Cuál le acomoda?", "plantilla": null},
    {"minutos": 2880, "texto": "Hola {nombre}, ¿sigue interesado en {servicio}? Puedo ofrecerle horarios para una reunión con {organizacion}.", "plantilla": "seguimiento_lead"}
  ]'),
  ('no_asistio', 'No asistió a la reunión', '[
    {"minutos": 60, "texto": "Hola {nombre}, no logramos reunirnos. ¿Le ayudo a elegir otro horario con {organizacion}?", "plantilla": "seguimiento_lead"}
  ]')
) as s(codigo, nombre, pasos)
where o.slug = 'fagal'
on conflict (organizacion_id, codigo) do nothing;
