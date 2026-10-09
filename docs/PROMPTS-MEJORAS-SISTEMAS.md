# Prompts de mejora · un sistema, una sesión

Fecha: 2026-10-09. Salen de la comparación de los tres sistemas (CRM 321, Laundry VIP y
Aiuda Empresas). Cada prompt se pega **tal cual** en la sesión de Claude que administra ese
sistema.

**Regla común a los tres:** cada cliente tiene su sistema a medida. Ningún sistema adopta
módulos, pantallas, herramientas, tablas, credenciales ni información de otro. Lo único que
se comparte son **métodos** de ingeniería (cómo hacer algo más robusto o más barato), y cada
sesión los implementa a su manera, con su propio código y sus propias convenciones.

---

## 1. CRM 321 Soluciones Inmobiliarias (repo `bcujano/crm-321`)

```text
Contexto: soy Byron. Hice una auditoría comparativa de mis sistemas y quiero que este CRM
(321 Soluciones Inmobiliarias) sea más eficiente y más robusto SIN que el usuario note
cambios. Lee primero CLAUDE.md, docs/HANDOFF.md y docs/12-pendientes.md y respeta todas sus
reglas (SQL que pego yo en Supabase, despliegue con npx vercel --prod, etiqueta de git antes
y después de cada bloque, reglas A–J, Disk IO limitado).

REGLAS DE ESTE TRABAJO (no negociables):
1. Cero cambios visibles: mismas pantallas, mismos textos, mismos flujos, mismos menús. Todo
   es backend, n8n, base de datos, seguridad y calidad de código.
2. No traer módulos, herramientas, tablas ni ideas de producto de otros sistemas míos. Solo
   métodos de ingeniería aplicados al código que ya existe aquí.
3. Antes de tocar un workflow de n8n en producción (iAgente 321 INMO V2 kdtUTHuszghCNPQ1,
   Router AQnDCBqaYJDmzOuK, meta-referral Mduk8hFNjpJXx5H1, Seguimiento, Post Pro) anota su
   versionId para poder volver atrás, cambia lo mínimo y prueba con datos reales.
4. Nada de reescrituras grandes. Cada mejora en un bloque chico, probado y desplegado.
5. Al final de cada bloque actualiza docs/HANDOFF.md y docs/12-pendientes.md.

HALLAZGOS DE LA AUDITORÍA (verifícalos tú; si alguno no es cierto, dilo y sigue):
- El agente principal (gpt-4.1-mini) no tiene modelo de respaldo, ni reintentos en los nodos
  de IA ni en los HTTP críticos, ni workflow de errores. Si OpenAI falla, el cliente queda
  sin respuesta y nadie se entera.
- Hay secretos en texto plano (tokens, app secret de Meta, clave de OpenAI) dentro de
  workflows viejos de n8n (5CujrBJuBkWOIXzx, jFCAj3fL3hYvblC7) y webhooks sin autenticación
  (/mensaje-manual-321 y chatwoot-router). 8 rutas de la API no verifican sesión (Academy
  públicas y webhooks de Twilio/Retell; Retell sí verifica firma).
- Post Pro y Seguimiento V6 corren cada 2 minutos (~720 veces al día cada uno) y golpean el
  CRM y la base; con el plan gratis de Supabase y su Disk IO limitado (ya se cayó el 27-sep)
  es el mayor riesgo de caída.
- La memoria del agente y meta_referrals viven en otro proyecto de Supabase
  (Emprendimientum). No lo migres; solo documenta la dependencia y vigila que no se rompa.
- /api/supervisor/mensaje llama a OpenAI en cada turno del agente.
- 0 pruebas automáticas, sin linter, ~1 000 usos de `any`, archivos de hasta 3 000 líneas.

TRABAJO, EN ESTE ORDEN:
A. Seguridad (primero):
   1. Mover los secretos de los workflows viejos a credenciales de n8n, o archivar esos
      workflows si ya no se usan (pregúntame solo si no puedes determinar si se usan).
      Hacer una lista de qué claves debo rotar yo y dónde.
   2. Poner autenticación (cabecera secreta comparada en tiempo constante) a los webhooks
      /mensaje-manual-321 y chatwoot-router, sin cambiar lo que hacen.
   3. Revisar las 8 rutas sin sesión: confirmar que cada una es pública a propósito y que
      valida su entrada (zod) y su origen (firma o secreto) cuando corresponde.
B. Resiliencia del agente:
   1. Modelo de respaldo en el agente (needsFallback del nodo AI Agent con un segundo modelo
      de la credencial que elijas; dime cuál propones y por qué).
   2. retryOnFail (2–3 intentos, 1–2 s) en los nodos de IA y en los HTTP que llaman al CRM.
   3. Un workflow de errores (Error Trigger) que me avise por el canal que ya uso para
      avisos internos, y asignarlo a los workflows de producción.
   4. Si el agente aún no junta mensajes seguidos ni descarta mensajes duplicados (el mismo
      id de mensaje procesado dos veces), agrégalo con el mecanismo que mejor encaje aquí.
C. Disco y costo:
   1. Bajar la frecuencia de Post Pro y Seguimiento o pasarlos a eventos/colas, y hacer que
      cada corrida salga temprano si no hay trabajo (consulta barata primero). Escrituras en
      lote, nunca fila por fila (regla H).
   2. Revisar si /api/supervisor/mensaje puede usar un modelo más barato, saltarse mensajes
      triviales o cachear; medir antes y después con uso real.
D. Calidad sin tocar la pantalla:
   1. Agregar un linter (Biome u otro) en modo que no reformatee todo el repo de golpe:
      solo reglas de errores reales, y que corra en los archivos que se toquen.
   2. Pruebas unitarias para la lógica que más duele si se rompe: lib/clasificacion.ts,
      lib/fuente-dato.ts, la autorización (auth-helpers) y el webhook que crea leads.
   3. Reducir `any` y partir archivos gigantes SOLO en los archivos que toques por otra
      razón (regla del boy scout); nada de refactor masivo.
E. Entregable: un resumen en docs/HANDOFF.md con qué cambió, cómo probarlo, cómo volver
   atrás (versionIds y etiquetas de git) y qué claves debo rotar.

Avanza sin pararme; pregúntame solo lo que bloquee. Recomendaciones, no menús.
```

---

## 2. Laundry VIP (repo `bcujano/laundry-vip`)

```text
Contexto: soy Byron. Hice una auditoría comparativa de mis sistemas. Laundry VIP queda
EXACTAMENTE como está hoy para el usuario: misma apariencia, mismas pantallas, mismos
textos, mismo uso, mismo comportamiento del agente frente al cliente. Todo lo que hagas es
backend, n8n, pruebas, seguridad y operación. Lee primero CLAUDE.md, docs/CONTINUIDAD.md,
docs/AGENTE.md y docs/DECISIONES.md, y respeta todas sus reglas (incluidas: src/app nunca
importa el cliente admin, 300 líneas por archivo, sin ORM, sin librería de fechas, gates
antes de subir, el workflow se cambia por el generador del repo y se sincroniza).

REGLAS DE ESTE TRABAJO (no negociables):
1. El usuario no debe notar ningún cambio. Si una mejora cambiaría algo visible o lo que el
   agente le dice al cliente, no la hagas: anótala como propuesta.
2. No traer módulos, herramientas, tablas ni ideas de producto de otros sistemas míos. Solo
   métodos de ingeniería aplicados al código que ya existe aquí.
3. Antes de tocar el workflow en producción (Bleb55WBKPfBdxVg) anota su versionId, genera
   el cambio con n8n/generador, valida que repo y n8n en vivo queden idénticos y prueba con
   un mensaje real.
4. Cada bloque chico, con sus pruebas y los gates en verde.

HALLAZGOS DE LA AUDITORÍA (verifícalos; si alguno no es cierto, dilo y sigue):
- Las pruebas de integración y el CI corren contra la base de PRODUCCIÓN. Es el riesgo #1.
- El agente usa solo gpt-4.1-mini: no hay modelo de respaldo y ningún nodo tiene
  retryOnFail. No hay workflow de errores.
- El repo dice 104 nodos y n8n en vivo tiene 105: hay deriva entre el generador y producción.
  Además el MCP de n8n borra los onError al crear nodos (ya pasó con 27 nodos).
- La clave de OpenAI, n8n y Chatwoot se comparten con otro negocio (no se ve qué gasta cada
  uno). Hay un bundle viejo de git en la PC con una credencial (pendiente E5).
- RLS activo sin políticas: correcto como respaldo, pero si se filtra la service key se
  expone todo.
- No hay pruebas del comportamiento del agente (prompts).

TRABAJO, EN ESTE ORDEN:
A. Separar pruebas de producción:
   1. Una base de pruebas aparte (rama de Supabase, proyecto de pruebas o Postgres local en
      CI; propón la opción más barata que funcione) y que las pruebas de integración y el CI
      nunca toquen producción. Una guarda que haga fallar las pruebas si la URL apunta a
      producción.
B. Resiliencia del agente (sin cambiar lo que dice):
   1. Modelo de respaldo en los dos agentes (needsFallback) con la misma configuración y el
      mismo prompt; dime qué modelo propones y por qué.
   2. retryOnFail (2–3 intentos) en los nodos de IA, transcripción, visión y en los HTTP a
      /api/webhook.
   3. Workflow de errores (Error Trigger) que me avise, asignado a los workflows de
      producción.
   4. Una prueba en el repo que falle si un nodo crítico pierde su onError o su retry, y un
      script/prueba que compare el workflow del generador con el de n8n en vivo y falle si
      hay deriva.
C. Seguridad y costos:
   1. Lista de claves a rotar (incluida la del bundle E5) y pasos exactos para mí.
   2. Proponer una clave de OpenAI propia de Laundry para ver su gasto separado (yo la creo;
      tú solo cambias la credencial en n8n cuando te diga).
D. Pruebas del agente:
   1. Un set pequeño de conversaciones de ejemplo (casos reales anonimizados: cotizar, fuera
      de cobertura, pedido, consulta de estado, operador) que se corra a pedido contra el
      agente y verifique reglas duras (no inventa precios, no promete fuera de cobertura,
      respeta la ventana de 24 h). Que no corra en cada CI para no gastar.
E. Entregable: docs/CONTINUIDAD.md actualizado con qué cambió, cómo probarlo, cómo volver
   atrás y qué me toca hacer a mí.

Avanza sin pararme; pregúntame solo lo que bloquee. Recomendaciones, no menús.
```

---

## 3. Aiuda Empresas · multicliente (repo `bcujano/aiuda-empresas`, primer cliente Fagal)

```text
Contexto: soy Byron. Este es el sistema multicliente de Aiuda (anuncios → agente de WhatsApp
→ reunión, con CRM por cliente). Primer cliente: Fagal Abogados. Lee primero CLAUDE.md,
docs/PLAN.md, docs/PUESTA-EN-MARCHA.md y n8n/README.md y respeta sus reglas (un cliente =
datos nunca código, aislamiento por organizacion_id, permisos rol × plan en el servidor,
migraciones nunca se editan, gates, 300 líneas, nunca escribimos primero por WhatsApp, el
agente no asesora ni pide detalles del caso, ningún secreto en el repo).

REGLAS DE ESTE TRABAJO:
1. No traer módulos, herramientas, tablas ni información de otros sistemas míos (CRM 321,
   Laundry VIP). Solo métodos de ingeniería.
2. Lo que se ve en el CRM y en las landings de un cliente solo cambia si yo lo pido.
3. Todo cambio del workflow de n8n se hace en n8n/agente-aiuda-empresas.sdk.ts y se publica
   por MCP; anota el id y la versión nueva en n8n/README.md.

ESTADO (2026-10-09): ya hecho
- Meta → bandeja WhatsApp Cloud de Chatwoot (cuenta 4) → webhook de la cuenta → n8n.
- Workflow v4 (5RutxNOf3IlhrvEk): junta mensajes seguidos (7 s), memoria desde el CRM
  (historial de actividad), tope de 40 mensajes por persona al día, Gemini 3.1 Flash-Lite
  gratis con respaldo gpt-4.1-mini, etiqueta `humano` cuando responde una persona, nota
  privada + etiqueta `calificado` cuando el agente califica un lead.

PENDIENTE, EN ESTE ORDEN:
A. Resiliencia: retryOnFail en los HTTP al CRM y a Chatwoot; workflow de errores que me
   avise; descartar el mismo id de mensaje procesado dos veces (por si Chatwoot reenvía).
B. Agenda real: Google Calendar del cliente (credencial por organización), el agente ofrece
   horarios libres y crea la cita en `citas`; recordatorio dentro de la ventana gratis.
C. Seguimiento: un mensaje de seguimiento solo dentro de la ventana gratis (72 h anuncio,
   24 h otro) si el lead quedó a medias; nunca fuera de la ventana.
D. Medición: evento de Conversions API «Lead calificado» / «Agendó» hacia el píxel del
   cliente; reporte por ángulo (costo por lead calificado).
E. Multicliente de verdad: credencial de Chatwoot por organización (hoy la de Fagal está
   fija en el workflow), wizard de conocimiento, gestión de usuarios admin/operador,
   exportar a Excel, vencimiento del plan de prueba.
F. Pruebas: unitarias de las reglas del agente y un set pequeño de conversaciones de
   ejemplo que verifique las reglas duras (no asesora, no promete, no pide detalles del
   caso, descarta particulares).

Avanza sin pararme; pregúntame solo lo que bloquee. Recomendaciones, no menús.
```
