import type { Metadata } from 'next'
import { darDeBajaPorToken } from '@/server/contacto-frio-respuestas'

export const metadata: Metadata = { title: 'Darse de baja', robots: { index: false } }

/**
 * Baja de un correo de contacto en frío. Se confirma con un botón (POST): los
 * programas de seguridad que abren los enlaces del correo no deben darla solos.
 */
export default async function Baja({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ listo?: string }>
}) {
  const { token } = await params
  const { listo } = await searchParams
  async function confirmar() {
    'use server'
    await darDeBajaPorToken(token)
    const { redirect } = await import('next/navigation')
    redirect(`/baja/${token}?listo=1`)
  }
  if (listo) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-2 p-6">
        <h1 className="font-bold text-2xl">Listo</h1>
        <p className="text-[var(--texto-suave)]">No volveremos a escribirle.</p>
      </main>
    )
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="font-bold text-2xl">No recibir más mensajes</h1>
      <p className="text-[var(--texto-suave)]">
        Si confirma, no volveremos a escribirle por correo ni por WhatsApp.
      </p>
      <form action={confirmar}>
        <button className="boton boton-primario" type="submit">
          Confirmar baja
        </button>
      </form>
    </main>
  )
}
