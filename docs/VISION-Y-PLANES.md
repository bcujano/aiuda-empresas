# Aiuda Empresas · Qué vendemos, de dónde partimos y hacia dónde vamos

## En una frase

**Aiuda Empresas es un equipo comercial con IA que se le alquila a empresas B2B: pone los
anuncios, atiende y califica por WhatsApp, agenda las reuniones y entrega todo medido en un
CRM propio del cliente.** El cliente solo se sienta a cerrar.

No vendemos «un CRM» ni «un chatbot». Vendemos **reuniones con empresas que pueden pagar**, y
el sistema es la prueba de que salen de un proceso medible.

## De dónde partimos (octubre 2026)

| Pieza | Estado |
|---|---|
| Plataforma multicliente (organizaciones, roles, planes, aislamiento por cliente) | En línea |
| Landings por servicio con píxel y botón a WhatsApp con código | En línea (5 de Fagal) |
| Agente de WhatsApp (Gemini gratis + respaldo OpenAI), memoria en el CRM | En línea |
| Agenda propia con horas libres, reserva del agente, enlace de confirmación, recordatorios | En línea (agenda tipo Google Calendar) |
| Avisos al equipo del cliente por correo y WhatsApp (plantillas) | En línea; plantillas en aprobación |
| Wizard de configuración del cliente | En línea |
| Primer cliente: Fagal Abogados, plan Básico $200 + IVA | Por lanzar pauta |

## Cómo se ve el servicio completo

1. **Atraer:** anuncios en Meta por ángulo (servicio + dolor + sector), creados y medidos desde
   la plataforma.
2. **Convertir:** el agente responde en segundos, 24/7, filtra a quien no sirve y agenda con
   la agenda real del cliente.
3. **Cerrar:** el cliente recibe la reunión confirmada con el resumen del lead; recordatorios
   automáticos bajan el ausentismo.
4. **Medir:** costo por lead calificado y por reunión, por ángulo y por anuncio. Lo que no
   rinde se apaga.
5. **Crecer (planes altos):** buscar oportunidades que el cliente no ve: licitaciones públicas,
   empresas que están contratando, listas de prospectos, llamadas de voz con IA.

## Planes

| | **Básico** $200 + IVA | **Crecimiento** $1.200 | **Escala** $2.500 | **Corporativo** $10.000 |
|---|---|---|---|---|
| Promesa | Leads de empresas por WhatsApp | Sistema de entrada completo + primer outbound | Inteligencia de pipeline | Equipo comercial tercerizado con meta |
| Pauta en Meta (la inversión la paga el cliente) | 1 campaña, hasta 5 ángulos | Ángulos ilimitados, creativos con IA cada mes | + pruebas A/B continuas | + producción semanal de video |
| Agente de WhatsApp + agenda | Sí | Sí + seguimiento con plantillas | Sí | Sí, con voz propia |
| Usuarios del CRM | 1 | 3 | 10 | Sin límite |
| Prospección (listas de empresas por sector/ciudad con datos públicos) | — | 500/mes | 2.000/mes | ABM sobre 200 cuentas |
| Outbound por correo (cumpliendo LOPDP) | — | 1 secuencia | 10 buzones | Dedicado |
| **Alertas de licitaciones SERCOP** a la medida | — | — | Sí + informe trimestral de competidores | Sí |
| Señales de compra (empresas contratando, cambios en webs de competidores) | — | Webs de competidores | + empleos | Todo |
| Agente de voz que devuelve la llamada en 60 s | — | — | ~500 min | ~3.000 min |
| Notas de reuniones con IA (Meet/Teams → resumen al CRM) | — | — | Sí | Sí |
| Propuesta → firma electrónica | — | — | Sí | Sí |
| Tablero ejecutivo (costo por reunión y por venta) | Reporte mensual | En vivo | Ejecutivo | Atribución hasta ingresos |
| Meta de reuniones en contrato | — | — | — | 20–40 calificadas/mes |

**Por qué los saltos se justifican:** el Básico reemplaza a una recepcionista a medio tiempo;
Crecimiento cuesta menos que un vendedor junior en Quito (≈ $800–1.000 + beneficios) y trabaja
dos canales; Escala encuentra oportunidades que el cliente no ve (licitaciones, señales);
Corporativo cuesta menos que 2 vendedores + 1 marketero + herramientas y viene con meta.

## Módulos de alto valor (código abierto, autoalojado)

Orden recomendado por valor/costo:

1. **Licitaciones SERCOP** — datos abiertos oficiales (estándar OCDS, ≈2,6 millones de procesos,
   licencia CC BY). Alerta diaria por código de producto, palabra clave y provincia.
   Casi ningún CRM comercial lo tiene. Costo: solo n8n + base.
2. **Prospección con datos públicos** — catastro RUC del SRI y directorio de la
   Superintendencia de Compañías + `gosom/google-maps-scraper` (MIT) + `crawl4ai` (Apache) para
   enriquecer desde la web de cada empresa + verificación de correos (`reacher`, MIT).
3. **Calidad de conversaciones** — `langfuse` (MIT): cada conversación del agente con costo y
   calidad; informe para planes altos.
4. **Agente de voz** — `pipecat` (BSD) o `livekit/agents` (Apache), solo para devolver llamadas.
5. **Notas de reuniones** — `Vexa` (Apache) + Whisper o el audio de Gemini.
6. **Firma de propuestas** — `DocuSeal` (AGPL, sin modificar).
7. **Tableros ejecutivos** — `Apache Superset` (Apache) embebido por cliente.
8. **Señales** — `changedetection.io` (Apache) para webs de competidores; `JobSpy` (MIT) para
   empleos publicados.
9. **Contenido** — `Postiz` (AGPL, sin modificar) para publicar en redes.

Límites honestos: la API de la Biblioteca de Anuncios de Meta **no** entrega anuncios
comerciales de Ecuador (solo UE/política), así que el monitoreo de anuncios de competidores
es un informe curado, no un feed automático. La identificación de visitantes web no funciona
bien en Ecuador; no se promete. LOPDP: outbound solo a datos profesionales, con la fuente
dicha en el primer mensaje, baja en cada mensaje y lista de supresión; WhatsApp sigue siendo
solo de entrada.

## Hoja de ruta

| # | Bloque | Qué incluye |
|---|---|---|
| 1 | Agente completo | Mismo flujo previo al agente que 321: notas de voz (transcripción), imágenes (descripción), «escribiendo…», mensajes juntos, toma humana |
| 2 | Seguimiento con plantillas | Modelo Academy: secuencias por etapa, libre dentro de 24 h, plantilla aprobada fuera de 24 h, cancelación al avanzar |
| 3 | Marketing · Medir | Conexión Meta por cliente, sincronización diaria, Resultados por ángulo y anuncio, eventos «Lead calificado» y «Agendó» por API de Conversiones |
| 4 | Marketing · Administrar y crear | Pausar/activar/presupuesto; crear campañas desde la plataforma con creativos desde Google Drive |
| 5 | Copiloto IA | Chat dentro del CRM con herramientas: interpreta resultados, arma la campaña de un cliente desde cero, propone y ejecuta con aprobación |
| 6 | Todos los controles multicliente | Usuarios por cliente, editar/borrar en todo, exportar a Excel, planes y facturación, suspensión |
| 7 | Landing de Aiuda Empresas | La página que vende el servicio, con los planes |
| 8 | Módulos de planes altos | SERCOP → prospección → voz → notas → firma → tableros |
