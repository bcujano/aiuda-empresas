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

-- Lo que incluye cada plan, en frases para la landing de Aiuda Empresas y para el panel.
alter table planes add column if not exists incluye text[] not null default '{}';

-- Lo que incluye cada plan (se edita en la base o, más adelante, en el panel de planes).
-- «(en preparación)» marca lo que todavía no está construido: no se promete como si existiera.
update planes set incluye = array[
  'Campaña en Meta con hasta 5 ángulos (la inversión en anuncios la paga directo a Meta)',
  'Landings por servicio con píxel de Meta',
  'Asistente con IA en WhatsApp 24/7: atiende, califica y agenda',
  'Agenda con confirmación del equipo y recordatorios automáticos',
  'Seguimiento automático dentro de la ventana gratis de WhatsApp',
  'CRM con 1 usuario y reporte mensual'
] where codigo = 'basico';
update planes set incluye = array[
  'Todo lo del Básico, con 3 usuarios',
  'Ángulos ilimitados y creativos nuevos cada mes',
  'Seguimiento con plantillas de WhatsApp fuera de la ventana gratis',
  'Resultados en vivo: costo por lead calificado y por reunión',
  'Listas de prospectos con datos públicos (en preparación)',
  'Alertas de cambios en webs de la competencia (en preparación)'
] where codigo = 'crecimiento';
update planes set incluye = array[
  'Todo lo de Crecimiento, con 10 usuarios',
  'Alertas de licitaciones públicas (SERCOP) a su medida (en preparación)',
  'Agente de voz que devuelve llamadas (en preparación)',
  'Notas de reuniones con IA en su CRM (en preparación)',
  'Propuesta y firma electrónica (en preparación)',
  'Revisión mensual con su equipo'
] where codigo = 'escala';
update planes set incluye = array[
  'Todo lo de Escala, sin límites prácticos',
  'Meta de reuniones calificadas en el contrato',
  'Equipo y gerente de cuenta dedicados',
  'Infraestructura y dominio propios',
  'Integración con su ERP o CRM',
  'Producción semanal de creativos'
] where codigo = 'corporativo';
