'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import {
  cancelarSeguimientoAccion,
  crearPlantillasAccion,
  guardarSecuenciaAccion,
} from '@/app/panel/seguimientos/acciones'
import { Aviso, BotonAccion } from '@/components/ui/primitivos'
import type { Paso } from '@/lib/seguimientos'
import type { Secuencia } from '@/server/seguimientos-panel'

const DESCRIPCION: Record<string, string> = {
  sin_respuesta: 'Se activa cuando el asistente respondió y la persona dejó de contestar.',
  calificado_sin_cita: 'Se activa cuando el lead calificó pero todavía no eligió hora.',
  no_asistio: 'Se activa cuando marcas en la agenda que no asistió.',
}

function cuando(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  if (minutos < 1440) return `${Math.round(minutos / 60)} h`
  return `${Math.round(minutos / 1440)} d`
}

export function FormSecuencia({ secuencia }: { secuencia: Secuencia }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(
    guardarSecuenciaAccion,
    {},
  )
  const [pasos, setPasos] = useState<(Paso & { clave: string })[]>(() =>
    secuencia.pasos.map((p) => ({ ...p, clave: crypto.randomUUID() })),
  )
  return (
    <form action={accion} className="tarjeta flex flex-col gap-4 p-5">
      <input name="id" type="hidden" value={secuencia.id} />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{secuencia.nombre}</h2>
          <p className="text-[var(--texto-suave)] text-sm">{DESCRIPCION[secuencia.codigo]}</p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input defaultChecked={secuencia.activa} name="activa" type="checkbox" />
          Activa
        </label>
      </header>
      {pasos.map((p, i) => (
        <div
          className="grid gap-2 rounded-lg border border-[var(--borde)] p-3 sm:grid-cols-[120px_1fr_200px_auto]"
          key={p.clave}
        >
          <label className="flex flex-col gap-1 text-xs">
            Después de (min) · {cuando(p.minutos)}
            <input
              className="campo"
              defaultValue={p.minutos}
              min={5}
              name="minutos"
              type="number"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Mensaje (dentro de la ventana gratis)
            <textarea className="campo min-h-16" defaultValue={p.texto} name="texto" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Plantilla si la ventana se cerró
            <input
              className="campo"
              defaultValue={p.plantilla ?? ''}
              name="plantilla"
              placeholder="sin plantilla: no se envía"
            />
          </label>
          <button
            aria-label="Quitar paso"
            className="self-end p-2 text-[var(--peligro)]"
            onClick={() => setPasos(pasos.filter((_, j) => j !== i))}
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <p className="text-[var(--texto-suave)] text-xs">
        Variables: {'{nombre}'} {'{organizacion}'} {'{especialista}'} {'{servicio}'}. Solo se envía
        de 08:00 a 20:00 y se cancela si la persona responde, agenda, es descartada o escribe
        «baja».
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="boton boton-suave"
          disabled={pasos.length >= 6}
          onClick={() =>
            setPasos([
              ...pasos,
              { minutos: 1440, texto: '', plantilla: null, clave: crypto.randomUUID() },
            ])
          }
          type="button"
        >
          <Plus size={14} /> Agregar paso
        </button>
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          Guardar
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  )
}

export function CancelarSeguimiento({ id }: { id: string }) {
  return (
    <BotonAccion
      confirmacion="¿Cancelar este seguimiento?"
      onEjecutar={() => cancelarSeguimientoAccion(id)}
      texto="Cancelar"
    />
  )
}

export function CrearPlantillas() {
  return (
    <BotonAccion
      onEjecutar={crearPlantillasAccion}
      texto="Crear en Meta las que faltan"
      variante="primario"
    />
  )
}
