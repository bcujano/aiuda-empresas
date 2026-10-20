# n8n · Agente de WhatsApp

- Workflow: **Aiuda Empresas · Agente WhatsApp** (`5RutxNOf3IlhrvEk`), activo. Versión 4.2 (agenda, notas de voz e imágenes con Gemini, «escribiendo…»).
  Archivadas: v3 (`2GNz6M8oB5a06wuH`), v2 (`EOaQbhAVaTex3XDI`) y v1 (`hyleQMHMu34muR8Q`).
  Fuente: `agente-aiuda-empresas.sdk.ts` (SDK de n8n). Se cambia por MCP, nunca reimportando.

## Esquema (el mismo de 321, Laundry y Academy)
1. Meta entrega los mensajes a la bandeja **WhatsApp Cloud** de Chatwoot del cliente
   (en la app de Meta van la URL de webhook y el token que muestra esa bandeja).
2. Chatwoot avisa a n8n con el webhook **de la cuenta** (evento «Mensaje creado»):
   `https://primary-production-ed243.up.railway.app/webhook/aiuda-empresas-chatwoot`.
3. n8n → `POST /api/agente/canal` (el CRM reconoce al cliente por `chatwoot_cuenta_id`)
   → espera 7 s y junta los mensajes seguidos (responde una sola vez, al último)
   → si la conversación no tiene la etiqueta `humano`: `POST /api/agente/contexto`
     (trae el historial guardado en el CRM: esa es la memoria del agente; y el tope de
     40 mensajes por persona al día)
   → agente (Gemini 3.1 Flash-Lite, del plan gratis; respaldo `gpt-4.1-mini`)
   → JSON `{respuesta, datos}` → se publica en Chatwoot como «Agente <Cliente>» (Chatwoot lo
   manda a WhatsApp) → `POST /api/agente/lead`.
4. Si el agente califica al lead: nota privada en Chatwoot con sus datos y el enlace a la
   ficha, y etiqueta `calificado` (el equipo filtra por ella para confirmar la reunión).
5. Si responde una persona del equipo (remitente que no se llama «Agente …»): etiqueta
   `humano` (el agente calla) y el mensaje queda en la actividad del lead.

- Fagal: cuenta de Chatwoot 4, usuario «Agente Fagal» (id 12).
- Credenciales (por nombre, nunca en el repo): `CRM Aiuda Empresas` (x-agente-secreto),
  `Chatwoot Fagal API` (api_access_token de «Agente Fagal»), `Gemini Aiuda`, `OpenAi account`.
- Con este esquema se pierde el `referral` del anuncio: el ángulo sale de la referencia
  del mensaje (`Ref. FAG-TRI`).

## Agenda (v4.1)
- El agente tiene dos herramientas: `ver_horarios` (`POST /api/agente/disponibilidad`) y
  `agendar_cita` (`POST /api/agente/agendar`). Nunca escribe una hora que no salió de la agenda;
  la base impide dos citas cruzadas.
- Workflow **Aiuda Empresas · Avisos y recordatorios de citas** (`dzUSrR0SDPPRqsCW`):
  - Webhook `/webhook/aiuda-empresas-avisos` (cabecera `x-agente-secreto`, credencial
    `CRM Aiuda Empresas`): el CRM avisa `cita_nueva`, `cita_reprogramada_cliente`,
    `cita_confirmada`, `cita_movida_equipo`, `cita_cancelada_equipo`.
  - Al equipo: correo (credencial `Gmail account`) y WhatsApp con la plantilla
    `aviso_cita_equipo` al número `aviso_whatsapp`, con el enlace privado `/cita/<token>`
    para confirmar, mover o cancelar.
  - Al cliente: por Chatwoot si la ventana gratis está abierta; si no, plantilla
    `cita_confirmada_cliente`.
  - Cada 15 min pide `/api/agente/recordatorios` y envía el de 24 h y el de 2 h (Chatwoot o
    plantilla `recordatorio_cita`), y marca cada uno como enviado.
- Plantillas (UTILITY, español) — se crean a mano en WhatsApp Manager (la API las rechazó con
  este token):
  - `aviso_cita_equipo`: «Nueva reunión agendada por el asistente de {{1}}.\nCliente: {{2}}\n
    Empresa: {{3}}\nTema: {{4}}\nFecha: {{5}} ({{6}})\nConfirme o cambie la hora en este
    enlace: {{7}}\nGracias.»
  - `recordatorio_cita`: «Le recordamos su reunión con {{1}}: {{2}} ({{3}}). Si necesita
    cambiarla, responda a este mensaje.»
  - `cita_confirmada_cliente`: «Su reunión con {{1}} quedó confirmada: {{2}} ({{3}}). Si
    necesita cambiarla, responda a este mensaje.»

## Seguimiento automático
- Cada 10 min el mismo workflow de avisos (`dzUSrR0SDPPRqsCW`) pide `POST /api/agente/seguimientos`.
  El CRM ya decide el canal: Chatwoot si la ventana gratis está abierta, plantilla si se cerró
  (o nada: queda «sin ventana»). n8n entrega y avisa `POST /api/agente/seguimiento_resultado`.
- Secuencias por cliente en el CRM (Seguimiento): `sin_respuesta`, `calificado_sin_cita`,
  `no_asistio`. Se cancelan si la persona responde, agenda, es descartada o escribe «baja».
- Plantilla de seguimiento (MARKETING, español) `seguimiento_lead`: «Hola {{1}}, ¿sigue
  interesado en {{2}}? Puedo ofrecerle horarios para una reunión con {{3}}. Si no desea recibir
  más mensajes, responda BAJA.»

## Pendiente
- Credencial de Chatwoot por organización (hoy usa la de Fagal): al sumar el cliente #2.
- Agenda real con Google Calendar (hoy pide horarios y el equipo confirma).
- Notas de voz (hoy pide escribirlo).

## Contacto en frío (workflow de avisos)

Cada 20 minutos pide al CRM `/api/agente/frio` hasta 3 contactos por canal. El CRM decide: solo
lunes a viernes 09:00–17:00 Quito, máximo `campanas_frio.por_dia` por canal, nunca a quien dio la
baja o ya respondió, y el correo solo a quien no tiene WhatsApp o no respondió en `dias_correo`.
WhatsApp sale con la plantilla `<prefijo>contacto_inicial` (2 variables: «equipo de X» y X); el correo
sale por Gmail con el texto de `campanas_frio`. El resultado vuelve a `/api/agente/frio_resultado`.
La campaña nace apagada (`activa = false`). La baja por correo es `/baja/<token>`; la baja por
WhatsApp («BAJA») la detecta `contextoAgente`.

### Cambios del 2026-10-20 (publicados en n8n; el `.sdk.ts` del agente aún no los refleja)

- **Agente:** una conversación asignada a una persona en Chatwoot (asignado ≠ «Agente Fagal», id 12) o con la etiqueta `humano` silencia al agente.
  Si detecta un bot o IA (regla 14 del prompt), no responde, deja nota privada, pone las etiquetas `bot` y `humano`, descarta el lead y da de baja al prospecto.
- **Contacto en frío:** cada 10 min el workflow de avisos pide `/frio_registros` y crea en Chatwoot el contacto y una conversación `pending` con una nota privada (nunca sale al cliente); marca `/frio_registrado`.
- **Correo en frío pausado** hasta tener la credencial de Gmail de Fagal: el nodo «Frío por correo» quedó sin conexión.
