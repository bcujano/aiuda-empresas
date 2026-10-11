'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/app/panel/acciones'
import { verifyAuth } from '@/lib/auth'
import { hayArchivo, subirImagen } from '@/server/archivos'
import { borrarTestimonio, esquemaTestimonio, guardarTestimonio } from '@/server/testimonios'

async function esSuper() {
  const sesion = await verifyAuth()
  return sesion?.usuario.rol === 'superadmin'
}

export async function guardarTestimonioAccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  if (!(await esSuper())) return { error: 'Solo el superadmin edita reseñas.' }
  const foto = datos.get('foto_archivo')
  if (hayArchivo(foto)) {
    const subida = await subirImagen(foto, 'resenas')
    if (!subida.ok) return { error: subida.error }
    datos.set('foto_url', subida.url)
  }
  const analisis = esquemaTestimonio.safeParse({
    ...Object.fromEntries(datos.entries()),
    autorizado: datos.get('autorizado') === 'on',
    visible: datos.get('visible') === 'on',
  })
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los datos.' }
  const r = await guardarTestimonio(analisis.data)
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/testimonios')
  revalidatePath('/')
  return { ok: true, aviso: 'Reseña guardada.' }
}

export async function borrarTestimonioAccion(id: string): Promise<Resultado> {
  if (!(await esSuper())) return { error: 'Solo el superadmin borra reseñas.' }
  const r = await borrarTestimonio(id)
  if (!r.ok) return { error: 'No se pudo borrar.' }
  revalidatePath('/panel/testimonios')
  revalidatePath('/')
  return { ok: true, aviso: 'Reseña borrada.' }
}
