'use client'

import { PhoneCall, X } from 'lucide-react'
import { useActionState, useEffect, useId, useState } from 'react'
import { type EstadoSolicitud, pedirLlamada } from '@/app/acciones-landing'

/**
 * «Prefiero que me llamen»: para quien no quiere escribir por WhatsApp.
 * El pedido queda como lead de Aiuda y se mide como «Lead» en el píxel.
 */
export function FormLlamada({ oscuro = false }: { oscuro?: boolean }) {
  const [estado, accion, pendiente] = useActionState<EstadoSolicitud, FormData>(pedirLlamada, {})
  const id = useId()
  useEffect(() => {
    if (estado.ok) window.fbq?.('track', 'Lead', { content_name: 'AIU-LLAMADA' })
  }, [estado.ok])

  if (estado.ok) {
    return (
      <p className="rounded-2xl bg-[var(--esmeralda-claro)] p-5 font-medium text-[var(--esmeralda)]">
        Listo. Le llamamos en el horario que eligió, en días laborables.
      </p>
    )
  }
  const campo = `min-h-12 w-full rounded-xl px-4 outline-none ring-1 focus:ring-2 focus:ring-[var(--esmeralda)] ${
    oscuro
      ? 'bg-white/10 text-white ring-white/20 placeholder:text-white/50'
      : 'bg-white ring-[var(--linea)]'
  }`
  return (
    <form action={accion} className="grid gap-3 sm:grid-cols-2">
      <label className="sr-only" htmlFor={`${id}-n`}>
        Su nombre
      </label>
      <input
        autoComplete="name"
        className={campo}
        id={`${id}-n`}
        name="nombre"
        placeholder="Su nombre"
        required
      />
      <label className="sr-only" htmlFor={`${id}-e`}>
        Empresa
      </label>
      <input
        autoComplete="organization"
        className={campo}
        id={`${id}-e`}
        name="empresa"
        placeholder="Empresa"
        required
      />
      <label className="sr-only" htmlFor={`${id}-t`}>
        Teléfono
      </label>
      <input
        autoComplete="tel"
        className={campo}
        id={`${id}-t`}
        inputMode="tel"
        name="telefono"
        placeholder="Teléfono (09…)"
        required
      />
      <label className="sr-only" htmlFor={`${id}-h`}>
        Horario
      </label>
      <select className={campo} defaultValue="cualquiera" id={`${id}-h`} name="horario">
        <option value="manana">En la mañana</option>
        <option value="tarde">En la tarde</option>
        <option value="cualquiera">A cualquier hora</option>
      </select>
      <input aria-hidden autoComplete="off" className="hidden" name="sitio_web" tabIndex={-1} />
      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--tinta)] px-5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:col-span-2"
        disabled={pendiente}
        style={oscuro ? { background: '#fff', color: 'var(--tinta)' } : undefined}
        type="submit"
      >
        <PhoneCall aria-hidden size={18} />
        {pendiente ? 'Enviando…' : 'Prefiero que me llamen'}
      </button>
      {estado.error ? <p className="text-[#b3261e] text-sm sm:col-span-2">{estado.error}</p> : null}
      <p
        className={`text-xs sm:col-span-2 ${oscuro ? 'text-white/60' : 'text-[var(--tinta-suave)]'}`}
      >
        Usamos su número solo para esta llamada. Ver{' '}
        <a className="underline" href="/privacidad">
          política de privacidad
        </a>
        .
      </p>
    </form>
  )
}

/** En escritorio, al ir a cerrar la pestaña, ofrece la llamada una sola vez por visita. */
export function SalidaIntencion({ enlace }: { enlace: string }) {
  const [abierto, setAbierto] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) return
    const yaVisto = () => {
      try {
        return sessionStorage.getItem('aiuda-salida') === '1'
      } catch {
        return false
      }
    }
    const alSalir = (e: MouseEvent) => {
      if (e.clientY > 0 || yaVisto()) return
      try {
        sessionStorage.setItem('aiuda-salida', '1')
      } catch {}
      setAbierto(true)
    }
    const t = setTimeout(() => document.addEventListener('mouseout', alSalir), 8000)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mouseout', alSalir)
    }
  }, [])
  if (!abierto) return null
  return (
    <div
      aria-labelledby="salida-titulo"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(15_30_51/0.6)] p-4"
      role="dialog"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--marfil)] p-8 shadow-2xl">
        <button
          aria-label="Cerrar"
          className="absolute top-4 right-4 rounded-full p-2 hover:bg-[var(--arena)]"
          onClick={() => setAbierto(false)}
          type="button"
        >
          <X size={18} />
        </button>
        <h2 className="font-bold text-2xl" id="salida-titulo">
          ¿Lo conversamos en 15 minutos?
        </h2>
        <p className="mt-2 text-[var(--tinta-suave)]">
          Le llamamos, revisamos su caso y le decimos con honestidad si Aiuda le sirve. Sin
          compromiso.
        </p>
        <div className="mt-6">
          <FormLlamada />
        </div>
        <a
          className="mt-4 block text-center text-[var(--esmeralda)] text-sm underline"
          href={enlace}
          rel="noopener"
          target="_blank"
        >
          O escríbanos por WhatsApp
        </a>
      </div>
    </div>
  )
}
