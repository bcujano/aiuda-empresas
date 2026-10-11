'use client'

import { Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import { borrarAnguloAccion, guardarAnguloAccion } from '@/app/panel/angulos/acciones'
import { Aviso, BotonAccion } from '@/components/ui/primitivos'
import type { Angulo } from '@/types/database'

const CAMPOS: { n: keyof Angulo; t: string; area?: boolean; ayuda?: string }[] = [
  { n: 'servicio', t: 'Servicio' },
  { n: 'codigo', t: 'Código de referencia', ayuda: 'Va en el mensaje: Ref. ORG-CÓDIGO' },
  {
    n: 'slug',
    t: 'Dirección de la landing',
    ayuda: 'aiuda-empresas.vercel.app/cliente/esta-direccion',
  },
  { n: 'orden', t: 'Orden' },
  { n: 'titular', t: 'Titular (el resultado que gana)', area: true },
  { n: 'subtitulo', t: 'Subtítulo', area: true },
  { n: 'dolores', t: 'Dolores (uno por línea)', area: true },
  { n: 'para_quien', t: 'Para quién es (uno por línea)', area: true },
  { n: 'no_para_quien', t: 'Para quién no es (uno por línea)', area: true },
  { n: 'preguntas', t: 'Preguntas (una por línea: pregunta | respuesta)', area: true },
  { n: 'mensaje_whatsapp', t: 'Mensaje que se envía al tocar WhatsApp', area: true },
  { n: 'meta_ad_ids', t: 'IDs de anuncios de Meta (uno por línea)', area: true },
]

function valor(a: Angulo | null, n: keyof Angulo): string {
  if (!a) return n === 'orden' ? '0' : ''
  const v = a[n]
  if (n === 'preguntas') return a.preguntas.map((p) => `${p.pregunta} | ${p.respuesta}`).join('\n')
  if (Array.isArray(v)) return v.join('\n')
  return String(v ?? '')
}

export function FormAngulo({ angulo }: { angulo: Angulo | null }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(guardarAnguloAccion, {})
  const pre = angulo?.id ?? 'nuevo'
  return (
    <form action={accion} className="grid gap-3 p-4 sm:grid-cols-2">
      <input name="id" type="hidden" value={angulo?.id ?? ''} />
      {CAMPOS.map((c) => (
        <div className={`flex flex-col gap-1 text-sm ${c.area ? 'sm:col-span-2' : ''}`} key={c.n}>
          <label className="font-medium" htmlFor={`${pre}-${c.n}`}>
            {c.t}
          </label>
          {c.area ? (
            <textarea
              className="campo min-h-20"
              defaultValue={valor(angulo, c.n)}
              id={`${pre}-${c.n}`}
              name={c.n}
            />
          ) : (
            <input
              className="campo"
              defaultValue={valor(angulo, c.n)}
              id={`${pre}-${c.n}`}
              name={c.n}
            />
          )}
          {c.ayuda ? <span className="text-[var(--texto-suave)] text-xs">{c.ayuda}</span> : null}
        </div>
      ))}
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={angulo?.activo ?? true} name="activo" type="checkbox" />
        Activo (se muestra la landing y el agente lo ofrece)
      </label>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          {angulo ? 'Guardar ángulo' : 'Crear ángulo'}
        </button>
        {angulo ? (
          <BotonAccion
            confirmacion="¿Borrar este ángulo? Si ya trajo leads, solo se pausa."
            icono={<Trash2 size={14} />}
            onEjecutar={() => borrarAnguloAccion(angulo.id)}
            texto="Borrar"
            variante="peligro"
          />
        ) : null}
        <Aviso estado={estado} />
      </div>
    </form>
  )
}
