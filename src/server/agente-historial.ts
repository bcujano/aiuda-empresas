import { supabaseAdmin } from '@/lib/supabase/admin'
import { inicioDelDiaQuito } from './agente-reglas'

/**
 * Memoria del agente: la conversación guardada en el CRM. Así el agente no
 * depende de la memoria de n8n (que se pierde al reiniciar y no se comparte
 * entre procesos) y recuerda lo mismo que ve el equipo en la ficha del lead.
 */

const ROL: Record<string, 'cliente' | 'agente' | 'equipo'> = {
  mensaje_entrante: 'cliente',
  mensaje_agente: 'agente',
  mensaje_persona: 'equipo',
}

export type LineaHistorial = { rol: 'cliente' | 'agente' | 'equipo'; texto: string }

export async function historialDelLead(
  orgId: string,
  leadId: string,
  limite = 20,
): Promise<{ historial: LineaHistorial[]; mensajes_hoy: number }> {
  const db = supabaseAdmin()
  const [mensajes, hoy] = await Promise.all([
    db
      .from('actividad')
      .select('tipo, contenido')
      .eq('organizacion_id', orgId)
      .eq('lead_id', leadId)
      .in('tipo', Object.keys(ROL))
      .order('created_at', { ascending: false })
      .limit(limite),
    db
      .from('actividad')
      .select('id', { count: 'exact', head: true })
      .eq('organizacion_id', orgId)
      .eq('lead_id', leadId)
      .eq('tipo', 'mensaje_entrante')
      .gte('created_at', inicioDelDiaQuito(new Date()).toISOString()),
  ])
  const filas = (mensajes.data ?? []) as { tipo: string; contenido: string }[]
  return {
    historial: filas
      .reverse()
      .map((f) => ({ rol: ROL[f.tipo] ?? 'cliente', texto: f.contenido.slice(0, 1000) })),
    mensajes_hoy: hoy.count ?? 0,
  }
}
