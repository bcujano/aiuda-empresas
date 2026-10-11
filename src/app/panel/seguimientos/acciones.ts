'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import { crearPlantillasFaltantes } from '@/server/plantillas'
import { cancelarUnSeguimiento, esquemaPasos, guardarSecuencia } from '@/server/seguimientos-panel'

export async function guardarSecuenciaAccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const sesion = await exigir('conocimiento')
  if (!sesion) return { error: 'No tienes permiso para cambiar el seguimiento.' }
  const minutos = datos.getAll('minutos')
  const textos = datos.getAll('texto')
  const plantillas = datos.getAll('plantilla')
  const crudos = minutos
    .map((m, i) => ({ minutos: m, texto: textos[i], plantilla: plantillas[i] ?? '' }))
    .filter((p) => String(p.texto ?? '').trim())
  const analisis = esquemaPasos.safeParse(crudos)
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los pasos.' }
  const r = await guardarSecuencia(
    sesion.org.id,
    String(datos.get('id') ?? ''),
    datos.get('activa') === 'on',
    analisis.data,
  )
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/seguimientos')
  return { ok: true, aviso: 'Secuencia guardada. Aplica a los próximos seguimientos.' }
}

export async function cancelarSeguimientoAccion(id: string): Promise<Resultado> {
  const sesion = await exigir('leads')
  if (!sesion) return { error: 'No tienes permiso.' }
  await cancelarUnSeguimiento(sesion.org.id, id)
  revalidatePath('/panel/seguimientos')
  return { ok: true, aviso: 'Seguimiento cancelado.' }
}

export async function crearPlantillasAccion(): Promise<Resultado> {
  const sesion = await exigir('conocimiento')
  if (!sesion) return { error: 'No tienes permiso.' }
  const r = await crearPlantillasFaltantes(sesion.org)
  revalidatePath('/panel/seguimientos')
  if (r.errores.length) return { error: `Meta respondió: ${r.errores.join(' · ')}` }
  return {
    ok: true,
    aviso: r.creadas.length
      ? `Enviadas a revisión de Meta: ${r.creadas.join(', ')}`
      : 'No faltaba ninguna.',
  }
}
