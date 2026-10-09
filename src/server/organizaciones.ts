import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Angulo, Organizacion } from '@/types/database'

export async function listarOrganizaciones(): Promise<Organizacion[]> {
  const { data, error } = await supabaseAdmin()
    .from('organizaciones')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(`No se pudieron leer las organizaciones: ${error.message}`)
  return (data ?? []) as Organizacion[]
}

export async function organizacionPorId(id: string): Promise<Organizacion | null> {
  const { data } = await supabaseAdmin()
    .from('organizaciones')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return (data as Organizacion | null) ?? null
}

/**
 * Lo que necesita una landing pública: la organización y sus ángulos activos.
 * Solo se publica si la organización tiene número de WhatsApp (sin número no
 * hay a dónde mandar al lead) y no está suspendida.
 */
export async function landingPorSlug(
  slug: string,
): Promise<{ org: Organizacion; angulos: Angulo[] } | null> {
  const db = supabaseAdmin()
  const { data: fila } = await db.from('organizaciones').select('*').eq('slug', slug).maybeSingle()
  const org = fila as Organizacion | null
  if (!org?.wa_numero || org.estado_plan === 'suspendido') return null

  const { data: angulos } = await db
    .from('angulos')
    .select('*')
    .eq('organizacion_id', org.id)
    .eq('activo', true)
    .order('orden', { ascending: true })
  return { org, angulos: (angulos ?? []) as Angulo[] }
}

/** Direcciones que ya son pantallas del sistema: un cliente no puede tomarlas. */
const RUTAS_RESERVADAS = new Set([
  'panel',
  'login',
  'api',
  'vista-previa',
  '_next',
  'privacidad',
  'eliminacion-de-datos',
])

export const esquemaNuevaOrganizacion = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre del cliente.'),
  rubro: z.string().trim().min(2, 'Escribe el rubro.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'La dirección solo lleva minúsculas, números y guiones.')
    .refine((s) => !RUTAS_RESERVADAS.has(s), 'Esa dirección la usa el sistema. Elige otra.'),
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,5}$/, 'El código lleva de 2 a 5 letras.'),
  ciudad: z.string().trim().optional(),
})

export async function crearOrganizacion(
  datos: z.infer<typeof esquemaNuevaOrganizacion>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await supabaseAdmin()
    .from('organizaciones')
    .insert({ ...datos, ciudad: datos.ciudad || null })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Ya existe un cliente con esa dirección o ese código.' }
    }
    return { ok: false, error: 'No se pudo crear el cliente.' }
  }
  return { ok: true, id: (data as { id: string }).id }
}
