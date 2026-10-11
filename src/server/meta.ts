import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Llamadas a la API de Meta (Graph v22.0) con el token del usuario del sistema
 * de Aiuda (META_SISTEMA_TOKEN). El token va en la cabecera, nunca en la URL.
 */

const GRAPH = 'https://graph.facebook.com/v22.0'

export function tokenMeta(): string | null {
  return process.env.META_SISTEMA_TOKEN?.trim() || null
}

export async function graph<T = Record<string, unknown>>(
  ruta: string,
  opciones: { metodo?: 'GET' | 'POST'; cuerpo?: Record<string, unknown> } = {},
): Promise<{ ok: true; datos: T } | { ok: false; error: string; codigo?: number }> {
  const token = tokenMeta()
  if (!token) return { ok: false, error: 'Falta META_SISTEMA_TOKEN en Vercel.' }
  try {
    const r = await fetch(`${GRAPH}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
    const json = (await r.json().catch(() => ({}))) as {
      error?: { message?: string; code?: number }
    } & T
    if (!r.ok || json.error)
      return {
        ok: false,
        error: json.error?.message ?? `HTTP ${r.status}`,
        codigo: json.error?.code,
      }
    return { ok: true, datos: json }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** ¿Qué puede ver el token de cada cliente? Solo nombres y estados, nunca el token. */
export async function saludMeta() {
  if (!tokenMeta()) return { token: 'falta' }
  const yo = await graph<{ id: string; name: string }>('/me?fields=id,name')
  const { data } = await supabaseAdmin()
    .from('organizaciones')
    .select('slug, meta_ad_account_id, meta_page_id, wa_waba_id')
  const clientes = await Promise.all(
    (
      (data ?? []) as {
        slug: string
        meta_ad_account_id: string | null
        meta_page_id: string | null
        wa_waba_id: string | null
      }[]
    ).map(async (o) => {
      const [cuenta, pagina, plantillas] = await Promise.all([
        o.meta_ad_account_id
          ? graph<{ name: string; account_status: number }>(
              `/act_${o.meta_ad_account_id}?fields=name,account_status`,
            )
          : null,
        o.meta_page_id ? graph<{ name: string }>(`/${o.meta_page_id}?fields=name`) : null,
        o.wa_waba_id
          ? graph<{ data: unknown[] }>(
              `/${o.wa_waba_id}/message_templates?fields=name,status&limit=100`,
            )
          : null,
      ])
      const r = <T>(
        x: { ok: true; datos: T } | { ok: false; error: string } | null,
        f: (d: T) => unknown,
      ) => (x === null ? 'sin configurar' : x.ok ? f(x.datos) : `error: ${x.error}`)
      return {
        cliente: o.slug,
        cuenta_publicitaria: r(cuenta, (d) => `${d.name} (estado ${d.account_status})`),
        pagina: r(pagina, (d) => d.name),
        plantillas_whatsapp: r(plantillas, (d) => `${d.data.length} plantillas`),
      }
    }),
  )
  return { token: yo.ok ? `ok (${yo.datos.name})` : `error: ${yo.error}`, clientes }
}
