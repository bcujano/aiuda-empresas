-- 0001 — Organizaciones (cada cliente de Aiuda) y usuarios con tres roles.
--
-- Una organización es un cliente: Fagal, el siguiente, el que venga. Todo dato
-- del negocio cuelga de una organización. Aiuda (superadmin) no pertenece a
-- ninguna: ve todas.

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create table organizaciones (
  id uuid primary key default gen_random_uuid(),
  -- Dirección pública de su landing: /fagal
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Prefijo de las referencias de WhatsApp: FAG-TRI
  codigo text not null unique check (codigo ~ '^[A-Z]{2,5}$'),
  nombre text not null,
  rubro text not null,
  -- Con quién se reúne el lead, tal como se dice en la landing: «un abogado».
  especialista text not null default 'un especialista',
  ciudad text,
  logo_url text,
  -- Color de marca para la landing y la barra del CRM (#RRGGBB).
  color_primario text not null default '#1f3a5f' check (color_primario ~ '^#[0-9a-fA-F]{6}$'),

  -- Plan del CRM. Lo hace cumplir el servidor (src/lib/planes.ts).
  estado_plan text not null default 'prueba'
    check (estado_plan in ('prueba', 'activo', 'restringido', 'suspendido')),
  inicio_contrato date not null default current_date,
  prueba_hasta date not null default (current_date + interval '3 months'),

  -- Módulos encendidos además de los comunes (p. ej. 'pedidos').
  modulos text[] not null default '{}',

  -- WhatsApp del cliente (número propio, WABA de Aiuda).
  wa_numero text check (wa_numero is null or wa_numero ~ '^\+[1-9][0-9]{7,14}$'),
  wa_phone_number_id text unique,
  -- Chatwoot: una cuenta por cliente.
  chatwoot_cuenta_id integer,
  chatwoot_bandeja_id integer,
  -- Píxel de Meta con el que se mide su landing.
  pixel_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizaciones_updated_at before update on organizaciones
  for each row execute function set_updated_at();

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  organizacion_id uuid references organizaciones(id) on delete cascade,
  nombre_completo text not null,
  rol text not null check (rol in ('superadmin', 'admin', 'operador')),
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- El superadmin no pertenece a ninguna organización; los demás, siempre a una.
  constraint usuarios_rol_organizacion check (
    (rol = 'superadmin' and organizacion_id is null)
    or (rol <> 'superadmin' and organizacion_id is not null)
  )
);

create trigger usuarios_updated_at before update on usuarios
  for each row execute function set_updated_at();

create index usuarios_organizacion_idx on usuarios (organizacion_id);
