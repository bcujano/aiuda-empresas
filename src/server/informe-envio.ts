import { z } from 'zod'
import { esquemaInforme, type Informe } from '@/lib/informe-modelo'
import { informePdf } from '@/lib/informe-pdf'
import { supabaseAdmin } from '@/lib/supabase/admin'

/** Informes revisados y programados para salir por correo con el PDF adjunto. */

export const esquemaProgramacion = z.object({
  destino: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (v) => v === '' || z.string().email().safeParse(v).success,
      'El correo de destino no es válido',
    ),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length >= 10 && v.length <= 15, 'El número de WhatsApp no es válido'),
  asunto: z.string().trim().min(5, 'Escribe el asunto').max(160),
  enviar_at: z.string().datetime({ offset: true }),
})

export async function programarInforme(
  orgId: string,
  datos: Informe,
  p: z.infer<typeof esquemaProgramacion>,
): Promise<boolean> {
  const db = supabaseAdmin()
  // Un solo informe pendiente por cliente: el nuevo reemplaza al anterior.
  await db.from('informes_envio').delete().eq('organizacion_id', orgId).is('enviado_at', null)
  const { error } = await db.from('informes_envio').insert({ organizacion_id: orgId, datos, ...p })
  return !error
}

export async function informePendiente(orgId: string) {
  const { data } = await supabaseAdmin()
    .from('informes_envio')
    .select('id, destino, whatsapp, asunto, enviar_at, datos')
    .eq('organizacion_id', orgId)
    .is('enviado_at', null)
    .order('enviar_at')
    .limit(1)
    .maybeSingle()
  const f = data as {
    id: string
    destino: string
    whatsapp: string
    asunto: string
    enviar_at: string
    datos: unknown
  } | null
  if (!f) return null
  const analisis = esquemaInforme.safeParse(f.datos)
  return { ...f, datos: analisis.success ? analisis.data : null }
}

/** Lo que n8n pide cada pocos minutos: el informe que ya toca enviar, con su PDF en base64. */
export async function informesPorEnviar(ahora: Date = new Date()): Promise<unknown[]> {
  const { data } = await supabaseAdmin()
    .from('informes_envio')
    .select('id, organizacion_id, datos, destino, whatsapp, asunto')
    .is('enviado_at', null)
    .lte('enviar_at', ahora.toISOString())
    .order('enviar_at')
    .limit(1)
  const salida: unknown[] = []
  for (const f of (data ?? []) as {
    id: string
    organizacion_id: string
    datos: unknown
    destino: string
    whatsapp: string
    asunto: string
  }[]) {
    const analisis = esquemaInforme.safeParse(f.datos)
    if (!analisis.success) {
      await supabaseAdmin()
        .from('informes_envio')
        .update({ error: 'Informe inválido', enviado_at: ahora.toISOString() })
        .eq('id', f.id)
      continue
    }
    const pdf = await informePdf(analisis.data)
    // Por WhatsApp (plantilla con botón al informe); el correo con el PDF es opcional.
    const { data: o } = await supabaseAdmin()
      .from('organizaciones')
      .select('wa_phone_number_id, prefijo_plantillas')
      .eq('id', f.organizacion_id)
      .single()
    const org = o as {
      wa_phone_number_id: string | null
      prefijo_plantillas: string | null
    } | null
    const whatsapp =
      f.whatsapp && org?.wa_phone_number_id
        ? {
            phone_number_id: org.wa_phone_number_id,
            to: f.whatsapp,
            plantilla: `${org.prefijo_plantillas ?? ''}informe_cliente`,
            parametros: [analisis.data.cliente],
            boton: f.id,
          }
        : null
    salida.push({
      whatsapp,
      id: f.id,
      destino: f.destino,
      asunto: f.asunto,
      cliente: analisis.data.cliente,
      pdf_base64: pdf.toString('base64'),
    })
  }
  return salida
}

export const esquemaResultadoInforme = z.object({
  id: z.string().uuid(),
  ok: z.boolean(),
  error: z.string().max(500).optional(),
})

export async function marcarInforme(d: z.infer<typeof esquemaResultadoInforme>): Promise<boolean> {
  const { data } = await supabaseAdmin()
    .from('informes_envio')
    .update({ enviado_at: new Date().toISOString(), error: d.ok ? null : (d.error ?? 'FALLO') })
    .eq('id', d.id)
    .is('enviado_at', null)
    .select('id')
    .maybeSingle()
  return Boolean(data)
}

/** Cancela lo que esté programado para este cliente: no sale nada. */
export async function cancelarInformePendiente(orgId: string): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .from('informes_envio')
    .delete()
    .eq('organizacion_id', orgId)
    .is('enviado_at', null)
  return !error
}
