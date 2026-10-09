-- 0004 — Contacto y conversación de Chatwoot de cada lead.
-- Se crean una sola vez (el primer mensaje); después n8n solo publica en esa
-- conversación, sin buscar el contacto en cada mensaje.

alter table leads
  add column chatwoot_contacto_id integer,
  add column chatwoot_conversacion_id integer;
