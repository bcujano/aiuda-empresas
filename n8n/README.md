# n8n · Agente de WhatsApp

- Workflow: **Aiuda Empresas · Agente WhatsApp** (`2GNz6M8oB5a06wuH`), activo. Versión 3.
  Archivadas: v2 (`EOaQbhAVaTex3XDI`) y v1 (`hyleQMHMu34muR8Q`).
  Fuente: `agente-aiuda-empresas.sdk.ts` (SDK de n8n). Se cambia por MCP, nunca reimportando.

## Esquema (el mismo de 321, Laundry y Academy)
1. Meta entrega los mensajes a la bandeja **WhatsApp Cloud** de Chatwoot del cliente
   (en la app de Meta van la URL de webhook y el token que muestra esa bandeja).
2. Chatwoot avisa a n8n con el webhook **de la cuenta** (evento «Mensaje creado»):
   `https://primary-production-ed243.up.railway.app/webhook/aiuda-empresas-chatwoot`.
3. n8n → `POST /api/agente/canal` (el CRM reconoce al cliente por `chatwoot_cuenta_id`)
   → si la conversación no tiene la etiqueta `humano`: `POST /api/agente/contexto`
   → agente (Gemini 3.1 Flash-Lite, del plan gratis; respaldo `gpt-4.1-mini`; memoria de 20 mensajes por número)
   → JSON `{respuesta, datos}` → se publica en Chatwoot como «Agente <Cliente>» (Chatwoot lo
   manda a WhatsApp) → `POST /api/agente/lead`.
4. Si responde una persona del equipo (remitente que no se llama «Agente …»): etiqueta
   `humano` (el agente calla) y el mensaje queda en la actividad del lead.

- Fagal: cuenta de Chatwoot 4, usuario «Agente Fagal» (id 12).
- Credenciales (por nombre, nunca en el repo): `CRM Aiuda Empresas` (x-agente-secreto),
  `Chatwoot Fagal API` (api_access_token de «Agente Fagal»), `Gemini Aiuda`, `OpenAi account`.
- Con este esquema se pierde el `referral` del anuncio: el ángulo sale de la referencia
  del mensaje (`Ref. FAG-TRI`).

## Pendiente
- Credencial de Chatwoot por organización (hoy usa la de Fagal): al sumar el cliente #2.
- Agenda real con Google Calendar (hoy pide horarios y el equipo confirma).
- Aviso a Fagal cuando un lead queda calificado.
- Notas de voz (hoy pide escribirlo).
