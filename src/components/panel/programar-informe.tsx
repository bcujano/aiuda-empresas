'use client'

import { Send, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import { cancelarInformeAccion, programarInformeAccion } from '@/app/panel/informe/acciones'
import { Aviso } from '@/components/ui/primitivos'
import type { Informe } from '@/lib/informe-modelo'

export type PendienteInforme = {
  whatsapp: string
  destino: string
  asunto: string
  enviar_at: string
  datos: Informe | null
}

/** Un instante, en hora de Quito y en el formato del campo de fecha. */
const aQuito = (iso: string) => new Date(Date.parse(iso) - 5 * 3_600_000).toISOString().slice(0, 16)

/** «Mañana a las 7:00» en hora de Quito, en el formato del campo de fecha. */
function mananaSieteQuito(): string {
  const quito = new Date(Date.now() - 5 * 3_600_000 + 86_400_000)
  return `${quito.toISOString().slice(0, 10)}T07:00`
}

export function ProgramarInforme({
  informe,
  whatsappInicial,
  pendiente,
}: {
  informe: Informe
  whatsappInicial: string
  pendiente: PendienteInforme | null
}) {
  const [whatsapp, setWhatsapp] = useState(pendiente?.whatsapp || whatsappInicial)
  const [destino, setDestino] = useState(pendiente?.destino ?? '')
  const [asunto, setAsunto] = useState(
    pendiente?.asunto ?? `Informe de campañas · ${informe.cliente}`,
  )
  const [cuando, setCuando] = useState(pendiente ? aQuito(pendiente.enviar_at) : mananaSieteQuito())
  const [estado, setEstado] = useState<Resultado>({})
  const [pendienteAccion, iniciar] = useTransition()
  return (
    <section className="tarjeta flex flex-col gap-3 p-4">
      <h2 className="font-semibold text-base">8 · Enviar por WhatsApp</h2>
      <p className="text-[var(--texto-suave)] text-sm">
        Guarda el informe tal como está ahora y sale solo a la hora indicada: el cliente recibe un
        mensaje de WhatsApp con un botón para ver y descargar el PDF. Un solo informe queda
        programado: el nuevo reemplaza al anterior.
      </p>
      {pendiente ? (
        <p className="rounded-lg bg-[var(--aviso-suave)] p-2 text-[var(--aviso)] text-sm">
          Ya hay uno programado para +{pendiente.whatsapp} el{' '}
          {new Date(pendiente.enviar_at).toLocaleString('es-EC', {
            timeZone: 'America/Guayaquil',
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          .
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="inf-whatsapp">WhatsApp del cliente (con código de país)</label>
          <input
            className="campo"
            id="inf-whatsapp"
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="593990000000"
            value={whatsapp}
          />
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="inf-destino">Correo (opcional, con PDF adjunto)</label>
          <input
            className="campo"
            id="inf-destino"
            onChange={(e) => setDestino(e.target.value)}
            type="email"
            value={destino}
          />
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="inf-asunto">Asunto</label>
          <input
            className="campo"
            id="inf-asunto"
            onChange={(e) => setAsunto(e.target.value)}
            value={asunto}
          />
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label htmlFor="inf-cuando">Enviar el (hora de Quito)</label>
          <input
            className="campo"
            id="inf-cuando"
            onChange={(e) => setCuando(e.target.value)}
            type="datetime-local"
            value={cuando}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="boton boton-primario"
          disabled={pendienteAccion}
          onClick={() =>
            iniciar(async () =>
              setEstado(
                await programarInformeAccion(
                  JSON.stringify(informe),
                  destino,
                  whatsapp,
                  asunto,
                  cuando,
                ),
              ),
            )
          }
          type="button"
        >
          <Send size={14} /> Guardar y programar envío
        </button>
        {pendiente ? (
          <button
            className="boton boton-suave"
            disabled={pendienteAccion}
            onClick={() => {
              if (!window.confirm('¿Cancelar el envío programado? No saldrá ningún informe.'))
                return
              iniciar(async () => {
                const r = await cancelarInformeAccion()
                setEstado(r)
                if (r.ok) window.location.reload()
              })
            }}
            type="button"
          >
            <X size={14} /> Cancelar envío programado
          </button>
        ) : null}
        <Aviso estado={estado} />
      </div>
    </section>
  )
}
