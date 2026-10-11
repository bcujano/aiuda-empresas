-- Prueba social de la landing de Aiuda: testimonios reales con autorización y
-- clientes que aceptaron aparecer como caso. Nada se muestra sin autorización.
create table testimonios (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid references organizaciones(id) on delete set null,
  autor text not null,
  cargo text,
  empresa text not null,
  texto text not null,
  calificacion smallint check (calificacion between 1 and 5),
  foto_url text,
  autorizado boolean not null default false,
  visible boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);
alter table testimonios enable row level security;

alter table organizaciones add column caso_publico boolean not null default false;
