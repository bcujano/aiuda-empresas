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

## Pasos de Byron
1. **Supabase (cuenta nueva de Aiuda)** → proyecto `aiuda-setter`, región São Paulo.
   - SQL Editor: pegar en orden `0001`, `0002`, `0003` y luego `supabase/semillas/fagal.sql`.
   - Authentication → Users → *Add user* con tu correo y contraseña. Luego en el SQL Editor:
     ```sql
     insert into usuarios (auth_user_id, nombre_completo, rol)
     select id, 'Byron Cujano', 'superadmin' from auth.users where email = 'TU_CORREO';
     ```
   - Pasar a Vercel: Project URL, `anon` key y `service_role` key.
2. **Vercel** → importar el repo, nombre del proyecto **`aiuda-empresas`**
   (queda en `https://aiuda-empresas.vercel.app`; landing de Fagal: `/fagal/tributario`).
   Variables: las de `.env.example`. `AGENTE_SECRETO`: una cadena larga al azar.
3. **WhatsApp de Fagal** → cuando esté el número: Phone Number ID, WABA ID y token del
   usuario del sistema. La landing se publica sola cuando la organización tiene `wa_numero`.

## Siguiente (fase 2)
- Wizard de conocimiento para el admin del cliente.
- `/api/agente/*` (contexto por `phone_number_id`, registrar lead, calificar, horarios, agendar).
- Workflow n8n «Aiuda Setter · Agente» (Gemini + OpenAI de respaldo) y cuenta de Chatwoot de Fagal.
- Usuarios del cliente (alta de admin y operadores) y exportación a Excel.
- Conversions API: evento «Agendó» a Meta.
