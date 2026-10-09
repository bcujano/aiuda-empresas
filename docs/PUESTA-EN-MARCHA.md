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

## Puesta en marcha manual (Byron no pudo cargar tokens en el entorno, 2026-10-10)
1. Supabase (proyecto ya creado) → SQL Editor → pegar `supabase/instalar-todo.sql` completo → Run.
   Probado en Postgres local: crea las tablas, Fagal y sus 3 ángulos; la semilla se puede repetir.
2. Authentication → Users → Add user (correo + contraseña, «Auto Confirm User») y luego:
   `insert into usuarios (auth_user_id, nombre_completo, rol) select id, 'Byron Cujano', 'superadmin' from auth.users where email = 'brncjn@gmail.com';`
3. Vercel → Add New → Project → importar `bcujano/aiuda-empresas` → 5 variables de `.env.example`
   (llaves en Supabase → Project Settings → API) → Deploy.
4. Pasar a Claude la URL de Vercel: Claude verifica landing y login.

`supabase/instalar-todo.sql` se regenera concatenando migraciones + semilla; si se agrega una
migración, se pega solo el archivo nuevo, nunca el paquete completo otra vez.

## Siguiente (fase 2)
- Hecho: `/api/agente/contexto` y `/api/agente/lead` (`src/server/agente*.ts`).
- Wizard de conocimiento para el admin del cliente.
- `/api/agente/*` (contexto por `phone_number_id`, registrar lead, calificar, horarios, agendar).
- Workflow n8n «Aiuda Empresas · Agente» (Gemini + OpenAI de respaldo) y cuenta de Chatwoot de Fagal.
- Usuarios del cliente (alta de admin y operadores) y exportación a Excel.
- Conversions API: evento «Agendó» a Meta.
