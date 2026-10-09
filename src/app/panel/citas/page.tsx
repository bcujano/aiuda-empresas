import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CabeceraTarjeta,
  Etiqueta,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '@/components/ui/primitivos'
import { exigir } from '@/lib/auth'
import { fechaHora } from '@/lib/formato'
import { proximasCitas } from '@/server/citas-y-angulos'

export default async function Citas() {
  const sesion = await exigir('citas')
  if (!sesion) redirect('/panel')
  const citas = await proximasCitas(sesion.org.id)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl tracking-tight">Citas</h1>
      <Tarjeta>
        <CabeceraTarjeta titulo="Próximas reuniones" />
        {citas.length === 0 ? (
          <Vacio mensaje="No hay reuniones agendadas. El agente las agenda cuando un lead califica." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Fecha y hora</Th>
                <Th>Empresa / contacto</Th>
                <Th>Modalidad</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id}>
                  <Td>{fechaHora(c.inicia_at)}</Td>
                  <Td>
                    <Link
                      className="font-medium hover:underline"
                      href={`/panel/leads/${c.lead.id}`}
                    >
                      {c.lead.empresa ?? c.lead.nombre ?? c.lead.telefono}
                    </Link>
                  </Td>
                  <Td>{c.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}</Td>
                  <Td>
                    <Etiqueta>{c.estado}</Etiqueta>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  )
}
