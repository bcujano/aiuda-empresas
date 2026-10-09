'use client'

import { Loader2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import {
  agregarNotaAccion,
  cambiarEtapaAccion,
  crearOrganizacionAccion,
  type Resultado,
} from '@/app/panel/acciones'
import { Aviso } from '@/components/ui/primitivos'
import { ETAPA_LEGIBLE } from '@/lib/formato'
import { ETAPAS, type Etapa } from '@/types/database'

const INICIAL: Resultado = {}

function Enviar({ pendiente, texto }: { pendiente: boolean; texto: string }) {
  return (
    <button className="boton boton-primario" disabled={pendiente} type="submit">
      {pendiente ? <Loader2 className="animate-spin" size={14} /> : null}
      {texto}
    </button>
  )
}

export function FormEtapa({ leadId, etapa }: { leadId: string; etapa: Etapa }) {
  const [estado, accion, pendiente] = useActionState(cambiarEtapaAccion, INICIAL)
  const [elegida, setElegida] = useState<Etapa>(etapa)
  return (
    <form action={accion} className="flex flex-col gap-3">
      <input name="lead_id" type="hidden" value={leadId} />
      <label className="font-medium text-sm" htmlFor="etapa">
        Etapa
      </label>
      <select
        className="campo"
        id="etapa"
        name="etapa"
        onChange={(e) => setElegida(e.target.value as Etapa)}
        value={elegida}
      >
        {ETAPAS.map((e) => (
          <option key={e} value={e}>
            {ETAPA_LEGIBLE[e]}
          </option>
        ))}
      </select>
      {elegida === 'descartado' ? (
        <input className="campo" name="motivo" placeholder="¿Por qué se descarta?" required />
      ) : null}
      <div>
        <Enviar pendiente={pendiente} texto="Guardar etapa" />
      </div>
      <Aviso estado={estado} />
    </form>
  )
}

export function FormNota({ leadId }: { leadId: string }) {
  const [estado, accion, pendiente] = useActionState(agregarNotaAccion, INICIAL)
  return (
    <form action={accion} className="flex flex-col gap-3">
      <input name="lead_id" type="hidden" value={leadId} />
      <label className="font-medium text-sm" htmlFor="nota">
        Nota interna
      </label>
      <textarea className="campo min-h-20" id="nota" name="nota" required />
      <div>
        <Enviar pendiente={pendiente} texto="Guardar nota" />
      </div>
      <Aviso estado={estado} />
    </form>
  )
}

const CAMPOS_ORG = [
  { nombre: 'nombre', texto: 'Nombre del cliente', ayuda: 'Fagal Abogados' },
  { nombre: 'rubro', texto: 'Rubro', ayuda: 'Estudio jurídico' },
  { nombre: 'slug', texto: 'Dirección de su landing', ayuda: 'fagal' },
  { nombre: 'codigo', texto: 'Código de referencia (2 a 5 letras)', ayuda: 'FAG' },
  { nombre: 'ciudad', texto: 'Ciudad (opcional)', ayuda: 'Quito' },
] as const

export function FormNuevaOrganizacion() {
  const [estado, accion, pendiente] = useActionState(crearOrganizacionAccion, INICIAL)
  return (
    <form action={accion} className="grid gap-3 sm:grid-cols-2">
      {CAMPOS_ORG.map((c) => (
        <div className="flex flex-col gap-1.5" key={c.nombre}>
          <label className="font-medium text-sm" htmlFor={c.nombre}>
            {c.texto}
          </label>
          <input
            className="campo"
            id={c.nombre}
            name={c.nombre}
            placeholder={c.ayuda}
            required={c.nombre !== 'ciudad'}
          />
        </div>
      ))}
      <div className="flex items-end">
        <Enviar pendiente={pendiente} texto="Crear cliente" />
      </div>
      <div className="sm:col-span-2">
        <Aviso estado={estado} />
      </div>
    </form>
  )
}
