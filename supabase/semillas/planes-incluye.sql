-- Lo que incluye cada plan (se edita en la base o, más adelante, en el panel de planes).
-- «(en preparación)» marca lo que todavía no está construido: no se promete como si existiera.
update planes set incluye = array[
  'Campaña en Meta con hasta 5 ángulos (la inversión en anuncios la paga directo a Meta)',
  'Landings por servicio con píxel de Meta',
  'Asistente con IA en WhatsApp 24/7: atiende, califica y agenda',
  'Agenda con confirmación del equipo y recordatorios automáticos',
  'Seguimiento automático dentro de la ventana gratis de WhatsApp',
  'CRM con 1 usuario y reporte mensual'
] where codigo = 'basico';
update planes set incluye = array[
  'Todo lo del Básico, con 3 usuarios',
  'Ángulos ilimitados y creativos nuevos cada mes',
  'Seguimiento con plantillas de WhatsApp fuera de la ventana gratis',
  'Resultados en vivo: costo por lead calificado y por reunión',
  'Listas de prospectos con datos públicos (en preparación)',
  'Alertas de cambios en webs de la competencia (en preparación)'
] where codigo = 'crecimiento';
update planes set incluye = array[
  'Todo lo de Crecimiento, con 10 usuarios',
  'Alertas de licitaciones públicas (SERCOP) a su medida (en preparación)',
  'Agente de voz que devuelve llamadas (en preparación)',
  'Notas de reuniones con IA en su CRM (en preparación)',
  'Propuesta y firma electrónica (en preparación)',
  'Revisión mensual con su equipo'
] where codigo = 'escala';
update planes set incluye = array[
  'Todo lo de Escala, sin límites prácticos',
  'Meta de reuniones calificadas en el contrato',
  'Equipo y gerente de cuenta dedicados',
  'Infraestructura y dominio propios',
  'Integración con su ERP o CRM',
  'Producción semanal de creativos'
] where codigo = 'corporativo';
