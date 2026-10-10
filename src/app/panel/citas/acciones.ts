'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/app/panel/acciones'
import { exigir } from '@/lib/auth'
import { cambiarEstadoCita, crearCitaEquipo, moverCita } from '@/server/agenda-equipo'
import { citasEntre } from '@/server/citas-y-angulos'

const ESTADOS = ['confirmada', 'cancelada', 'asistio', 'no_asistio'] as const

function listo(r: { ok: true } | { ok: false; error: string }, aviso: string): Resultado {
  if (!r.ok) return { error: r.error }
  revalidatePath('/panel/citas')
  return { ok: true, aviso }
}

export async function citasDelRangoAccion(desde: string, hasta: string) {
  const sesion = await exigir('citas')
  if (!sesion) return []
  return citasEntre(sesion.org.id, new Date(desde), new Date(hasta))
}

export async function moverCitaAccion(
  id: string,
  inicia: string,
  termina: string,
): Promise<Resultado> {
  const sesion = await exigir('citas')
  if (!sesion) return { error: 'No tienes permiso para mover reuniones.' }
  return listo(
    await moverCita(sesion.org.id, id, inicia, termina, sesion.usuario.nombre_completo),
    'Reunión movida y avisada al cliente.',
  )
}

export async function estadoCitaAccion(id: string, estado: string): Promise<Resultado> {
  const sesion = await exigir('citas')
  if (!sesion) return { error: 'No tienes permiso.' }
  const e = ESTADOS.find((x) => x === estado)
  if (!e) return { error: 'Estado no válido.' }
  return listo(
    await cambiarEstadoCita(sesion.org.id, id, e, sesion.usuario.nombre_completo),
    'Listo.',
  )
}

export async function crearCitaAccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const sesion = await exigir('citas')
  if (!sesion) return { error: 'No tienes permiso para crear reuniones.' }
  const modalidad = datos.get('modalidad') === 'presencial' ? 'presencial' : 'virtual'
  return listo(
    await crearCitaEquipo(
      sesion.org.id,
      {
        lead_id: String(datos.get('lead_id') ?? ''),
        inicia: String(datos.get('inicia') ?? ''),
        modalidad,
        notas: String(datos.get('notas') ?? ''),
      },
      sesion.usuario.nombre_completo,
    ),
    'Reunión creada y avisada al cliente.',
  )
}
