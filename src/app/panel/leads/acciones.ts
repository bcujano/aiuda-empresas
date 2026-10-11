'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import {
  borrarLead,
  crearLeadManual,
  editarLead,
  esquemaEdicionLead,
  esquemaNuevoLead,
} from '@/server/leads-edicion'

export async function editarLeadAccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const sesion = await exigir('leads')
  if (!sesion) return { error: 'No tienes permiso para editar leads.' }
  const analisis = esquemaEdicionLead.safeParse({
    ...Object.fromEntries(datos.entries()),
    no_contactar: datos.get('no_contactar') === 'on',
  })
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los datos.' }
  const id = String(datos.get('id') ?? '')
  const r = await editarLead(sesion.org.id, id, analisis.data, sesion.usuario.nombre_completo)
  if (!r.ok) return { error: r.error }
  revalidatePath(`/panel/leads/${id}`)
  revalidatePath('/panel/leads')
  return { ok: true, aviso: 'Lead guardado.' }
}

export async function crearLeadAccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const sesion = await exigir('leads')
  if (!sesion) return { error: 'No tienes permiso para crear leads.' }
  const analisis = esquemaNuevoLead.safeParse(Object.fromEntries(datos.entries()))
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Revisa los datos.' }
  const r = await crearLeadManual(sesion.org.id, analisis.data, sesion.usuario.nombre_completo)
  if (!r.ok) return { error: r.error }
  redirect(`/panel/leads/${r.id}`)
}

export async function borrarLeadAccion(id: string): Promise<Resultado> {
  const sesion = await exigir('leads')
  if (!sesion || sesion.usuario.rol === 'operador')
    return { error: 'Solo un administrador puede borrar leads.' }
  const r = await borrarLead(sesion.org.id, id)
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/leads')
  redirect('/panel/leads')
}
