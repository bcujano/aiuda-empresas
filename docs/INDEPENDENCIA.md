# Independencia total de 321

Regla (Byron, 2026-10-20): **todo lo de Aiuda Empresas es propio.** Ningún workflow, servidor,
credencial ni cuenta compartida con 321.

## Qué se comparte hoy con 321

| Pieza | Hoy | Debe quedar |
|---|---|---|
| n8n | Instancia de 321 en Railway (`primary-production-ed243`) | n8n propio de Aiuda en su propio proyecto de Railway |
| Chatwoot | Instancia de 321 (`chatwoot-production-8564`), cuenta 4 de Fagal | Chatwoot propio de Aiuda |
| Credencial de OpenAI en n8n («OpenAi account») | La de 321 | Llave propia de Aiuda |
| Gmail de avisos en n8n | Credencial existente en la instancia de 321 | Correo propio de Aiuda |
| Organización «321-soluciones-inmobiliarias» en esta base | Existe (no la creó esta sesión) | Fuera de esta plataforma, o confirmar para qué está |

Ya son propios: el repo, Vercel, Supabase, la app de Meta / el token de sistema, el número y la
WABA de Fagal, y la llave de Gemini «Gemini Aiuda».

## Cómo se separa (sin cortar a Fagal)

1. **Byron:** crea un proyecto nuevo en Railway, «Aiuda Empresas», con las plantillas
   oficiales de **n8n** y **Chatwoot**. Cada una trae su propia base de datos.
2. **Claude:** importa los 2 workflows (agente y avisos) en el n8n nuevo, desde
   `n8n/*.sdk.ts`. Crea las credenciales nuevas, cargadas por Byron en n8n; ningún secreto va por el chat.
3. **Byron:** en el Chatwoot nuevo, crea la cuenta «Fagal Abogados» y la bandeja de WhatsApp Cloud
   con el mismo número.
4. **Claude:** apunta el webhook de esa cuenta al n8n nuevo y cambia en Vercel
   `N8N_AVISOS_URL`. Actualiza en el CRM la cuenta y la bandeja de Chatwoot de Fagal.
5. **Prueba completa** con un número de prueba: agenda, aviso, recordatorio y seguimiento.
6. **Recién entonces** se desactivan los workflows de Aiuda en el n8n de 321 y la cuenta 4 del
   Chatwoot de 321.

El número de Fagal solo puede estar en una bandeja a la vez: el paso 3 y el 4 se hacen juntos, en
pocos minutos, fuera del horario de atención.
