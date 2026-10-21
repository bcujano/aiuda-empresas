import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Descargas } from '@/components/panel/descargas'
import { FormNuevoLead } from '@/components/panel/form-lead'
import {
  CabeceraTarjeta,
  Etiqueta,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '@/components/ui/primitivos'
import { exigir, permite } from '@/lib/auth'
import { ETAPA_LEGIBLE, fechaHora } from '@/lib/formato'
import { listarAngulos } from '@/server/citas-y-angulos'
import { buscarLeads } from '@/server/leads-edicion'
import { ETAPAS } from '@/types/database'

export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; etapa?: string; angulo?: string }>
}) {
  const sesion = await exigir('leads')
  if (!sesion) redirect('/panel')
  const filtro = await searchParams
  const [leads, angulos] = await Promise.all([
    buscarLeads(sesion.org.id, filtro),
    listarAngulos(sesion.org.id),
  ])
  const servicio = new Map(angulos.map((a) => [a.id, a.servicio]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Leads</h1>
          <p className="text-[var(--texto-suave)] text-sm">
            {leads.length} resultados (máximo 300 por búsqueda)
          </p>
        </div>
        {permite(sesion, 'exportar') ? (
          <Descargas
            tipos={[
              { tipo: 'leads', texto: 'Leads' },
              { tipo: 'citas', texto: 'Reuniones' },
              { tipo: 'actividad', texto: 'Conversaciones' },
              { tipo: 'seguimientos', texto: 'Seguimientos' },
            ]}
          />
        ) : null}
      </div>

      <Tarjeta>
        <form className="grid gap-3 p-4 sm:grid-cols-[1fr_200px_220px_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-sm" htmlFor="q">
            <span className="font-medium">Buscar</span>
            <input
              className="campo"
              defaultValue={filtro.q ?? ''}
              id="q"
              name="q"
              placeholder="Nombre, empresa, teléfono o necesidad"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm" htmlFor="etapa">
            <span className="font-medium">Etapa</span>
            <select className="campo" defaultValue={filtro.etapa ?? ''} id="etapa" name="etapa">
              <option value="">Todas</option>
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {ETAPA_LEGIBLE[e]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm" htmlFor="angulo">
            <span className="font-medium">Servicio</span>
            <select className="campo" defaultValue={filtro.angulo ?? ''} id="angulo" name="angulo">
              <option value="">Todos</option>
              {angulos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.servicio}
                </option>
              ))}
              <option value="sin">Sin servicio</option>
            </select>
          </label>
          <button className="boton boton-primario" type="submit">
            Filtrar
          </button>
        </form>
      </Tarjeta>

      <Tarjeta>
        {leads.length === 0 ? (
          <Vacio mensaje="No hay leads con ese filtro." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Empresa / contacto</Th>
                <Th>Servicio</Th>
                <Th>Etapa</Th>
                <Th>Último movimiento</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <Td>
                    <Link className="font-medium hover:underline" href={`/panel/leads/${l.id}`}>
                      {l.empresa ?? l.nombre ?? l.telefono}
                    </Link>
                    {l.empresa && l.nombre ? (
                      <span className="block text-[var(--texto-suave)] text-xs">{l.nombre}</span>
                    ) : null}
                  </Td>
                  <Td>{(l.angulo_id && servicio.get(l.angulo_id)) || '—'}</Td>
                  <Td>
                    <Etiqueta>{ETAPA_LEGIBLE[l.etapa]}</Etiqueta>
                    {l.no_contactar ? <Etiqueta tono="peligro">No contactar</Etiqueta> : null}
                  </Td>
                  <Td orden={l.updated_at}>{fechaHora(l.updated_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta titulo="Agregar un lead a mano" />
        <FormNuevoLead />
      </Tarjeta>
    </div>
  )
}
