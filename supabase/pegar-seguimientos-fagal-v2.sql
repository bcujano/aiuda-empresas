-- Pegar en el SQL Editor de Supabase (aiuda-empresas). Se puede correr varias veces.
-- Seguimientos de Fagal reescritos: cortos, sin repetir lo que ya se dijo y pensados para quien
-- respondió a un contacto en frío (nadie nos escribió primero). {nombre} solo sale si es el de una persona.
update secuencias set pasos = '[
  {"minutos": 240, "texto": "Quedo atento: ¿le sirve una reunión breve de 20 minutos con {especialista} de {organizacion}? Puedo ofrecerle horarios hoy o mañana.", "plantilla": null},
  {"minutos": 1380, "texto": "Le escribo una última vez: si más adelante necesita apoyo con {servicio}, aquí estamos. ¿Le dejo reservado un horario esta semana?", "plantilla": null}
]'::jsonb
where codigo = 'sin_respuesta' and organizacion_id = (select id from organizaciones where slug = 'fagal');

update secuencias set pasos = '[
  {"minutos": 120, "texto": "Quedó pendiente elegir el horario con {especialista} de {organizacion}. ¿Le sirve mañana en la mañana o en la tarde?", "plantilla": null},
  {"minutos": 1380, "texto": "Todavía tengo horarios libres esta semana para esa reunión. ¿Cuál le acomoda?", "plantilla": null}
]'::jsonb
where codigo = 'calificado_sin_cita' and organizacion_id = (select id from organizaciones where slug = 'fagal');

select codigo, jsonb_array_length(pasos) as pasos from secuencias
where organizacion_id = (select id from organizaciones where slug = 'fagal') order by codigo;
