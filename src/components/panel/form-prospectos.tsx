'use client'

import { Ban, Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import {
  agregarProspectosAccion,
  cambiarProspectoAccion,
  guardarCampanaAccion,
} from '@/app/panel/prospectos/acciones'
import { Aviso, BotonAccion } from '@/components/ui/primitivos'
import type { Campana } from '@/server/prospectos-panel'

export function FormCampana({ c }: { c: Campana }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarCampanaAccion, {})
  return (
    <form action={accion} className="flex flex-col gap-3 p-4">
      <label className="flex items-center gap-2 font-medium text-sm">
        <input defaultChecked={c.activa} name="activa" type="checkbox" />
        Campaña encendida (solo envía si la plantilla de WhatsApp ya está aprobada por Meta)
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="por_dia">Mensajes por día y por canal</label>
          <input
            className="campo"
            defaultValue={c.por_dia}
            id="por_dia"
            name="por_dia"
            type="number"
          />
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="plantilla">Plantilla de WhatsApp (sin el prefijo)</label>
          <input className="campo" defaultValue={c.plantilla} id="plantilla" name="plantilla" />
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="dias_correo">Días antes del correo (si recibió WhatsApp)</label>
          <input
            className="campo"
            defaultValue={c.dias_correo}
            id="dias_correo"
            name="dias_correo"
            type="number"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="asunto">Asunto del correo</label>
        <input className="campo" defaultValue={c.asunto} id="asunto" name="asunto" />
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="cuerpo">
          Texto del correo. Variables: {'{empresa} {segmento} {organizacion} {enlace} {baja}'}
        </label>
        <textarea className="campo min-h-40" defaultValue={c.cuerpo} id="cuerpo" name="cuerpo" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          Guardar campaña
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  )
}

export function FormLista() {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(
    agregarProspectosAccion,
    {},
  )
  return (
    <form action={accion} className="flex flex-col gap-3 p-4">
      <label className="text-sm" htmlFor="lista">
        Una empresa por línea: <b>Empresa; teléfono; correo; sector</b> (solo la empresa es
        obligatoria). Puedes pegar desde Excel.
      </label>
      <textarea
        className="campo min-h-32"
        id="lista"
        name="lista"
        placeholder="Constructora Andes; 099 123 4567; info@andes.com; constructoras"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          Agregar prospectos
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  )
}

export function AccionesProspecto({
  id,
  nombre,
  baja,
}: {
  id: string
  nombre: string
  baja: boolean
}) {
  return (
    <span className="flex flex-wrap gap-1">
      {baja ? null : (
        <BotonAccion
          confirmacion={`¿Marcar a ${nombre} como baja? No se le volverá a escribir.`}
          icono={<Ban size={14} />}
          onEjecutar={() => cambiarProspectoAccion(id, 'baja')}
          texto="Baja"
        />
      )}
      <BotonAccion
        confirmacion={`¿Borrar a ${nombre}? No se puede deshacer.`}
        icono={<Trash2 size={14} />}
        onEjecutar={() => cambiarProspectoAccion(id, 'borrar')}
        texto="Borrar"
        variante="peligro"
      />
    </span>
  )
}
