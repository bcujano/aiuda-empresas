-- Prefijo de las plantillas de WhatsApp de cada cliente (ej. fagal_aviso_cita_equipo).
-- Meta exige nombres en minúsculas, números y guiones bajos.
alter table organizaciones
  add column prefijo_plantillas text not null default ''
    check (prefijo_plantillas ~ '^([a-z0-9]+_)?$');
