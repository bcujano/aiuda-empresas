import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { etiquetaHora } from '@/lib/agenda'
import { citaPorToken, horasParaMover } from '@/server/cita-equipo'
import { responderCitaAccion } from './acciones'

export const metadata: Metadata = { title: 'Reunión agendada', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ESTADO: Record<string, string> = {
  agendada: 'Por confirmar',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  asistio: 'Asistió',
  no_asistio: 'No asistió',
}

export default async function CitaDelEquipo({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ listo?: string; error?: string }>
}) {
  const { token } = await params
  const { listo, error } = await searchParams
  const datos = await citaPorToken(token)
  if (!datos) notFound()
  const { cita, lead, org } = datos
  const activa = cita.estado === 'agendada' || cita.estado === 'confirmada'
  const horas = activa ? await horasParaMover(datos) : []

  const filas: [string, string | null][] = [
    ['Contacto', lead.nombre],
    ['Empresa', lead.empresa],
    ['Cargo', lead.cargo],
    ['Colaboradores', lead.colaboradores],
    ['Ciudad', lead.ciudad],
    ['Necesidad', lead.necesidad],
    ['Urgencia', lead.urgencia],
    ['WhatsApp', `+${lead.telefono.replace(/\D/g, '')}`],
  ]

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 px-4 py-8">
      <header>
        <p className="text-sm opacity-70">{org.nombre} · Reunión agendada por el asistente</p>
        <h1 className="mt-1 font-bold text-2xl tracking-tight">{etiquetaHora(cita.inicia_at)}</h1>
        <p className="mt-1 text-sm">
          {cita.modalidad === 'virtual' ? 'Virtual' : 'Presencial'} · {org.cita_minutos} min ·{' '}
          <strong>{ESTADO[cita.estado] ?? cita.estado}</strong>
        </p>
      </header>

      {listo && (
        <p className="rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-sm">{listo}</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-600/40 bg-red-600/10 p-3 text-sm">{error}</p>
      )}

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/15">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {filas.map(([etiqueta, valor]) => (
            <div className="contents" key={etiqueta}>
              <dt className="opacity-60">{etiqueta}</dt>
              <dd>{valor || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      {activa && (
        <section className="flex flex-col gap-3">
          {cita.estado === 'agendada' && (
            <form action={responderCitaAccion}>
              <input name="token" type="hidden" value={token} />
              <input name="tipo" type="hidden" value="confirmar" />
              <button className="boton boton-primario w-full" type="submit">
                Confirmar esta hora
              </button>
            </form>
          )}
          <form action={responderCitaAccion} className="flex flex-col gap-2">
            <input name="token" type="hidden" value={token} />
            <input name="tipo" type="hidden" value="mover" />
            <label className="font-medium text-sm" htmlFor="inicia_at">
              Proponer otra hora (queda confirmada y se le avisa al cliente)
            </label>
            <select className="campo" id="inicia_at" name="inicia_at" required>
              {horas.map((h) => (
                <option key={h.valor} value={h.valor}>
                  {h.etiqueta}
                </option>
              ))}
            </select>
            <button className="boton boton-suave" type="submit">
              Mover la reunión
            </button>
          </form>
          <form action={responderCitaAccion}>
            <input name="token" type="hidden" value={token} />
            <input name="tipo" type="hidden" value="cancelar" />
            <button className="boton boton-peligro w-full" type="submit">
              Cancelar la reunión
            </button>
          </form>
        </section>
      )}
      <p className="text-xs opacity-60">
        Este enlace es privado del equipo de {org.nombre}. Cualquier cambio se le avisa al cliente
        por WhatsApp.
      </p>
    </main>
  )
}
