'use client'

import { Loader2, LogIn } from 'lucide-react'
import { useActionState } from 'react'
import { type EstadoLogin, entrar } from './actions'

const INICIAL: EstadoLogin = {}

export default function Login() {
  const [estado, accion, pendiente] = useActionState(entrar, INICIAL)

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--fondo)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-bold text-2xl tracking-tight">Aiuda Setter</h1>
          <p className="mt-1 text-[var(--texto-suave)] text-sm">
            Leads, citas y conversaciones de tu empresa
          </p>
        </div>

        <form action={accion} className="tarjeta flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm" htmlFor="email">
              Correo
            </label>
            <input
              autoComplete="username"
              className="campo"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm" htmlFor="password">
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className="campo"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          {estado.error ? (
            <p
              className="rounded-lg bg-[var(--peligro-suave)] px-3 py-2 text-[var(--peligro)] text-sm"
              role="alert"
            >
              {estado.error}
            </p>
          ) : null}

          <button
            className="boton boton-primario justify-center"
            disabled={pendiente}
            type="submit"
          >
            {pendiente ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
            {pendiente ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-[var(--texto-suave)] text-xs">
          ¿No tienes cuenta? Pídesela a tu administrador.
        </p>
      </div>
    </main>
  )
}
