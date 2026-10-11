'use client'

import { useActionState } from 'react'
import { guardarOrganizacionAccion, type Resultado } from '@/app/panel/acciones'
import { Aviso } from '@/components/ui/primitivos'
import type { Organizacion } from '@/types/database'

type Plan = { codigo: string; nombre: string; precio_mensual: number }

const GRUPOS: { titulo: string; campos: [keyof Organizacion, string][] }[] = [
  {
    titulo: 'Datos',
    campos: [
      ['nombre', 'Nombre'],
      ['rubro', 'Rubro'],
      ['especialista', 'Con quién se reúnen (ej. un abogado)'],
      ['ciudad', 'Ciudad'],
      ['color_primario', 'Color de marca'],
      ['logo_url', 'Logo (https)'],
    ],
  },
  {
    titulo: 'WhatsApp y Chatwoot',
    campos: [
      ['wa_numero', 'Número de WhatsApp'],
      ['wa_phone_number_id', 'Phone Number ID'],
      ['wa_waba_id', 'ID de la cuenta de WhatsApp (WABA)'],
      ['chatwoot_cuenta_id', 'Cuenta de Chatwoot'],
      ['chatwoot_bandeja_id', 'Bandeja de Chatwoot'],
      ['prefijo_plantillas', 'Prefijo de plantillas (ej. fagal_)'],
    ],
  },
  {
    titulo: 'Meta y Drive',
    campos: [
      ['meta_ad_account_id', 'Cuenta publicitaria'],
      ['meta_page_id', 'Página de Facebook'],
      ['meta_ig_id', 'Instagram'],
      ['pixel_id', 'Píxel'],
      ['drive_carpeta_id', 'Carpeta de creativos en Drive'],
    ],
  },
]

export function FormOrganizacion({ org, planes }: { org: Organizacion; planes: Plan[] }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(
    guardarOrganizacionAccion,
    {},
  )
  const id = (c: string) => `${org.id}-${c}`
  return (
    <form action={accion} className="flex flex-col gap-4 p-4">
      <input name="id" type="hidden" value={org.id} />
      <fieldset className="grid gap-3 sm:grid-cols-4">
        <legend className="mb-2 font-semibold text-sm">Plan y estado</legend>
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor={id('plan')}>Plan</label>
          <select
            className="campo"
            defaultValue={org.plan_codigo}
            id={id('plan')}
            name="plan_codigo"
          >
            {planes.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre} (${p.precio_mensual})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor={id('precio')}>Precio acordado (USD + IVA)</label>
          <input
            className="campo"
            defaultValue={org.precio_acordado ?? ''}
            id={id('precio')}
            name="precio_acordado"
            type="number"
          />
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor={id('estado')}>Estado</label>
          <select
            className="campo"
            defaultValue={org.estado_plan}
            id={id('estado')}
            name="estado_plan"
          >
            <option value="prueba">Prueba</option>
            <option value="activo">Activo (pagando)</option>
            <option value="restringido">Restringido (sin pago)</option>
            <option value="suspendido">Suspendido (sin agente ni CRM)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor={id('prueba')}>Prueba hasta</label>
          <input
            className="campo"
            defaultValue={org.prueba_hasta}
            id={id('prueba')}
            name="prueba_hasta"
            type="date"
          />
        </div>
      </fieldset>
      {GRUPOS.map((g) => (
        <fieldset className="grid gap-3 sm:grid-cols-3" key={g.titulo}>
          <legend className="mb-2 font-semibold text-sm">{g.titulo}</legend>
          {g.campos.map(([c, t]) => (
            <div className="flex flex-col gap-1 text-sm" key={c}>
              <label htmlFor={id(c)}>{t}</label>
              <input className="campo" defaultValue={String(org[c] ?? '')} id={id(c)} name={c} />
            </div>
          ))}
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          Guardar cliente
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  )
}
