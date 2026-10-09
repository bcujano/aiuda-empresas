import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Lead, Organizacion } from '@/types/database'

/** Búsquedas base del agente: la organización por el número que recibió y el lead por teléfono. */

export async function organizacionPorNumero(phoneNumberId: string): Promise<Organizacion | null> {
  const { data } = await supabaseAdmin()
    .from('organizaciones')
    .select('*')
    .eq('wa_phone_number_id', phoneNumberId)
    .maybeSingle()
  const org = data as Organizacion | null
  // Un cliente suspendido no tiene agente.
  return org && org.estado_plan !== 'suspendido' ? org : null
}

export async function leadPorTelefono(orgId: string, telefono: string): Promise<Lead | null> {
  const { data } = await supabaseAdmin()
    .from('leads')
    .select('*')
    .eq('organizacion_id', orgId)
    .eq('telefono', telefono)
    .maybeSingle()
  return (data as Lead | null) ?? null
}
