-- Pegar en el SQL Editor de Supabase (aiuda-empresas). Se puede correr varias veces.
alter table organizaciones
  add column if not exists prefijo_plantillas text not null default ''
    check (prefijo_plantillas ~ '^([a-z0-9]+_)?$');
update organizaciones set prefijo_plantillas = 'fagal_' where slug = 'fagal';
select slug, prefijo_plantillas from organizaciones;
