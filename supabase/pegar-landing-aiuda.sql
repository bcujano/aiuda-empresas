-- Pegar en el SQL Editor de Supabase (aiuda-empresas). Se puede correr varias veces.
-- 1) Prefijo de plantillas (fagal_…)  2) testimonios y caso público  3) Aiuda como organización propia.
alter table organizaciones
  add column if not exists prefijo_plantillas text not null default ''
    check (prefijo_plantillas ~ '^([a-z0-9]+_)?$');
update organizaciones set prefijo_plantillas = 'fagal_' where slug = 'fagal';

create table if not exists testimonios (
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

alter table organizaciones add column if not exists caso_publico boolean not null default false;
-- Byron pidió mostrar a Fagal como cliente (2026-10-11). Se apaga desde Clientes si Fagal no lo autoriza.
update organizaciones set caso_publico = true where slug = 'fagal';

-- Aiuda Empresas usa su propia plataforma: es una organización más, con su número
-- +593985663057 (Aiuda Academy y Aiuda Consulting), independiente de 321.
insert into organizaciones (slug, codigo, nombre, rubro, especialista, ciudad, wa_numero, prefijo_plantillas, plan_codigo, estado_plan)
values ('aiuda', 'AIU', 'Aiuda', 'Crecimiento comercial con IA', 'un consultor de Aiuda', 'Quito', '+593985663057', 'aiuda_', 'corporativo', 'activo')
on conflict (slug) do nothing;

select slug, prefijo_plantillas, caso_publico from organizaciones order by slug;
