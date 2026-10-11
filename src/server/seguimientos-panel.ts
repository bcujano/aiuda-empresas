import { z } from 'zod'
import type { Paso } from '@/lib/seguimientos'
import { supabaseAdmin } from '@/lib/supabase/admin'

/** Lo que el panel muestra y edita del seguimiento automático. Todo por organización. */

export type Secuencia = {
  id: string
  codigo: string
  nombre: string
  activa: boolean
  pasos: Paso[]
}
export type FilaCola = {
  id: string
  secuencia: string
  paso: number
  programado_at: string
  estado: string
  texto: string
  plantilla: string | null
  enviado_at: string | null
  error: string | null
  lead: { id: string; nombre: string | null; empresa: string | null; telefono: string }
}

export async function listarSecuencias(orgId: string): Promise<Secuencia[]> {
  const { data } = await supabaseAdmin()
    .from('secuencias')
    .select('id, codigo, nombre, activa, pasos')
    .eq('organizacion_id', orgId)
    .order('codigo')
  return (data ?? []) as Secuencia[]
}

export async function colaSeguimientos(orgId: string): Promise<FilaCola[]> {
  const { data } = await supabaseAdmin()
    .from('seguimientos')
    .select(
      'id, secuencia, paso, programado_at, estado, texto, plantilla, enviado_at, error, lead:leads(id, nombre, empresa, telefono)',
    )
    .eq('organizacion_id', orgId)
    .order('programado_at', { ascending: false })
    .limit(100)
  return (data ?? []) as unknown as FilaCola[]
}

export const esquemaPasos = z
  .array(
    z.object({
      minutos: z.coerce
        .number()
        .int()
        .min(5)
        .max(60 * 24 * 14),
      texto: z.string().trim().min(5).max(900),
      plantilla: z
        .string()
        .trim()
        .regex(/^[a-z0-9_]*$/, 'El nombre de la plantilla va en minúsculas y con guiones bajos')
        .transform((v) => v || null),
    }),
  )
  .max(6, 'Máximo 6 pasos por secuencia')

export async function guardarSecuencia(
  orgId: string,
  id: string,
  activa: boolean,
  pasos: Paso[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabaseAdmin()
    .from('secuencias')
    .update({
      activa,
      pasos: [...pasos].sort((a, b) => a.minutos - b.minutos),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organizacion_id', orgId)
  return error ? { ok: false, error: 'No se pudo guardar la secuencia.' } : { ok: true }
}

export async function cancelarUnSeguimiento(orgId: string, id: string): Promise<void> {
  await supabaseAdmin()
    .from('seguimientos')
    .update({ estado: 'cancelado' })
    .eq('id', id)
    .eq('organizacion_id', orgId)
    .eq('estado', 'pendiente')
}
