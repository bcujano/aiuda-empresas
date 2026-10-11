import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizarTelefono } from '@/lib/telefono'
import { COLABORADORES, ETAPAS, type Lead, ORIGENES } from '@/types/database'
import { cancelarSeguimientos } from './seguimientos'

/** Buscar, crear, editar y borrar leads de UNA organización. */

export type FiltroLeads = { q?: string; etapa?: string; angulo?: string }

export async function buscarLeads(orgId: string, filtro: FiltroLeads): Promise<Lead[]> {
  let consulta = supabaseAdmin()
    .from('leads')
    .select('*')
    .eq('organizacion_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(300)
  if (filtro.etapa && (ETAPAS as readonly string[]).includes(filtro.etapa))
    consulta = consulta.eq('etapa', filtro.etapa)
  if (filtro.angulo === 'sin') consulta = consulta.is('angulo_id', null)
  else if (filtro.angulo) consulta = consulta.eq('angulo_id', filtro.angulo)
  const q = filtro.q?.trim().replace(/[%,()]/g, '')
  if (q)
    consulta = consulta.or(
      `nombre.ilike.%${q}%,empresa.ilike.%${q}%,telefono.ilike.%${q}%,necesidad.ilike.%${q}%`,
    )
  const { data, error } = await consulta
  if (error) throw new Error(`No se pudieron leer los leads: ${error.message}`)
  return (data ?? []) as Lead[]
}

const vacioANull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
const texto = (max: number) => z.preprocess(vacioANull, z.string().trim().max(max).nullable())

export const esquemaEdicionLead = z.object({
  nombre: texto(120),
  empresa: texto(160),
  ruc: z.preprocess(
    vacioANull,
    z
      .string()
      .regex(/^\d{13}$/, 'El RUC tiene 13 dígitos')
      .nullable(),
  ),
  cargo: texto(120),
  colaboradores: z.preprocess(vacioANull, z.enum(COLABORADORES).nullable()),
  ciudad: texto(80),
  necesidad: texto(500),
  urgencia: z.preprocess(vacioANull, z.enum(['baja', 'media', 'alta']).nullable()),
  notas: texto(2000),
  no_contactar: z.boolean(),
})

export async function editarLead(
  orgId: string,
  id: string,
  cambios: z.infer<typeof esquemaEdicionLead>,
  autor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('leads')
    .update(cambios)
    .eq('id', id)
    .eq('organizacion_id', orgId)
    .select('id')
    .maybeSingle()
  if (error || !data) return { ok: false, error: 'No se pudo guardar el lead.' }
  if (cambios.no_contactar) await cancelarSeguimientos(orgId, id)
  await db.from('actividad').insert({
    organizacion_id: orgId,
    lead_id: id,
    tipo: 'nota',
    contenido: 'Datos del lead editados a mano.',
    autor,
  })
  return { ok: true }
}

export const esquemaNuevoLead = z.object({
  telefono: z.string().transform((v, ctx) => {
    const n = normalizarTelefono(v)
    if (!n) ctx.addIssue({ code: 'custom', message: 'El teléfono no es válido' })
    return n ?? ''
  }),
  nombre: texto(120),
  empresa: texto(160),
  necesidad: texto(500),
  origen: z.enum(ORIGENES).default('manual'),
})

export async function crearLeadManual(
  orgId: string,
  datos: z.infer<typeof esquemaNuevoLead>,
  autor: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('leads')
    .insert({ ...datos, organizacion_id: orgId, ventana_horas: 24 })
    .select('id')
    .single()
  if (error || !data) {
    return {
      ok: false,
      error:
        error?.code === '23505'
          ? 'Ya existe un lead con ese teléfono.'
          : 'No se pudo crear el lead.',
    }
  }
  const id = (data as { id: string }).id
  await db.from('actividad').insert({
    organizacion_id: orgId,
    lead_id: id,
    tipo: 'nota',
    contenido: 'Lead creado a mano.',
    autor,
  })
  return { ok: true, id }
}

/** Borra el lead con sus citas, actividad y seguimientos (en cascada). No se puede deshacer. */
export async function borrarLead(
  orgId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabaseAdmin()
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('organizacion_id', orgId)
    .select('id')
    .maybeSingle()
  return error || !data ? { ok: false, error: 'No se pudo borrar el lead.' } : { ok: true }
}
