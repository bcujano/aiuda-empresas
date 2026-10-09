# Aiuda Setter

Plataforma multicliente de Aiuda: anuncios en Meta → agente de IA en WhatsApp →
reunión agendada, con un CRM por cliente. Primer cliente: Fagal Abogados.

**Leer primero:** [`docs/PLAN.md`](docs/PLAN.md) (modelo, arquitectura y decisiones) y
[`docs/PUESTA-EN-MARCHA.md`](docs/PUESTA-EN-MARCHA.md) (estado y pasos pendientes).

## Cómo trabaja el dueño (Byron)
- Todo en español con tildes y ñ: código, comentarios, commits e interfaz.
- No le gustan las paradas: avanza y pregunta solo lo que bloquea. Recomendaciones, no menús.
- Si dice «no ejecutes aún», analiza y propone sin tocar nada.

## Reglas
1. **Un cliente = una organización (datos), nunca código.** Ningún nombre, texto o número
   de un cliente se escribe en el código: vive en la base (organizaciones, angulos, conocimiento).
2. **Aislamiento:** toda consulta de `src/server/**` filtra por `organizacion_id`. RLS niega
   todo por defecto (respaldo); el servidor usa service_role.
3. **Permisos = rol × plan**, decididos en el servidor (`lib/auth.ts::permite`). La pantalla
   solo oculta; cada acción vuelve a comprobar.
4. `src/app/**` nunca importa `lib/supabase/admin.ts`: pasa por `src/server/**`.
5. Migraciones aplicadas **nunca se editan**: cambio = archivo nuevo en `supabase/migrations/`.
6. Gate antes de subir: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
7. Máximo 300 líneas por archivo. Sin ORM, sin librería de fechas (Quito es UTC-5 fijo).
8. WhatsApp: nunca escribimos primero; solo dentro de la ventana gratis (72 h anuncio, 24 h otro).
9. El agente no da asesoría, no promete resultados y nunca pide detalles del caso.
10. Ningún secreto en el repo.

## Stack
Next.js 16 · React 19 · TypeScript 6 · Tailwind 4 · Biome · Vitest · Supabase · Vercel ·
n8n + Chatwoot en Railway · Gemini (principal) + OpenAI (respaldo).
