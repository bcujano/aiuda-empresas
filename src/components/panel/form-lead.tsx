'use client'

import { Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import { borrarLeadAccion, crearLeadAccion, editarLeadAccion } from '@/app/panel/leads/acciones'
import { Aviso, BotonAccion } from '@/components/ui/primitivos'
import { COLABORADORES, type Lead } from '@/types/database'

function Campo({
  nombre,
  texto,
  valor,
  area,
}: {
  nombre: string
  texto: string
  valor: string | null
  area?: boolean
}) {
  const id = `lead-${nombre}`
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="font-medium" htmlFor={id}>
        {texto}
      </label>
      {area ? (
        <textarea className="campo min-h-20" defaultValue={valor ?? ''} id={id} name={nombre} />
      ) : (
        <input className="campo" defaultValue={valor ?? ''} id={id} name={nombre} />
      )}
    </div>
  )
}

export function FormEditarLead({ lead, puedeBorrar }: { lead: Lead; puedeBorrar: boolean }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(editarLeadAccion, {})
  return (
    <form action={accion} className="grid gap-3 p-4 sm:grid-cols-2">
      <input name="id" type="hidden" value={lead.id} />
      <Campo nombre="nombre" texto="Contacto" valor={lead.nombre} />
      <Campo nombre="empresa" texto="Empresa" valor={lead.empresa} />
      <Campo nombre="cargo" texto="Cargo" valor={lead.cargo} />
      <Campo nombre="ruc" texto="RUC" valor={lead.ruc} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Colaboradores</span>
        <select className="campo" defaultValue={lead.colaboradores ?? ''} name="colaboradores">
          <option value="">—</option>
          {COLABORADORES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <Campo nombre="ciudad" texto="Ciudad" valor={lead.ciudad} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Urgencia</span>
        <select className="campo" defaultValue={lead.urgencia ?? ''} name="urgencia">
          <option value="">—</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </label>
      <label className="flex items-center gap-2 self-end text-sm">
        <input defaultChecked={lead.no_contactar} name="no_contactar" type="checkbox" />
        No contactar (sin seguimiento automático)
      </label>
      <div className="sm:col-span-2">
        <Campo area nombre="necesidad" texto="Necesidad" valor={lead.necesidad} />
      </div>
      <div className="sm:col-span-2">
        <Campo area nombre="notas" texto="Notas internas" valor={lead.notas} />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          Guardar cambios
        </button>
        {puedeBorrar ? (
          <BotonAccion
            confirmacion="¿Borrar este lead con sus reuniones, mensajes y seguimientos? No se puede deshacer."
            icono={<Trash2 size={14} />}
            onEjecutar={() => borrarLeadAccion(lead.id)}
            texto="Borrar lead"
            variante="peligro"
          />
        ) : null}
        <Aviso estado={estado} />
      </div>
    </form>
  )
}

export function FormNuevoLead() {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(crearLeadAccion, {})
  return (
    <form action={accion} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <Campo nombre="telefono" texto="WhatsApp" valor={null} />
      <Campo nombre="nombre" texto="Contacto" valor={null} />
      <Campo nombre="empresa" texto="Empresa" valor={null} />
      <button className="boton boton-primario" disabled={pendiente} type="submit">
        Crear lead
      </button>
      <div className="sm:col-span-4">
        <Aviso estado={estado} />
      </div>
    </form>
  )
}
