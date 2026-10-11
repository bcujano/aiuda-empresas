import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizarTelefono } from '@/lib/telefono'

/**
 * «Prefiero que me llamen» de la landing de Aiuda: el interesado deja sus datos
 * y queda como lead de la organización de Aiuda (slug configurable). No se le
 * escribe por WhatsApp: el equipo lo llama, como pidió.
 */

export const SLUG_AIUDA = process.env.AIUDA_ORG_SLUG ?? 'aiuda'

const texto = (max: number) => z.string().trim().min(2, 'Complete su nombre y su empresa.').max(max)

export const esquemaSolicitud = z.object({
  nombre: texto(120),
  empresa: texto(160),
  telefono: z.string().transform((v, ctx) => {
    const n = normalizarTelefono(v)
    if (!n) ctx.addIssue({ code: 'custom', message: 'Revise el número de teléfono.' })
    return n ?? ''
  }),
  horario: z.enum(['manana', 'tarde', 'cualquiera']).default('cualquiera'),
})

const HORARIO = { manana: 'en la mañana', tarde: 'en la tarde', cualquiera: 'a cualquier hora' }

export async function registrarSolicitud(
  d: z.infer<typeof esquemaSolicitud>,
): Promise<{ ok: boolean }> {
  const db = supabaseAdmin()
  const { data: org } = await db.from('organizaciones').select('id').eq('slug', SLUG_AIUDA).single()
  if (!org) return { ok: false }
  const orgId = (org as { id: string }).id
  const nota = `Pidió que lo llamen ${HORARIO[d.horario]} desde la web.`
  const { data: existente } = await db
    .from('leads')
    .select('id')
    .eq('organizacion_id', orgId)
    .eq('telefono', d.telefono)
    .maybeSingle()
  let leadId = (existente as { id: string } | null)?.id
  if (!leadId) {
    const { data, error } = await db
      .from('leads')
      .insert({
        organizacion_id: orgId,
        telefono: d.telefono,
        nombre: d.nombre,
        empresa: d.empresa,
        origen: 'landing',
        ventana_horas: 24,
        notas: nota,
      })
      .select('id')
      .single()
    if (error || !data) return { ok: false }
    leadId = (data as { id: string }).id
  }
  await db.from('actividad').insert({
    organizacion_id: orgId,
    lead_id: leadId,
    tipo: 'nota',
    contenido: `${nota} Empresa: ${d.empresa}.`,
    autor: 'Landing',
  })
  return { ok: true }
}
