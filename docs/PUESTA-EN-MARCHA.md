# Puesta en marcha

Estado al 2026-10-10: **fase 1 construida** (CRM multicliente, roles, planes, landings).
Falta conectar Supabase y Vercel (Byron) y construir la fase 2 (wizard y agente).

## Lo construido
| Qué | Dónde |
|---|---|
| Base de datos multicliente (organizaciones, usuarios, ángulos, leads, citas, actividad, conocimiento, uso de IA) | `supabase/migrations/0001–0003` |
| Fagal y sus 3 ángulos (tributario, laboral, cumplimiento) | `supabase/semillas/fagal.sql` |
| Login, roles superadmin/admin/operador, cambio de cliente para el superadmin | `src/lib/auth.ts`, `src/app/panel/acciones.ts` |
| Planes: prueba 3 meses → activo / restringido / suspendido, con avisos a 30 y 7 días | `src/lib/planes.ts` |
| Panel: resumen con embudo por ángulo, pipeline, ficha del lead, citas, ángulos, clientes | `src/app/panel/**` |
| Landings públicas `/<cliente>` y `/<cliente>/<ángulo>`, con píxel y referencia `FAG-TRI` | `src/app/[slug]/**`, `src/components/landing/**` |
| Vista previa sin base (solo desarrollo) | `/vista-previa/tributario` |

## Reparto (Byron, 2026-10-10: «yo solo cambio el nombre del repo, el resto lo haces tú»)

**Byron (solo lo que exige su login):**
1. Renombrar el repo en GitHub a `aiuda-empresas`.
2. Crear la cuenta de Supabase de Aiuda y la cuenta/equipo de Vercel, y dejar dos tokens como
   variables del entorno de la sesión (nunca en el chat): `SUPABASE_ACCESS_TOKEN` (Account →
   Access Tokens) y `VERCEL_TOKEN` (Account Settings → Tokens). Vercel debe tener la app de
   GitHub instalada sobre el repo.
3. En n8n, dos credenciales con su propio login: la de WhatsApp del número de Fagal (token del
   usuario del sistema) y la de Gemini (clave de Google AI Studio). Pasar por chat solo el
   Phone Number ID y el WABA ID (no son secretos).

**Claude (con esos tokens):** crea el proyecto `aiuda-empresas` en Supabase (São Paulo), aplica
migraciones y semilla, crea el superadmin de Byron por invitación al correo (él pone su
contraseña), crea el proyecto `aiuda-empresas` en Vercel con sus variables y despliega, arma el
workflow de n8n, prueba de punta a punta y deja todo documentado aquí.

## Siguiente (fase 2)
- Hecho: `/api/agente/contexto` y `/api/agente/lead` (`src/server/agente*.ts`).
- Wizard de conocimiento para el admin del cliente.
- `/api/agente/*` (contexto por `phone_number_id`, registrar lead, calificar, horarios, agendar).
- Workflow n8n «Aiuda Empresas · Agente» (Gemini + OpenAI de respaldo) y cuenta de Chatwoot de Fagal.
- Usuarios del cliente (alta de admin y operadores) y exportación a Excel.
- Conversions API: evento «Agendó» a Meta.
