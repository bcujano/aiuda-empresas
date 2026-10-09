'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import { esquemaConfiguracion, guardarConfiguracion } from '@/server/configuracion'

export async function guardarConfiguracionAccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const sesion = await exigir('conocimiento')
  if (!sesion) return { error: 'No tienes permiso para cambiar la configuración.' }
  const analisis = esquemaConfiguracion.safeParse({
    ...Object.fromEntries(datos.entries()),
    dias: datos.getAll('dias'),
    modalidades: datos.getAll('modalidades'),
  })
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los datos.' }
  const r = await guardarConfiguracion(sesion.org.id, analisis.data)
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/configuracion')
  revalidatePath('/panel/citas')
  return {
    ok: true,
    aviso: 'Configuración guardada. El asistente ya la usa en la próxima conversación.',
  }
}
