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
