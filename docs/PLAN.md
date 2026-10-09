# Aiuda Setter · plan maestro

> Plataforma multi-cliente de Aiuda: anuncios + agente de IA en WhatsApp + CRM.
> Primer cliente: **Fagal Abogados** (Ecuador). Actualizado: 2026-10-09.

## 0 · Arquitectura: una plataforma, muchos clientes

**Un repo, una app en Vercel, una base de Supabase, un agente en n8n.** Cada cliente es una
**organización** (una fila en la base), no un repo ni un despliegue nuevo.

```
                       aiuda-setter (un repo, una app en Vercel)
                                     │
        ┌────────────────────────────┼────────────────────────────┐
   Organización Fagal          Organización B              Organización C
   /fagal (landing)            /cliente-b                  /cliente-c
   su número WhatsApp          su número                   su número
   su bandeja Chatwoot         su bandeja                  su bandeja
   sus usuarios (admin,        sus usuarios                sus usuarios
   operadores)
   sus leads y citas           sus leads y citas           sus leads y citas
        └────────────── Byron (superadmin) ve y cambia todo ───────┘
```

- **Cliente nuevo = alta en el panel de superadmin** (nombre, código, logo, colores) + su número
  de WhatsApp + su bandeja de Chatwoot + el **wizard de conocimiento** que llena su admin.
  Sin tocar código, sin repo nuevo, sin despliegue nuevo.
- **Aislamiento:** toda tabla lleva `organizacion_id`. El servidor filtra siempre por la
  organización del usuario; RLS niega por defecto como respaldo (patrón de laundry-vip). Un
  usuario de Fagal nunca ve nada de otra organización.
- **Un solo agente para todos:** n8n identifica la organización por el número que recibió el
  mensaje (`phone_number_id`) y pide al CRM el contexto de esa organización.
- **Módulos por organización:** lo común (leads, pipeline, citas, conversaciones, reportes) lo
  tienen todos; lo específico de un rubro (p. ej. pedidos de una lavandería) se enciende por
  organización.
- **Cliente que exige su propio servidor** (caso raro, grande): el mismo repo se despliega
  aparte con otras variables. Mismo código.

### Roles
| Rol | Quién | Qué puede |
|---|---|---|
| `superadmin` | Byron / Aiuda | Todas las organizaciones: alta, planes, módulos, agente, costos, cambiar de organización |
| `admin` | Dueño del cliente (Fagal) | Su organización: usuarios, wizard de conocimiento, reportes, exportar (según plan) |
| `operador` | Personal del cliente | Pipeline, leads, citas y conversaciones de su organización |

### Laundry VIP
Hoy es un sistema aparte, **en producción con clientes reales** y con lógica de lavandería
(pedidos, catálogo, planta). **No se migra ahora.** Fase posterior: entra a la plataforma como
organización con el módulo «Pedidos» cuando la plataforma esté probada con Fagal. Mientras
tanto, el panel de superadmin puede mostrar sus números (lectura).

### Planes y prueba gratis (lo cumple el servidor, no la pantalla)
| Estado | Cuándo | Qué tiene |
|---|---|---|
| `prueba` | 3 meses del contrato | Todo |
| `activo` | Paga el CRM | Todo |
| `restringido` | No renovó el CRM pero sigue con el servicio | Ve sus leads y citas; sin reportes, sin exportar, sin usuarios extra, conversaciones de los últimos 30 días |
| `suspendido` | Terminó todo | Sin acceso; se le entrega su Excel (leads, empresas, citas) |

Recomendación: el Excel de salida va **en el contrato** (los datos de sus clientes son suyos
por la LOPDP; Aiuda es encargado del tratamiento). Lo que se retiene es la **herramienta**, no
los datos. La fecha de fin de prueba se ve en el CRM desde el día 1, con aviso a 30 y 7 días.

### Repos
- Este repo se renombra a **`aiuda-setter`** (GitHub mantiene la dirección vieja como
  redirección). Lo propio de Fagal (textos de anuncios, investigación) vive en la base o en
  `docs/clientes/fagal/`.
- Supabase: **cuenta nueva de Aiuda** con un proyecto `aiuda-setter` para **todos** los clientes
  (no uno por cliente). Plan gratis al inicio; cuando entren clientes de pago, Pro ($25/mes) lo
  pagan ellos.

### WhatsApp por cliente
- Una app de Meta **«Aiuda Setter»** y una WABA en el Business Manager de Aiuda; cada cliente
  suma **un número** con su nombre visible y su logo.
- El webhook de la app apunta a **n8n** (no a Chatwoot): n8n reparte por `phone_number_id` y
  publica en la bandeja de Chatwoot del cliente (tipo API, patrón laundry-vip). Así se conserva
  el `referral` de los anuncios y no hay que crear una app por cliente.
- Chatwoot: una **cuenta por cliente** en la instancia de Railway. El personal del cliente ve
  solo su bandeja; Byron es administrador en todas.
- Ojo: Meta revisa que el nombre visible tenga relación con la empresa verificada (Aiuda). Si
  rechaza «Fagal Abogados», alternativa: «Fagal Abogados · Aiuda», o la WABA en el Business
  Manager de Fagal compartida con Aiuda como socio.

### Wizard de conocimiento
Cuando la app esté en Vercel, el admin del cliente lo llena en su primer ingreso: servicios y
honorarios, casos que no toma, quién atiende, horarios y duración de reuniones, dirección,
calendario, avisos, logo y fotos. Alimenta al agente y a la landing. Es el mismo para todo
cliente nuevo.

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
3. Nuestros anuncios dicen «con Fagal Abogados» (autorizado por Fagal). Los textos no prometen
   resultados; Fagal da el visto bueno a cada ángulo nuevo.

### Riesgo de marca y cómo se resuelve
Para un servicio legal, el anuncio de una agencia da menos confianza que el del estudio. Se
compensa con el posicionamiento: **«Aiuda · Soluciones para empresas»** presenta a
**especialistas verificados** («Asesoría legal para empresas con Fagal Abogados, 15 años…»).
El WhatsApp al que llega el lead lleva **nombre y logo de Fagal** (número propio, §0).

## 2 · El embudo

```
Anuncio Meta (página Aiuda, cuenta publicitaria Aiuda)
  ├─ A) Click-to-WhatsApp ──────────────┐   principal: 72 h gratis por entrada desde anuncio
  └─ B) Landing en Vercel ─ botón WA ───┤   respaldo de confianza + retargeting
              └─ botón Agendar ─────────┤   (WA con mensaje listo y código FAG-<ángulo>)
                                        ▼
        Número de Fagal (WABA de Aiuda) → n8n «Aiuda Setter» → organización por phone_number_id
              → contexto de Fagal desde el CRM → Agente Setter → respuesta
              → copia en la cuenta de Chatwoot de Fagal (control humano)
                                        ▼
        Agente Setter: responde dudas básicas · califica · propone horarios · agenda
                                        ▼
        CRM (Vercel + Supabase): lead, empresa, calificación, cita, conversación
        Aviso a Fagal (correo + resumen) · Evento «Agendó» a Meta por Conversions API
                                        ▼
        Seguimiento solo dentro de la ventana gratis (72 h anuncio / 24 h landing).
        Nunca escribimos primero. Fuera de ventana: no sale nada (costo cero).
```

## 3 · Prueba de nichos (sin histórico): empresas con dinero

No sabemos qué segmento rinde más: lo descubren los anuncios. Con $2,5/día no se reparte:
**una campaña, un conjunto, 3 anuncios = 3 ángulos**, y el CRM mide cada uno por su `ad_id`.

Criterio: problemas que **solo tienen las empresas con plata** y que cuestan caro si no se
atienden (honorarios altos, cliente recurrente). Cobranza queda fuera de la primera ronda:
atrae empresas con problemas de caja.

| Ángulo | Quién lo tiene | Gancho |
|---|---|---|
| Tributario (SRI) | Empresas con utilidades: glosas, determinaciones, devoluciones de IVA | «¿Te llegó una glosa del SRI? Responde bien desde el primer escrito» |
| Laboral para empleadores | Empresas con 20+ colaboradores: despidos, inspecciones, demandas | «Un despido mal hecho cuesta más que el sueldo de un año» |
| Cumplimiento (LOPDP / UAFE) | Constructoras, inmobiliarias, concesionarios, financieras: obligaciones y multas | «¿Tu empresa ya cumple la LOPDP? Las multas van sobre la facturación» |

Reserva: societario (Superintendencia de Compañías, juntas, fusiones) y contratos con
proveedores/clientes grandes. **Los ángulos finales se confirman con el wizard de Fagal**: solo
se anuncia lo que Fagal realmente hace y cobra bien.

Filtro en dos capas: el anuncio le habla a «gerentes y dueños de empresas con equipo», y el
agente pregunta tamaño (colaboradores) y cargo antes de ofrecer la reunión.

**Métrica de decisión** (cada 7 días, en el CRM, nunca a ojo):
costo por conversación → % calificadas → **costo por reunión agendada**. Gana el ángulo con
menor costo por reunión; el peor se reemplaza. A las 3–4 semanas se nicha.

Expectativa honesta con ~$75/mes: 40–100 conversaciones, 3–8 reuniones. Se valida en 2 semanas.

## 4 · El CRM (Aiuda Setter)

Next.js 16 + Supabase en Vercel, **con la arquitectura de laundry-vip** (la más limpia de los
repos: capas `app → server → supabase`, Zod, Biome, Vitest, archivos ≤ 300 líneas,
migraciones nunca editadas, secretos fuera del repo, permisos los decide el servidor).

Multi-cliente (todas las tablas llevan `organizacion_id`):

| Tabla | Para qué |
|---|---|
| `organizaciones` | Cada cliente: nombre, código (`FAG`), slug de landing, logo, colores, plan, fin de prueba, módulos, número de WhatsApp, cuenta de Chatwoot |
| `usuarios` | Usuario de Supabase Auth + organización + rol (superadmin no lleva organización) |
| `conocimiento` | Lo que llena el wizard: servicios, honorarios, exclusiones, reuniones, calendario, avisos |
| `angulos` | Ángulo/servicio por organización, enlazado a los `ad_id` de Meta |
| `leads` | Persona + empresa (nombre, RUC, cargo, tamaño), ángulo, origen, referral, etapa |
| `calificaciones` | Respuestas del agente: necesidad, urgencia, tamaño, encaje 0–100 |
| `citas` | Reunión agendada con el cliente (evento de Google Calendar) |
| `mensajes` / `actividad` | Registro de la conversación (la bandeja viva es Chatwoot) |
| `uso_ia` | Costo de IA por mensaje y tope mensual |

Pantallas: **Pipeline** (Nuevo → Calificado → Agendado → Asistió → Cliente / Descartado),
**Lead**, **Citas**, **Ángulos** (costo por reunión por anuncio), **Wizard** y, solo
superadmin, **Organizaciones** (alta, plan, módulos, cambio de organización).

Las landings viven en la misma app: `/<slug>` (ej. `/fagal`) y `/<slug>/<angulo>`.
Sin subdominio: dominio de Vercel.

## 5 · El agente

- **n8n en Railway** (el que ya existe). Workflow nuevo «Aiuda Setter · Agente», uno para
  todas las organizaciones. Los workflows de 321, Academy y Laundry VIP no se tocan.
- **Modelo:** Gemini (capa gratis) principal + OpenAI `gpt-4.1-mini` de respaldo
  (nodo AI Agent con modelo de reserva).
- El cerebro vive en el CRM, como Academy: `/api/agente/contexto` da el contexto de la organización
  (servicios, preguntas de calificación, horarios). Nada del negocio escrito en el prompt.
- Herramientas: `contexto_organizacion`, `registrar_lead`, `calificar_lead`, `horarios_disponibles`
  (free/busy del Google Calendar del cliente), `agendar_reunion`, `escalar_a_persona`.
- Reglas: se presenta como «asistente virtual de Fagal Abogados»; **no da asesoría legal**,
  no opina sobre casos, no promete resultados ni cotiza honorarios; si le preguntan si es
  persona, dice que es un asistente virtual; la etiqueta `humano` en Chatwoot lo calla
  (igual que en laundry-vip).
- Audio (notas de voz): transcripción con el mismo esquema de Academy.

## 6 · Costos

| Pieza | Costo |
|---|---|
| Vercel (CRM + landings) | $0 en Hobby mientras se prueba; **Hobby no permite uso comercial**: con el primer cliente que pague el CRM, Pro ($20/mes) |
| Supabase | $0 (plan gratis, cuenta nueva de Aiuda); Pro $25/mes cuando haya clientes de pago |
| n8n + Chatwoot en Railway | ya pagados |
| WhatsApp | $0 dentro de la ventana; no se usan plantillas |
| Gemini | $0 capa gratis; OpenAI de respaldo ≈ $0–2/mes |
| Google Calendar de Fagal | $0 |
| **Pauta** | **$60–90/mes** |

## 7 · Fases

1. **Base (ya, sin esperar a nadie):** app Next multi-cliente, migraciones (organizaciones,
   usuarios y roles, planes, leads, citas, ángulos), login, panel de superadmin, pipeline,
   landing `/fagal` con los 3 ángulos, píxel + Conversions API.
2. **Wizard y agente (con Supabase y el número):** wizard de conocimiento, `/api/agente/*`,
   workflow n8n, cuenta de Chatwoot de Fagal, calendario de Fagal.
   Prueba de humo completa con un número de prueba.
3. **Lanzamiento:** campaña Click-to-WhatsApp, 3 anuncios, $2,5/día.
4. **Optimización semanal:** reporte de costo por reunión por ángulo; cambiar el peor.

## 8 · Decisiones cerradas (Byron, 2026-10-09)

1. **Número propio para Fagal** con su propio agente; el anuncio es de Aiuda y lleva a ese
   WhatsApp con el logo de Fagal. Fagal autorizó el uso de su nombre y marca.
2. **Privacidad aprobada:** el agente solo pide datos de calificación, nunca detalles del caso.
   Gemini capa gratis + OpenAI de respaldo.
3. **Supabase en cuenta nueva** (de Aiuda, para la plataforma).
4. **Cuestionario = wizard** dentro de la app, cuando esté en Vercel.
5. **CRM con prueba gratis de 3 meses**; después se paga o queda restringido/suspendido.
6. Roles superadmin / admin / operador. Landings en la misma app, sin subdominio.

## 9 · Lo que Byron está haciendo
- Número de Fagal + app de Meta. Pasar: Phone Number ID, WABA ID, token de usuario del sistema.
  **No conectarlo a Chatwoot** (el webhook va a n8n).
- Cuenta nueva de Supabase con el proyecto `aiuda-setter`. Pasar: URL, `anon key`,
  `service_role` (a Vercel, nunca al repo).
