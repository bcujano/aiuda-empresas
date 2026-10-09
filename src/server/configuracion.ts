import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { normalizarTelefono } from '@/lib/telefono'
import type { Organizacion } from '@/types/database'

/**
 * Configuración que el cliente llena en el CRM (el wizard): datos del estudio
 * que el agente puede afirmar, reglas de la agenda, a quién avisar y el píxel.
 * Nada de esto vive en el código: cada organización tiene lo suyo.
 */

const texto = (max: number) => z.string().trim().max(max).default('')
const hora = z.string().regex(/^\d{2}:\d{2}$/, 'Usa el formato 08:00')

export const esquemaConfiguracion = z
  .object({
    experiencia: texto(300),
    trayectoria: texto(2000),
    direccion: texto(300),
    reuniones: texto(300),
    horario_texto: texto(300),
    honorarios: texto(300),
    dias: z
      .array(z.coerce.number().int().min(1).max(7))
      .min(1, 'Elige al menos un día de atención'),
    desde: hora,
    hasta: hora,
    cita_minutos: z.coerce.number().int().min(15).max(240),
    cita_anticipacion_horas: z.coerce.number().int().min(0).max(72),
    cita_dias_adelante: z.coerce.number().int().min(1).max(60),
    modalidades: z.array(z.enum(['virtual', 'presencial'])).min(1, 'Elige al menos una modalidad'),
    aviso_email: z.union([z.literal(''), z.string().trim().email('El correo no es válido')]),
    aviso_whatsapp: z
      .string()
      .trim()
      .refine((v) => v === '' || normalizarTelefono(v) !== null, 'El WhatsApp no es válido'),
    pixel_id: z
      .string()
      .trim()
      .regex(/^(\d{6,20})?$/, 'El ID del píxel son solo números'),
  })
  .refine((d) => d.hasta > d.desde, {
    message: 'La hora de cierre debe ser después de la de apertura',
    path: ['hasta'],
  })

export type Configuracion = z.infer<typeof esquemaConfiguracion>

export async function leerConfiguracion(org: Organizacion): Promise<Configuracion> {
  const db = supabaseAdmin()
  const [horarios, conocimiento] = await Promise.all([
    db.from('horarios_atencion').select('dia_semana, desde, hasta').eq('organizacion_id', org.id),
    db.from('conocimiento').select('datos').eq('organizacion_id', org.id).maybeSingle(),
  ])
  const filas = (horarios.data ?? []) as { dia_semana: number; desde: string; hasta: string }[]
  const datos = (conocimiento.data?.datos ?? {}) as Record<string, unknown>
  const cadena = (v: unknown) => (typeof v === 'string' ? v : '')
  return {
    experiencia: cadena(datos.experiencia),
    trayectoria: Array.isArray(datos.trayectoria)
      ? datos.trayectoria.join('\n')
      : cadena(datos.trayectoria),
    direccion: org.direccion ?? cadena(datos.direccion),
    reuniones: cadena(datos.reuniones),
    horario_texto: cadena(datos.horario),
    honorarios: cadena(datos.honorarios),
    dias: filas.length ? [...new Set(filas.map((f) => f.dia_semana))].sort() : [1, 2, 3, 4, 5],
    desde: filas[0]?.desde.slice(0, 5) ?? '08:00',
    hasta: filas[0]?.hasta.slice(0, 5) ?? '17:00',
    cita_minutos: org.cita_minutos,
    cita_anticipacion_horas: org.cita_anticipacion_horas,
    cita_dias_adelante: org.cita_dias_adelante,
    modalidades: org.modalidades,
    aviso_email: org.aviso_email ?? '',
    aviso_whatsapp: org.aviso_whatsapp ?? '',
    pixel_id: org.pixel_id ?? '',
  }
}

export async function guardarConfiguracion(
  orgId: string,
  c: Configuracion,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = supabaseAdmin()
  const { error } = await db
    .from('organizaciones')
    .update({
      direccion: c.direccion || null,
      cita_minutos: c.cita_minutos,
      cita_intervalo_minutos: c.cita_minutos <= 60 ? 60 : c.cita_minutos,
      cita_anticipacion_horas: c.cita_anticipacion_horas,
      cita_dias_adelante: c.cita_dias_adelante,
      modalidades: c.modalidades,
      aviso_email: c.aviso_email || null,
      aviso_whatsapp: c.aviso_whatsapp ? normalizarTelefono(c.aviso_whatsapp) : null,
      pixel_id: c.pixel_id || null,
    })
    .eq('id', orgId)
  if (error) return { ok: false, error: 'No se pudo guardar la configuración.' }

  await db.from('horarios_atencion').delete().eq('organizacion_id', orgId)
  const { error: errorHorario } = await db.from('horarios_atencion').insert(
    c.dias.map((d) => ({
      organizacion_id: orgId,
      dia_semana: d,
      desde: c.desde,
      hasta: c.hasta,
    })),
  )
  if (errorHorario) return { ok: false, error: 'No se pudo guardar el horario de atención.' }

  const { data } = await db
    .from('conocimiento')
    .select('datos')
    .eq('organizacion_id', orgId)
    .maybeSingle()
  const previos = (data?.datos ?? {}) as Record<string, unknown>
  const datos = {
    ...previos,
    experiencia: c.experiencia,
    trayectoria: c.trayectoria
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
    direccion: c.direccion,
    reuniones: c.reuniones,
    horario: c.horario_texto,
    honorarios: c.honorarios,
  }
  const { error: errorConocimiento } = await db
    .from('conocimiento')
    .upsert({ organizacion_id: orgId, datos, updated_at: new Date().toISOString() })
  if (errorConocimiento)
    return { ok: false, error: 'No se pudo guardar la información del estudio.' }
  return { ok: true }
}
