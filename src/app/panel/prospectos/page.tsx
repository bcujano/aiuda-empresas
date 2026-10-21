import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Descargas } from '@/components/panel/descargas'
import { AccionesProspecto, FormCampana, FormLista } from '@/components/panel/form-prospectos'
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
import { fechaHora } from '@/lib/formato'
import { listarAngulos } from '@/server/citas-y-angulos'
import {
  campanaDe,
  type EstadoProspecto,
  estadoDe,
  listarProspectos,
} from '@/server/prospectos-panel'

const TEXTO: Record<EstadoProspecto, string> = {
  pendiente: 'Por contactar',
  contactado: 'Contactado',
  respondio: 'Respondió',
  baja: 'Baja',
  sin_canal: 'Solo teléfono fijo',
}
const TONO: Record<EstadoProspecto, 'neutro' | 'exito' | 'aviso' | 'peligro'> = {
  pendiente: 'neutro',
  contactado: 'aviso',
  respondio: 'exito',
  baja: 'peligro',
  sin_canal: 'neutro',
}

export default async function Prospectos({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>
}) {
  const sesion = await exigir('prospectos')
  if (!sesion) redirect('/panel')
  const { estado, q } = await searchParams
  const [todos, campana, angulos] = await Promise.all([
    listarProspectos(sesion.org.id),
    campanaDe(sesion.org.id),
    listarAngulos(sesion.org.id),
  ])
  const conEstado = todos.map((p) => ({ p, e: estadoDe(p) }))
  const cuenta = (e: EstadoProspecto) => conEstado.filter((x) => x.e === e).length
  const buscado = (q ?? '').toLowerCase()
  const vistos = conEstado
    .filter((x) => !estado || x.e === estado)
    .filter(
      (x) => !buscado || `${x.p.nombre} ${x.p.segmento ?? ''}`.toLowerCase().includes(buscado),
    )
  const edita = sesion.usuario.rol !== 'operador'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Prospectos</h1>
          <p className="text-[var(--texto-suave)] text-sm">
            Empresas a las que se les escribe primero, con datos públicos. Quien responde pasa al
            agente y aparece en Leads.
          </p>
        </div>
        {permite(sesion, 'exportar') ? (
          <Descargas tipos={[{ tipo: 'prospectos', texto: 'Prospectos (Excel)' }]} />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(TEXTO) as EstadoProspecto[]).map((e) => (
          <Link
            className={`tarjeta p-3 ${estado === e ? 'ring-2 ring-[var(--primario)]' : ''}`}
            href={estado === e ? '/panel/prospectos' : `/panel/prospectos?estado=${e}`}
            key={e}
          >
            <p className="font-bold text-2xl tabular-nums">{cuenta(e)}</p>
            <p className="text-[var(--texto-suave)] text-xs">{TEXTO[e]}</p>
          </Link>
        ))}
      </div>

      {edita ? (
        <Tarjeta>
          <CabeceraTarjeta
            extra={
              campana ? (
                <Etiqueta tono={campana.activa ? 'exito' : 'aviso'}>
                  {campana.activa ? 'Encendida' : 'Apagada'}
                </Etiqueta>
              ) : null
            }
            titulo="Campaña de contacto en frío"
          />
          {campana ? (
            <FormCampana c={campana} />
          ) : (
            <Vacio mensaje="Este cliente aún no tiene campaña. Se crea con el SQL de contacto en frío." />
          )}
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <CabeceraTarjeta titulo={`Lista (${vistos.length} de ${todos.length})`} />
        <form className="flex gap-2 p-3">
          <input
            className="campo"
            defaultValue={q}
            name="q"
            placeholder="Buscar empresa o sector…"
          />
          {estado ? <input name="estado" type="hidden" value={estado} /> : null}
          <button className="boton boton-suave" type="submit">
            Buscar
          </button>
        </form>
        {vistos.length === 0 ? (
          <Vacio mensaje="No hay prospectos con ese filtro." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Empresa</Th>
                <Th>Contacto</Th>
                <Th>Estado</Th>
                <Th>Último envío</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {vistos.map(({ p, e }) => (
                <tr key={p.id}>
                  <Td>
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-[var(--texto-suave)] text-xs">{p.segmento}</p>
                  </Td>
                  <Td>
                    <p className="text-xs">{p.telefono_wa ?? p.telefono ?? '—'}</p>
                    <p className="text-[var(--texto-suave)] text-xs">{p.email ?? ''}</p>
                  </Td>
                  <Td>
                    <Etiqueta tono={TONO[e]}>{TEXTO[e]}</Etiqueta>
                    {p.error ? (
                      <p className="mt-1 text-[var(--peligro)] text-xs">
                        Falló: {p.error.slice(0, 60)}
                      </p>
                    ) : null}
                  </Td>
                  <Td className="text-xs" orden={p.whatsapp_at ?? p.email_at ?? ''}>
                    {p.whatsapp_at ? <p>WhatsApp {fechaHora(p.whatsapp_at)}</p> : null}
                    {p.email_at ? <p>Correo {fechaHora(p.email_at)}</p> : null}
                  </Td>
                  <Td>
                    {edita ? (
                      <AccionesProspecto baja={Boolean(p.baja_at)} id={p.id} nombre={p.nombre} />
                    ) : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      {edita ? (
        <Tarjeta>
          <CabeceraTarjeta titulo="Agregar prospectos" />
          <FormLista angulos={angulos.map((a) => ({ codigo: a.codigo, servicio: a.servicio }))} />
        </Tarjeta>
      ) : null}
    </div>
  )
}
