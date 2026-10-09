'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_ORG, exigir, verifyAuth } from '@/lib/auth'
import { puede } from '@/lib/permisos'
import { agregarNota, cambiarEtapa } from '@/server/leads'
import {
  crearOrganizacion,
  esquemaNuevaOrganizacion,
  organizacionPorId,
} from '@/server/organizaciones'
import { ETAPAS, type Etapa } from '@/types/database'

export type Resultado = { error?: string; aviso?: string; ok?: boolean }

/** El superadmin elige en qué cliente trabaja. Nadie más puede cambiarlo. */
export async function elegirOrganizacion(datos: FormData): Promise<void> {
  const sesion = await verifyAuth()
  if (sesion?.usuario.rol !== 'superadmin') redirect('/panel')
  const id = String(datos.get('organizacion_id') ?? '')
  const almacen = await cookies()
  if (!id) {
    almacen.delete(COOKIE_ORG)
    redirect('/panel/organizaciones')
  }
  if (!(await organizacionPorId(id))) redirect('/panel/organizaciones')
  almacen.set(COOKIE_ORG, id, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' })
  redirect('/panel')
}

export async function crearOrganizacionAccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const sesion = await verifyAuth()
  if (!sesion || !puede(sesion.usuario.rol, 'organizaciones')) {
    return { error: 'No tienes permiso para crear clientes.' }
  }
  const analisis = esquemaNuevaOrganizacion.safeParse({
    nombre: datos.get('nombre'),
    rubro: datos.get('rubro'),
    slug: datos.get('slug'),
    codigo: datos.get('codigo'),
    ciudad: datos.get('ciudad') ?? undefined,
  })
  if (!analisis.success) return { error: analisis.error.issues[0]?.message ?? 'Datos inválidos.' }
  const creado = await crearOrganizacion(analisis.data)
  if (!creado.ok) return { error: creado.error }
  revalidatePath('/panel/organizaciones')
  return { ok: true, aviso: `Cliente «${analisis.data.nombre}» creado.` }
}

export async function cambiarEtapaAccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const sesion = await exigir('leads')
  if (!sesion) return { error: 'No tienes permiso para mover leads.' }
  const etapa = String(datos.get('etapa') ?? '') as Etapa
  if (!ETAPAS.includes(etapa)) return { error: 'Elige una etapa.' }
  const leadId = String(datos.get('lead_id') ?? '')
  const resultado = await cambiarEtapa(
    sesion.org.id,
    leadId,
    etapa,
    sesion.usuario.nombre_completo,
    String(datos.get('motivo') ?? ''),
  )
  if (!resultado.ok) return { error: resultado.error }
  revalidatePath(`/panel/leads/${leadId}`)
  revalidatePath('/panel/pipeline')
  return { ok: true, aviso: 'Etapa actualizada.' }
}

export async function agregarNotaAccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const sesion = await exigir('leads')
  if (!sesion) return { error: 'No tienes permiso para escribir notas.' }
  const leadId = String(datos.get('lead_id') ?? '')
  const resultado = await agregarNota(
    sesion.org.id,
    leadId,
    String(datos.get('nota') ?? ''),
    sesion.usuario.nombre_completo,
  )
  if (!resultado.ok) return { error: resultado.error }
  revalidatePath(`/panel/leads/${leadId}`)
  return { ok: true, aviso: 'Nota guardada.' }
}
