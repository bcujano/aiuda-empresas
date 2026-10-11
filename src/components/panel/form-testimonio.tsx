'use client'

import { Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import { borrarTestimonioAccion, guardarTestimonioAccion } from '@/app/panel/testimonios/acciones'
import { Aviso, BotonAccion } from '@/components/ui/primitivos'
import type { FilaTestimonio } from '@/server/testimonios'

/** Crear o editar una reseña de la landing de Aiuda. */
export function FormTestimonio({ t }: { t?: FilaTestimonio }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(
    guardarTestimonioAccion,
    {},
  )
  const id = (c: string) => `${t?.id ?? 'nuevo'}-${c}`
  const campo = (c: keyof FilaTestimonio, texto: string, tipo = 'text') => (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id(c)}>{texto}</label>
      <input
        className="campo"
        defaultValue={String(t?.[c] ?? '')}
        id={id(c)}
        name={c}
        type={tipo}
      />
    </div>
  )
  return (
    <form action={accion} className="flex flex-col gap-3 p-4">
      <input name="id" type="hidden" value={t?.id ?? ''} />
      <div className="grid gap-3 sm:grid-cols-3">
        {campo('autor', 'Nombre de quien opina')}
        {campo('cargo', 'Cargo')}
        {campo('empresa', 'Empresa')}
        {campo('foto_url', 'Foto (https, opcional)')}
        {campo('calificacion', 'Estrellas (1 a 5, opcional)', 'number')}
        {campo('orden', 'Orden', 'number')}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor={id('texto')}>Reseña, con sus palabras</label>
        <textarea
          className="campo min-h-24"
          defaultValue={t?.texto ?? ''}
          id={id('texto')}
          name="texto"
        />
      </div>
      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input defaultChecked={t?.autorizado ?? false} name="autorizado" type="checkbox" />
          El autor autorizó publicarla por escrito
        </label>
        <label className="flex items-center gap-2">
          <input defaultChecked={t?.visible ?? true} name="visible" type="checkbox" />
          Mostrar en la landing
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          {t ? 'Guardar reseña' : 'Agregar reseña'}
        </button>
        <Aviso estado={estado} />
        {t ? (
          <BotonAccion
            confirmacion={`¿Borrar la reseña de ${t.autor}? No se puede deshacer.`}
            icono={<Trash2 size={14} />}
            onEjecutar={() => borrarTestimonioAccion(t.id)}
            texto="Borrar"
            variante="peligro"
          />
        ) : null}
      </div>
    </form>
  )
}
