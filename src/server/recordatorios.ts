import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Cita, Lead, Organizacion } from '@/types/database'
import { datosAviso } from './agenda'

/**
 * Recordatorios de reuniones confirmadas: uno el día anterior (24 h antes) y
 * otro 2 h antes. n8n los pide cada 15 minutos, los entrega y avisa cuáles
 * salieron para no repetirlos.
 */

export async function recordatoriosPendientes() {
  const ahora = Date.now()
  const db = supabaseAdmin()
  const { data } = await db
    .from('citas')
    .select('*')
    .eq('estado', 'confirmada')
    .gt('inicia_at', new Date(ahora).toISOString())
    .lte('inicia_at', new Date(ahora + 24 * 3_600_000).toISOString())
  const citas = (data ?? []) as Cita[]
  const salida: (ReturnType<typeof datosAviso> & { tipo: '24h' | '2h' })[] = []
  for (const cita of citas) {
    const faltan = Date.parse(cita.inicia_at) - ahora
    const tipo = faltan <= 2 * 3_600_000 ? '2h' : '24h'
    if (tipo === '2h' && cita.recordatorio_2h_at) continue
    if (tipo === '24h' && cita.recordatorio_24h_at) continue
    const [lead, org] = await Promise.all([
      db.from('leads').select('*').eq('id', cita.lead_id).single(),
      db.from('organizaciones').select('*').eq('id', cita.organizacion_id).single(),
    ])
    if (!lead.data || !org.data) continue
    const o = org.data as Organizacion
    if (o.estado_plan === 'suspendido') continue
    salida.push({ ...datosAviso(o, lead.data as Lead, cita), tipo })
  }
  return salida
}

export async function marcarRecordatorio(citaId: string, tipo: '24h' | '2h'): Promise<boolean> {
  const campo = tipo === '2h' ? 'recordatorio_2h_at' : 'recordatorio_24h_at'
  const cambios: Record<string, string> = { [campo]: new Date().toISOString() }
  // Si sale el de 2 h, el de 24 h ya no tiene sentido.
  if (tipo === '2h') cambios.recordatorio_24h_at = cambios[campo] as string
  const { error } = await supabaseAdmin().from('citas').update(cambios).eq('id', citaId)
  return !error
}
