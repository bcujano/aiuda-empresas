-- Cada contacto en frío por WhatsApp queda registrado en Chatwoot (conversación con nota privada)
-- para que el equipo lo vea, lo asigne a una persona y el agente se detenga.
alter table prospectos
  add column chatwoot_conversacion_id integer,
  add column chatwoot_at timestamptz;
-- Texto con que sale la plantilla de WhatsApp ({1} = contacto, {2} = empresa), solo para registrarlo.
alter table campanas_frio add column texto_wa text;
