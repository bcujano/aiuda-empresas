# n8n · Agente de WhatsApp

- Workflow: **Aiuda Empresas · Agente WhatsApp** (`EOaQbhAVaTex3XDI`), activo. Versión 2 con Chatwoot; la v1 (`hyleQMHMu34muR8Q`) quedó archivada.
  Fuente: `agente-aiuda-empresas.sdk.ts` (SDK de n8n). Se cambia por MCP, nunca reimportando.
- Webhook para Meta (callback): `https://primary-production-ed243.up.railway.app/webhook/aiuda-empresas-whatsapp`
  · token de verificación: `aiuda-empresas-2026` · campo suscrito: `messages`.
- Flujo: mensaje → normalizar → `POST /api/agente/contexto` (organización por `phone_number_id`)
  → agente (Gemini 2.5 Flash; respaldo `gpt-4.1-mini`; memoria de 20 mensajes por número)
  → JSON `{respuesta, datos}` → en paralelo: enviar por WhatsApp y `POST /api/agente/lead`.
- Credenciales (por nombre, nunca en el repo): `CRM Aiuda Empresas` (x-agente-secreto),
  `Meta WhatsApp Fagal` (Bearer), `Gemini Aiuda`, `OpenAi account`.
- Probado 2026-10-10: verificación GET 200 con token correcto, 403 con token malo; avisos de
  estado (sin `messages`) no responden nada.

## Chatwoot (v2)
- Cada cliente tiene su cuenta de Chatwoot y una bandeja de tipo **API** (Fagal: cuenta 4, bandeja 6),
  guardadas en `organizaciones.chatwoot_cuenta_id` / `chatwoot_bandeja_id`.
- Mensaje del cliente → se publica como entrante en su conversación (se crea una sola vez y
  queda en `leads.chatwoot_conversacion_id`) → si la conversación tiene la etiqueta `humano`,
  el agente no responde.
- La respuesta del agente se publica como saliente en Chatwoot; Chatwoot la manda al webhook
  de la bandeja (`/webhook/aiuda-empresas-chatwoot`) y n8n la envía por WhatsApp. Las
  respuestas manuales siguen el mismo camino: si el remitente no se llama «Agente …», se pone
  la etiqueta `humano` y el mensaje queda en la actividad del lead.
- Convención: el usuario del agente en cada cuenta de Chatwoot se llama «Agente <Cliente>».
- Credencial `Chatwoot Fagal API` (api_access_token del usuario «Agente Fagal», id 12).

## Pendiente
- Credencial de WhatsApp por organización (hoy el envío usa la de Fagal): al sumar el cliente #2,
  el token va por organización.
- Agenda real con Google Calendar (hoy pide horarios y el equipo confirma).
- Aviso a Fagal cuando un lead queda calificado.
- Notas de voz (hoy pide escribirlo).
