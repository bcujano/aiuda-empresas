import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizarTelefono } from '@/lib/telefono'

/** Ficha completa de un cliente, solo para el superadmin de Aiuda. */

const opcional = (re: RegExp, msg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().regex(re, msg).nullable(),
  )
const numeroId = (msg: string) => opcional(/^[0-9]{6,20}$/, msg)
const entero = z.preprocess(
  (v) => (v === '' || v === null ? null : v),
  z.coerce.number().int().positive().nullable(),
)

export const esquemaOrganizacion = z.object({
  id: z.string().uuid(),
  nombre: z.string().trim().min(2).max(120),
  rubro: z.string().trim().min(2).max(80),
  especialista: z.string().trim().min(2).max(80),
  ciudad: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(80).nullable()),
  color_primario: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'El color va como #1f3a5f'),
  logo_url: opcional(/^https:\/\/\S+$/, 'El logo debe ser una dirección https'),
  plan_codigo: z.string().min(2),
  precio_acordado: z.preprocess((v) => (v === '' ? null : v), z.coerce.number().min(0).nullable()),
  estado_plan: z.enum(['prueba', 'activo', 'restringido', 'suspendido']),
  prueba_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wa_numero: z
    .preprocess((v) => (v === '' ? null : v), z.string().nullable())
    .transform((v, ctx) => {
      if (v === null) return null
      const n = normalizarTelefono(v)
      if (!n) ctx.addIssue({ code: 'custom', message: 'El WhatsApp no es válido' })
      return n
    }),
  wa_phone_number_id: numeroId('El Phone Number ID son solo números'),
  wa_waba_id: numeroId('El ID de la cuenta de WhatsApp son solo números'),
  chatwoot_cuenta_id: entero,
  chatwoot_bandeja_id: entero,
  meta_ad_account_id: numeroId('La cuenta publicitaria son solo números (sin act_)'),
  meta_page_id: numeroId('El ID de la página son solo números'),
  meta_ig_id: numeroId('El ID de Instagram son solo números'),
  pixel_id: numeroId('El píxel son solo números'),
  prefijo_plantillas: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : ''),
    z
      .string()
      .regex(/^([a-z0-9]+_)?$/, 'El prefijo va en minúsculas y termina en guion bajo (ej. fagal_)'),
  ),
  caso_publico: z.preprocess((v) => v === 'on', z.boolean()),
  drive_carpeta_id: opcional(/^[A-Za-z0-9_-]{10,80}$/, 'El ID de la carpeta de Drive no es válido'),
})

export async function guardarOrganizacion(
  d: z.infer<typeof esquemaOrganizacion>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id, ...campos } = d
  const { error } = await supabaseAdmin().from('organizaciones').update(campos).eq('id', id)
  if (!error) return { ok: true }
  return {
    ok: false,
    error:
      error.code === '23505'
        ? 'Ese número o ID ya lo usa otro cliente.'
        : 'No se pudo guardar el cliente.',
  }
}

export async function listarPlanesTodos(): Promise<
  { codigo: string; nombre: string; precio_mensual: number }[]
> {
  const { data } = await supabaseAdmin()
    .from('planes')
    .select('codigo, nombre, precio_mensual')
    .order('orden')
  return (data ?? []) as { codigo: string; nombre: string; precio_mensual: number }[]
}
