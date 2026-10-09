'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase/server'

export type EstadoLogin = { error?: string }

const esquema = z.object({
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

/**
 * Entrada con correo y contraseña. No hay autoregistro ni enlaces por correo:
 * las cuentas las crea Aiuda o el administrador del cliente.
 */
export async function entrar(_previo: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const analisis = esquema.safeParse({
    email: datos.get('email'),
    password: datos.get('password'),
  })
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.signInWithPassword({
    email: analisis.data.email,
    password: analisis.data.password,
  })

  // Mismo mensaje para correo inexistente y contraseña incorrecta: no se le
  // confirma a un extraño qué correos tienen cuenta.
  if (error) return { error: 'Correo o contraseña incorrectos.' }

  redirect('/panel')
}

export async function salir(): Promise<void> {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}
