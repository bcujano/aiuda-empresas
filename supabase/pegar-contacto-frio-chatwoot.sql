-- Pegar en el SQL Editor de Supabase (aiuda-empresas). Se puede correr varias veces.
-- Registro en Chatwoot de los contactos en frío (los ya enviados y los que vengan).
alter table prospectos add column if not exists chatwoot_conversacion_id integer;
alter table prospectos add column if not exists chatwoot_at timestamptz;
alter table campanas_frio add column if not exists texto_wa text;

update campanas_frio set texto_wa =
 'Hola {1}, le escribe el equipo de Fagal Abogados, Quito. Asesoramos a empresas en temas tributarios, laborales, societarios y de contratación pública. Encontramos los datos de {2} en fuentes públicas de empresas. ¿Le interesa una breve reunión con un abogado para revisar si podemos ayudarle? Si prefiere no recibir más mensajes, responda BAJA.'
where organizacion_id = (select id from organizaciones where slug = 'fagal') and texto_wa is null;

select count(*) filter (where whatsapp_at is not null and error is null) as whatsapp_enviados,
       count(*) filter (where email_at is not null and error is null) as correos_enviados,
       count(*) filter (where chatwoot_at is not null) as registrados_en_chatwoot
from prospectos;
