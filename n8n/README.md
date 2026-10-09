# n8n · Agente de WhatsApp

- Workflow: **Aiuda Empresas · Agente WhatsApp** (`hyleQMHMu34muR8Q`), activo.
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

## Pendiente
- Credencial de WhatsApp por organización (hoy el envío usa la de Fagal): al sumar el cliente #2,
  el token va por organización.
- Agenda real con Google Calendar (hoy pide horarios y el equipo confirma).
- Aviso a Fagal cuando un lead queda calificado.
- Notas de voz (hoy pide escribirlo).
- Copia de la conversación en Chatwoot.
