import { redirect } from 'next/navigation'
import { elegirOrganizacion } from '@/app/panel/acciones'
import { FormNuevaOrganizacion } from '@/components/panel/formularios'
import {
  CabeceraTarjeta,
  Etiqueta,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '@/components/ui/primitivos'
import { verifyAuth } from '@/lib/auth'
import { fecha, hoyQuito } from '@/lib/formato'
import { puede } from '@/lib/permisos'
import { estadoEfectivo, PLAN_LEGIBLE } from '@/lib/planes'
import { listarOrganizaciones } from '@/server/organizaciones'

const TONO_PLAN = {
  prueba: 'neutro',
  activo: 'exito',
  restringido: 'aviso',
  suspendido: 'peligro',
} as const

export default async function Organizaciones() {
  const sesion = await verifyAuth()
  if (!sesion || !puede(sesion.usuario.rol, 'organizaciones')) redirect('/panel')
  const organizaciones = await listarOrganizaciones()
  const hoy = hoyQuito()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl tracking-tight">Clientes</h1>

      <Tarjeta>
        <CabeceraTarjeta titulo="Todos los clientes" />
        {organizaciones.length === 0 ? (
          <Vacio mensaje="Todavía no hay clientes. Crea el primero abajo." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Cliente</Th>
                <Th>Plan</Th>
                <Th>Prueba hasta</Th>
                <Th>WhatsApp</Th>
                <Th>Landing</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {organizaciones.map((o) => {
                const estado = estadoEfectivo(o, hoy)
                return (
                  <tr key={o.id}>
                    <Td>
                      <p className="font-medium">{o.nombre}</p>
                      <p className="text-[var(--texto-suave)] text-xs">
                        {o.rubro} · {o.codigo}
                      </p>
                    </Td>
                    <Td>
                      <Etiqueta tono={TONO_PLAN[estado]}>{PLAN_LEGIBLE[estado]}</Etiqueta>
                    </Td>
                    <Td>{fecha(o.prueba_hasta)}</Td>
                    <Td>
                      {o.wa_numero ?? (
                        <span className="text-[var(--texto-suave)]">Sin conectar</span>
                      )}
                    </Td>
                    <Td>/{o.slug}</Td>
                    <Td>
                      <form action={elegirOrganizacion}>
                        <input name="organizacion_id" type="hidden" value={o.id} />
                        <button className="boton boton-suave" type="submit">
                          Entrar
                        </button>
                      </form>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta titulo="Nuevo cliente" />
        <div className="p-4">
          <FormNuevaOrganizacion />
        </div>
      </Tarjeta>
    </div>
  )
}
