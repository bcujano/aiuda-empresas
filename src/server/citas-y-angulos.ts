import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Angulo, Cita, Lead } from '@/types/database'

export type CitaConLead = Cita & { lead: Pick<Lead, 'id' | 'nombre' | 'empresa' | 'telefono'> }

/** Citas de una organización desde hoy, la más próxima primero. */
export async function proximasCitas(orgId: string): Promise<CitaConLead[]> {
  const desde = new Date(Date.now() - 12 * 3_600_000).toISOString()
  const { data, error } = await supabaseAdmin()
    .from('citas')
    .select('*, lead:leads(id, nombre, empresa, telefono)')
    .eq('organizacion_id', orgId)
    .gte('inicia_at', desde)
    .order('inicia_at', { ascending: true })
    .limit(100)
  if (error) throw new Error(`No se pudieron leer las citas: ${error.message}`)
  return (data ?? []) as CitaConLead[]
}

/** Todas las citas de una organización entre dos instantes (para el calendario). */
export async function citasEntre(orgId: string, desde: Date, hasta: Date): Promise<CitaConLead[]> {
  const { data, error } = await supabaseAdmin()
    .from('citas')
    .select('*, lead:leads(id, nombre, empresa, telefono)')
    .eq('organizacion_id', orgId)
    .gte('inicia_at', desde.toISOString())
    .lt('inicia_at', hasta.toISOString())
    .order('inicia_at', { ascending: true })
  if (error) throw new Error(`No se pudieron leer las citas: ${error.message}`)
  return (data ?? []) as CitaConLead[]
}

export async function citasDeLead(orgId: string, leadId: string): Promise<Cita[]> {
  const { data } = await supabaseAdmin()
    .from('citas')
    .select('*')
    .eq('organizacion_id', orgId)
    .eq('lead_id', leadId)
    .order('inicia_at', { ascending: false })
  return (data ?? []) as Cita[]
}

export async function listarAngulos(orgId: string): Promise<Angulo[]> {
  const { data, error } = await supabaseAdmin()
    .from('angulos')
    .select('*')
    .eq('organizacion_id', orgId)
    .order('orden', { ascending: true })
  if (error) throw new Error(`No se pudieron leer los ángulos: ${error.message}`)
  return (data ?? []) as Angulo[]
}

/** Horario de atención por día (1 = lunes) en minutos desde medianoche. */
export async function horarioDeOrganizacion(
  orgId: string,
): Promise<Record<number, [number, number][]>> {
  const { data } = await supabaseAdmin()
    .from('horarios_atencion')
    .select('dia_semana, desde, hasta')
    .eq('organizacion_id', orgId)
  const minutos = (h: string) => {
    const [a = '0', b = '0'] = h.split(':')
    return Number(a) * 60 + Number(b)
  }
  const salida: Record<number, [number, number][]> = {}
  for (const f of (data ?? []) as { dia_semana: number; desde: string; hasta: string }[]) {
    const lista = salida[f.dia_semana] ?? []
    lista.push([minutos(f.desde), minutos(f.hasta)])
    salida[f.dia_semana] = lista
  }
  return salida
}
