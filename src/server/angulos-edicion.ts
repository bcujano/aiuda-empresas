import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'

/** Crear, editar, pausar y borrar ángulos (servicios con su landing y su referencia). */

const lineas = z.string().transform((v) =>
  v
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean),
)

export const esquemaAngulo = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  servicio: z.string().trim().min(3, 'Escribe el servicio').max(120),
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,6}$/, 'El código lleva de 2 a 6 letras o números (ej. TRI)'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'La dirección va en minúsculas y con guiones (ej. defensa-tributaria)',
    ),
  titular: z.string().trim().min(5).max(160),
  subtitulo: z.string().trim().min(10).max(400),
  dolores: lineas,
  para_quien: lineas,
  no_para_quien: lineas,
  preguntas: z.string().transform((v, ctx) => {
    const pares = v
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [pregunta, ...resto] = l.split('|')
        return { pregunta: (pregunta ?? '').trim(), respuesta: resto.join('|').trim() }
      })
    if (pares.some((p) => !p.pregunta || !p.respuesta)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cada pregunta va en una línea: pregunta | respuesta',
      })
    }
    return pares
  }),
  mensaje_whatsapp: z.string().trim().min(5).max(300),
  meta_ad_ids: lineas.refine(
    (l) => l.every((x) => /^\d{6,25}$/.test(x)),
    'Los IDs de anuncio son solo números',
  ),
  orden: z.coerce.number().int().min(0).max(999),
  activo: z.boolean(),
})

export async function guardarAngulo(
  orgId: string,
  d: z.infer<typeof esquemaAngulo>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { id, ...campos } = d
  const db = supabaseAdmin()
  const r = id
    ? await db
        .from('angulos')
        .update(campos)
        .eq('id', id)
        .eq('organizacion_id', orgId)
        .select('id')
        .maybeSingle()
    : await db
        .from('angulos')
        .insert({ ...campos, organizacion_id: orgId })
        .select('id')
        .single()
  if (r.error || !r.data) {
    return {
      ok: false,
      error:
        r.error?.code === '23505'
          ? 'Ya hay otro ángulo con ese código o esa dirección.'
          : 'No se pudo guardar el ángulo.',
    }
  }
  return { ok: true }
}

/** Si ya trajo leads, solo se pausa (para no perder de dónde vinieron); si no, se borra. */
export async function borrarAngulo(
  orgId: string,
  id: string,
): Promise<{ ok: true; aviso: string } | { ok: false; error: string }> {
  const db = supabaseAdmin()
  const { count } = await db
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organizacion_id', orgId)
    .eq('angulo_id', id)
  if ((count ?? 0) > 0) {
    await db.from('angulos').update({ activo: false }).eq('id', id).eq('organizacion_id', orgId)
    return { ok: true, aviso: 'Tiene leads, así que quedó pausado en vez de borrarse.' }
  }
  const { error } = await db.from('angulos').delete().eq('id', id).eq('organizacion_id', orgId)
  return error ? { ok: false, error: 'No se pudo borrar.' } : { ok: true, aviso: 'Ángulo borrado.' }
}
