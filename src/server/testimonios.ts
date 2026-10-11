import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Reseñas de la landing de Aiuda. Son de Aiuda (no de un cliente), por eso no
 * filtran por organización: solo el superadmin las ve y las edita. Ninguna se
 * publica sin la casilla «autorizado» (el autor dio su permiso por escrito).
 */

export type FilaTestimonio = {
  id: string
  autor: string
  cargo: string | null
  empresa: string
  texto: string
  calificacion: number | null
  foto_url: string | null
  autorizado: boolean
  visible: boolean
  orden: number
}

const opcional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(max).nullable(),
  )

export const esquemaTestimonio = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  autor: z.string().trim().min(2, 'Escribe quién lo dice').max(120),
  cargo: opcional(120),
  empresa: z.string().trim().min(2, 'Escribe la empresa').max(160),
  texto: z.string().trim().min(10, 'La reseña es muy corta').max(600),
  calificacion: z.preprocess(
    (v) => (v === '' ? null : v),
    z.coerce.number().int().min(1).max(5).nullable(),
  ),
  foto_url: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z
      .string()
      .trim()
      .regex(/^https:\/\/\S+$/, 'La foto debe ser una dirección https')
      .nullable(),
  ),
  autorizado: z.boolean(),
  visible: z.boolean(),
  orden: z.coerce.number().int().min(0).max(999).default(0),
})

export async function listarTestimonios(): Promise<FilaTestimonio[]> {
  const { data } = await supabaseAdmin()
    .from('testimonios')
    .select('*')
    .order('orden')
    .order('created_at')
  return (data ?? []) as FilaTestimonio[]
}

export async function guardarTestimonio(
  d: z.infer<typeof esquemaTestimonio>,
): Promise<{ ok: boolean; error?: string }> {
  const { id, ...campos } = d
  const db = supabaseAdmin().from('testimonios')
  const { error } = id ? await db.update(campos).eq('id', id) : await db.insert(campos)
  return error ? { ok: false, error: 'No se pudo guardar la reseña.' } : { ok: true }
}

export async function borrarTestimonio(id: string): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin().from('testimonios').delete().eq('id', id)
  return { ok: !error }
}
