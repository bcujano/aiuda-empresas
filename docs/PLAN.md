# Aiuda Setter · plan maestro (primer cliente: Fagal Abogados)

> Estado: **plan aprobado en lo general, pendiente de 3 decisiones (§9)**. Nada construido todavía.
> Fecha: 2026-10-09. País: Ecuador.

## 1 · El modelo de negocio

Aiuda funciona como **canal de captación para empresas**: anuncia los servicios de sus clientes
desde **sus propias redes y cuenta publicitaria**, atiende con su agente de IA en WhatsApp y
entrega reuniones agendadas. Es un **setter en paralelo**: no compite con el publicista del
cliente, abre un segundo canal.

- **Fagal es el cliente #1.** Todo se construye multi-cliente desde el día uno: sumar el cliente #2
  debe ser cargar datos, no programar.
- **Diferenciador que se vende:** «te llevamos reuniones con empresas, no likes». Se cobra el
  servicio mensual y se demuestra con el CRM (reuniones agendadas, costo por reunión).

### Reglas para convivir con el publicista de Fagal
1. Nunca usamos la página, el píxel ni las audiencias de Fagal.
2. Cada lead del canal Aiuda queda marcado `origen = aiuda` con el anuncio exacto que lo trajo
   (el `referral` de Click-to-WhatsApp). Si el lead dice que vino por las redes de Fagal, se
   anota y no se cuenta como nuestro: así no hay pelea por el crédito.
3. Nuestros anuncios dicen «con Fagal Abogados». Se necesita la autorización escrita de Fagal
   para usar su nombre y logo, y su visto bueno sobre los textos (son abogados: ellos validan
   que no se prometan resultados).

### Riesgo de marca y cómo se resuelve
Para un servicio legal, el anuncio de una agencia da menos confianza que el del estudio. Se
compensa con el posicionamiento: **«Aiuda · Soluciones para empresas»** presenta a
**especialistas verificados** («Asesoría legal para empresas con Fagal Abogados, 15 años…»).
El nombre visible del WhatsApp hoy es «Aiuda Academia de inteligencia artificial»: hay que
cambiarlo a **«Aiuda»** (revisión de Meta) para que sirva a Academy y a Soluciones.

## 2 · El embudo

```
Anuncio Meta (página Aiuda, cuenta publicitaria Aiuda)
  ├─ A) Click-to-WhatsApp ──────────────┐   principal: 72 h gratis por entrada desde anuncio
  └─ B) Landing en Vercel ─ botón WA ───┤   respaldo de confianza + retargeting
              └─ botón Agendar ─────────┤   (WA con mensaje listo y código FAG-<ángulo>)
                                        ▼
        +593 98 566 3057 → Chatwoot bandeja 4 → n8n router
              ¿lead de un cliente setter? (referral del anuncio, código FAG-, o teléfono ya asignado)
                 sí → Agente Setter (contexto del cliente: Fagal)
                 no → Agente Academy (como hoy, sin cambios)
                                        ▼
        Agente Setter: responde dudas básicas · califica · propone horarios · agenda
                                        ▼
        CRM (Vercel + Supabase): lead, empresa, calificación, cita, conversación
        Aviso a Fagal (correo + resumen) · Evento «Agendó» a Meta por Conversions API
                                        ▼
        Seguimiento solo dentro de la ventana gratis (72 h anuncio / 24 h landing).
        Nunca escribimos primero. Fuera de ventana: no sale nada (costo cero).
```

## 3 · Prueba de nichos (sin histórico)

No sabemos qué segmento rinde más: lo descubren los anuncios. Con $2,5/día no se reparte:
**una campaña, un conjunto, 3 anuncios = 3 ángulos**, y el CRM mide cada uno por su `ad_id`.

| Ángulo | Dolor de la empresa en Ecuador | Gancho |
|---|---|---|
| Laboral | Despidos, actas de finiquito, inspecciones del Ministerio del Trabajo, IESS | «¿Un trabajador te puede demandar mañana?» |
| Cobranza | Cartera vencida, clientes que no pagan, letras y pagarés | «Recupera lo que te deben sin pelear tú» |
| Protección de datos (LOPDP) | Obligaciones vigentes, sanciones, bases de clientes sin consentimiento | «¿Tu empresa cumple la LOPDP?» |

Reemplazos si alguno no rinde: tributario (SRI, glosas), societario (Superintendencia de
Compañías), contratos. **Los ángulos finales salen del cuestionario a Fagal (§8)**: solo se
anuncia lo que Fagal realmente hace y cobra bien.

**Métrica de decisión** (cada 7 días, en el CRM, nunca a ojo):
costo por conversación → % calificadas → **costo por reunión agendada**. Gana el ángulo con
menor costo por reunión; el peor se reemplaza por uno nuevo. A las 3–4 semanas se nicha.

Expectativa honesta con ~$75/mes: 40–100 conversaciones, 3–8 reuniones. Se valida en 2 semanas.

## 4 · El CRM (Aiuda Setter)

Next.js 16 + Supabase en Vercel, **con la arquitectura de laundry-vip** (la más limpia de los
repos: capas `app → server → supabase`, Zod, Biome, Vitest, archivos ≤ 300 líneas,
migraciones nunca editadas, secretos fuera del repo, permisos los decide el servidor).

Multi-cliente:

| Tabla | Para qué |
|---|---|
| `marcas` | Cada cliente setter (Fagal). Nombre, servicios, horarios de reunión, calendario, correo de aviso, prompt de conocimiento, código (`FAG`) |
| `angulos` | Ángulo/servicio por marca, enlazado a los `ad_id` de Meta |
| `leads` | Persona + empresa (nombre, RUC, cargo, tamaño), marca, ángulo, origen, referral, etapa |
| `calificaciones` | Respuestas del agente: necesidad, urgencia, tamaño, encaje 0–100 |
| `citas` | Reunión agendada con la marca (evento de Google Calendar) |
| `mensajes` / `actividad` | Registro de la conversación (la bandeja viva es Chatwoot) |
| `uso_ia` | Costo de IA por mensaje y tope mensual |

Pantallas: **Pipeline** (Nuevo → Calificado → Agendado → Asistió → Cliente / Descartado),
**Lead**, **Citas**, **Ángulos** (costo por reunión por anuncio) y **Marcas**.
Vista para Fagal: un acceso de solo lectura a sus leads y citas (para el reporte mensual).

Las landings viven en la misma app: `/<marca>` (ej. `/fagal`) y `/<marca>/<angulo>`.
Sin subdominio: dominio de Vercel.

## 5 · El agente

- **n8n en Railway** (el que ya existe). Workflow nuevo «Aiuda Setter · Agente»; el router
  `AQnDCBqaYJDmzOuK` solo gana una regla nueva, Academy no se toca.
- **Modelo:** Gemini (capa gratis) principal + OpenAI `gpt-4.1-mini` de respaldo
  (nodo AI Agent con modelo de reserva).
- El cerebro vive en el CRM, como Academy: `/api/setter/agente` da el contexto de la marca
  (servicios, preguntas de calificación, horarios). Nada del negocio escrito en el prompt.
- Herramientas: `contexto_marca`, `registrar_lead`, `calificar_lead`, `horarios_disponibles`
  (free/busy del Google Calendar de Fagal), `agendar_reunion`, `escalar_a_persona`.
- Reglas: se presenta como «asistente de Aiuda para Fagal Abogados»; **no da asesoría legal**,
  no opina sobre casos, no promete resultados ni cotiza honorarios; si le preguntan si es
  persona, dice que es un asistente virtual; la etiqueta `humano` en Chatwoot lo calla
  (igual que en laundry-vip).
- Audio (notas de voz): transcripción con el mismo esquema de Academy.

## 6 · Costos

| Pieza | Costo |
|---|---|
| Vercel (CRM + landings) | $0 (Hobby) |
| Supabase | $0 (plan gratis; ver §9.3) |
| n8n + Chatwoot en Railway | ya pagados |
| WhatsApp | $0 dentro de la ventana; no se usan plantillas |
| Gemini | $0 capa gratis; OpenAI de respaldo ≈ $0–2/mes |
| Google Calendar de Fagal | $0 |
| **Pauta** | **$60–90/mes** |

## 7 · Fases

1. **Base:** repo multi-cliente (Next + Supabase), migraciones, landing `/fagal` con los 3
   ángulos, píxel + Conversions API, pantalla de pipeline.
2. **Agente:** `/api/setter/*`, workflow n8n, regla en el router, calendario de Fagal.
   Prueba de humo completa con un número de prueba.
3. **Lanzamiento:** campaña Click-to-WhatsApp, 3 anuncios, $2,5/día.
4. **Optimización semanal:** reporte de costo por reunión por ángulo; cambiar el peor.

## 8 · Lo que se le pide a Fagal (cuestionario corto)

1. Servicios para empresas, del más rentable al menos rentable, y honorario típico de cada uno.
2. Qué casos **no** toman.
3. Quién atiende las reuniones, duración, horarios, presencial (dirección) o virtual.
4. Acceso a su Google Calendar (compartir con la cuenta de servicio, permiso «hacer cambios»).
5. Correo y WhatsApp para avisos de citas nuevas.
6. Logo, fotos del equipo, años de experiencia, casos o clientes que se puedan mencionar.
7. Autorización escrita para usar su nombre en nuestros anuncios.

## 9 · Decisiones pendientes de Byron

1. **El número +593 98 566 3057 es hoy el de Academy en producción.** Usarlo como setter obliga
   a: (a) una regla nueva en el router de producción (se hace con respaldo y versión para
   volver atrás) y (b) cambiar el nombre visible a «Aiuda». Los leads de Fagal y Academy van a
   la misma bandeja 4 de Chatwoot (se separan con etiquetas).
2. **Gemini capa gratis y datos sensibles:** en la capa gratis Google puede usar los mensajes
   para mejorar sus productos. Son consultas de empresas a un estudio jurídico. Recomendación:
   el agente solo pide datos de calificación (empresa, cargo, tipo de problema, urgencia) y
   **nunca pide detalles del caso**. Si Fagal exige más privacidad, se usa Gemini de pago
   (centavos al mes).
3. **Supabase:** el plan gratis permite 2 proyectos activos por cuenta, y ya hay al menos 3
   (crm-321, Emprendimientum, laundry-vip). Hay que ver qué cuenta u organización aloja el
   proyecto nuevo.
