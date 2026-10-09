'use server'

import { redirect } from 'next/navigation'
import { responderCita } from '@/server/cita-equipo'

/** Confirmar, mover o cancelar desde el enlace privado de la cita. */
export async function responderCitaAccion(datos: FormData): Promise<void> {
  const token = String(datos.get('token') ?? '')
  const tipo = String(datos.get('tipo') ?? '')
  const inicia = String(datos.get('inicia_at') ?? '')
  const accion =
    tipo === 'confirmar'
      ? ({ tipo: 'confirmar' } as const)
      : tipo === 'cancelar'
        ? ({ tipo: 'cancelar' } as const)
        : ({ tipo: 'mover', inicia_at: inicia } as const)
  const r = await responderCita(token, accion)
  const aviso = r.ok ? r.mensaje : r.error
  redirect(`/cita/${token}?${r.ok ? 'listo' : 'error'}=${encodeURIComponent(aviso)}`)
}
