'use client'

import { useActionState, useEffect } from 'react'
import { crearCitaAccion } from '@/app/panel/citas/acciones'
import { Aviso, type Resultado } from '@/components/ui/primitivos'
import { etiquetaHora } from '@/lib/agenda'

export function NuevaCita({
  inicia,
  leads,
  modalidades,
  onCerrar,
  onCreada,
}: {
  inicia: string
  leads: { id: string; nombre: string | null; empresa: string | null; telefono: string }[]
  modalidades: string[]
  onCerrar: () => void
  onCreada: () => void
}) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(crearCitaAccion, {})
  useEffect(() => {
    if (estado.ok) onCreada()
  }, [estado, onCreada])

  return (
    <form action={accion} className="flex flex-col gap-3 p-5">
      <p className="font-semibold">Nueva reunión</p>
      <p className="text-[var(--texto-suave)] text-sm">{etiquetaHora(inicia)}</p>
      <input name="inicia" type="hidden" value={inicia} />
      <label className="font-medium text-sm" htmlFor="lead_id">
        Con quién
      </label>
      <select className="campo" id="lead_id" name="lead_id" required>
        <option value="">Elige un lead…</option>
        {leads.map((l) => (
          <option key={l.id} value={l.id}>
            {[l.empresa, l.nombre].filter(Boolean).join(' · ') || l.telefono}
          </option>
        ))}
      </select>
      <label className="font-medium text-sm" htmlFor="modalidad">
        Modalidad
      </label>
      <select className="campo" id="modalidad" name="modalidad">
        {modalidades.map((m) => (
          <option key={m} value={m}>
            {m === 'virtual' ? 'Virtual' : 'Presencial'}
          </option>
        ))}
      </select>
      <label className="font-medium text-sm" htmlFor="notas">
        Notas (opcional)
      </label>
      <textarea className="campo min-h-20" id="notas" name="notas" />
      <p className="text-[var(--texto-suave)] text-xs">
        Queda confirmada y se le avisa al cliente por WhatsApp.
      </p>
      <div className="flex gap-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          Agendar
        </button>
        <button className="boton boton-suave" onClick={onCerrar} type="button">
          Cerrar
        </button>
      </div>
      <Aviso estado={estado} />
    </form>
  )
}
