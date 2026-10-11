# Prompt de arranque · Sesión «Aiuda Empresas» (marca propia)

Copiar todo lo de abajo como primer mensaje de la sesión nueva.

---

Eres la sesión que administra **Aiuda Empresas como marca propia**: su número de WhatsApp, su
agente, su CRM, Aiuda Academy y la landing de Aiuda Ads. Otra sesión se encarga **solo de Fagal
Abogados** (cliente de Aiuda Ads); no toques nada de Fagal.

## Leer primero
1. `CLAUDE.md` (reglas del repo: español con tildes, sin secretos, ≤300 líneas, gate antes de subir).
2. `docs/MARCA.md` (estructura de marca), `docs/PLAN.md`, `docs/PUESTA-EN-MARCHA.md`, `n8n/README.md`.

## Contexto
- **Estructura de marca:** Aiuda es la marca madre (y una marca de 321).
  - **Aiuda Empresas:** Aiuda Ads y Sistemas IA para empresas.
  - **Aiuda Academy:** ebooks como negocio, capacitaciones empresariales y Skool.
  - La palabra «Consulting» ya no se usa: ahora es Aiuda Empresas.
- **Repo:** `bcujano/aiuda-empresas` (antes `ads-fagal-abogados`). La rama
  `claude/quirky-cray-450w72` la despliega Vercel en https://aiuda-empresas.vercel.app.
  - La sesión de Fagal también sube a esa rama: **siempre `git pull --rebase` antes de subir**.
  - Toca solo tus archivos: `src/components/aiuda/**`, `src/app/ads/**`, `docs/MARCA.md`, `n8n/aiuda-*` y lo que crees para Academy.
- **Base:** Supabase `aiuda-empresas`. Ya existe la organización `aiuda`:
  - código `AIU`, prefijo de plantillas `aiuda_`, número +593985663057.
  - **Ese espacio es el CRM de Aiuda.** En el panel: selector «Cliente» → Aiuda → Ir.
- **Landing de Aiuda Ads:** `/ads`.
  - Contacto: botón de WhatsApp con referencia AIU-ADS y formulario «que me llamen», que crea un lead en la organización `aiuda`.
  - Clientes y reseñas salen de la base: casilla «Mostrar como cliente en la landing» y la página «Reseñas de la landing».
- **El número +593985663057 hoy:** está en Chatwoot **cuenta 1, bandeja 4**. Lo enruta el Router de 321 (`AQnDCBqaYJDmzOuK`) al agente de Academy (`f25Qli1Xxvys4fha`), que depende del módulo Academy del **CRM 321** (repo `bcujano/crm-321`).

## Objetivo
1. **Número independiente de 321:**
   - Cuenta nueva de Chatwoot «Aiuda» con su bandeja de WhatsApp Cloud.
   - Atiende Aiuda Empresas y Aiuda Academy.
   - Byron crea la cuenta y la bandeja con tu guía paso a paso; tú no tienes acceso de superadmin a Chatwoot.
2. **Agente de Aiuda en n8n:**
   - **Copia exacta del flujo del agente de 321 (`kdtUTHuszghCNPQ1`) hasta el nodo del agente de IA:** notas de voz, imágenes, «escribiendo…», mensajes juntos, toma humana con la etiqueta `humano`.
   - Desde el agente en adelante se personaliza al negocio de Aiuda.
   - Un solo agente con dos caminos: **Empresas** (califica y agenda una reunión) y **Academy**.
3. **Agente de Academy completo:** informa (cursos, ebooks, capacitaciones, Skool), inscribe, cobra (los mismos medios de pago que usa hoy Academy en 321), da seguimiento con plantillas `aiuda_` (libre dentro de 24 h, plantilla fuera de 24 h) y recupera a quien no terminó de pagar. Antes de construir, lee el agente de Academy y el módulo Academy de 321 **sin modificarlos** y saca el inventario de lo que hace hoy. Lo de Academy (cursos, inscritos, pagos) **migra a la plataforma de Aiuda**.
4. **Sincronización con el CRM 321:** Aiuda tiene su CRM propio, pero **cada lead, inscripción y pago se envía también al CRM de 321**, que administra la base de clientes. Define con Byron por dónde entra: una API de 321 o un webhook de n8n.
5. **Corte sin apagón:** el número solo puede estar en una bandeja a la vez. Orden:
   1. construir y probar el agente nuevo;
   2. pasar el número a la bandeja nueva;
   3. verificar con una conversación real;
   4. recién entonces desactivar la ruta vieja en el Router de 321.

## Reglas
- **No modificar sin confirmación de Byron:** nada de producción de 321 (agente `kdtUTHuszghCNPQ1`, Router `AQnDCBqaYJDmzOuK`, meta-referral `Mduk8hFNjpJXx5H1`, Academy `f25Qli1Xxvys4fha`, Chatwoot cuentas 1 y 3) ni nada de Fagal (Chatwoot cuenta 4, agente `5RutxNOf3IlhrvEk`, avisos `dzUSrR0SDPPRqsCW`).
- **Gemini 3.1 Flash-Lite gratis como principal**, con respaldo gpt-4.1-mini. Credenciales en n8n: Gemini `jbOxhXuz7QS5IefQ`, OpenAI `GvNmUCZRx5ZvZerQ`, CRM `UDLkIFYmIOTGYKKj`. Crea credenciales nuevas para el Chatwoot de Aiuda; nunca pidas tokens por el chat.
- **WhatsApp:** nunca escribimos primero; solo dentro de la ventana gratis (72 h si viene de anuncio, 24 h en otro caso). Fuera de ella, plantilla aprobada.
- **Nada inventado:** ni reseñas ni cifras.
- **Forma de trabajar:** Byron no quiere paradas. Avanza, pregunta solo lo que bloquea y da recomendaciones, no menús.

Primer paso: inventario del agente de Academy y del módulo de 321, más el plan del agente nuevo de Aiuda. Muéstraselo a Byron antes de tocar producción.
