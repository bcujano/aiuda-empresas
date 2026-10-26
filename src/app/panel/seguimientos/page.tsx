import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  CancelarSeguimiento,
  CrearPlantillas,
  FormSecuencia,
} from '@/components/panel/form-secuencia'
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
import { estadoPlantillas } from '@/server/plantillas'
import { colaSeguimientos, listarSecuencias } from '@/server/seguimientos-panel'

const ESTADO: Record<string, { texto: string; tono: 'aviso' | 'exito' | 'neutro' | 'peligro' }> = {
  pendiente: { texto: 'Programado', tono: 'aviso' },
  enviado: { texto: 'Enviado', tono: 'exito' },
  cancelado: { texto: 'Cancelado', tono: 'neutro' },
  fallido: { texto: 'Falló', tono: 'peligro' },
  sin_ventana: { texto: 'Sin ventana ni plantilla', tono: 'neutro' },
}

export default async function Seguimientos() {
  const sesion = await exigir('conocimiento')
  if (!sesion) redirect('/panel')
  const [secuencias, cola, plantillas] = await Promise.all([
    listarSecuencias(sesion.org.id),
    colaSeguimientos(sesion.org.id),
    estadoPlantillas(sesion.org),
  ])
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Seguimiento automático</h1>
        <p className="text-[var(--texto-suave)] text-sm">
          Mensajes que salen solos por WhatsApp según la situación de cada lead. Nunca escribimos
          primero: solo a quien ya conversó con nosotros.
        </p>
      </div>
      {secuencias.length === 0 ? (
        <Tarjeta>
          <Vacio mensaje="Este cliente todavía no tiene secuencias. Carga las de ejemplo con el SQL de seguimiento." />
        </Tarjeta>
      ) : (
        secuencias.map((s) => <FormSecuencia key={s.id} secuencia={s} />)
      )}
      <Tarjeta>
        <CabeceraTarjeta
          titulo="Plantillas de WhatsApp de este cliente"
          extra={
            <CrearPlantillas
              cuenta={`${sesion.org.nombre} · cuenta ${sesion.org.wa_waba_id ?? 'sin WABA'} · ${sesion.org.wa_numero ?? 'sin número'}`}
            />
          }
        />
        {plantillas.error ? (
          <p className="px-4 pt-3 text-[var(--peligro)] text-sm">{plantillas.error}</p>
        ) : null}
        <Tabla>
          <thead>
            <tr>
              <Th>Nombre en Meta</Th>
              <Th>Para qué</Th>
              <Th>Tipo</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {plantillas.lista.map((p) => (
              <tr key={p.nombre}>
                <Td className="font-mono text-xs">{p.nombre}</Td>
                <Td>{p.uso}</Td>
                <Td>{p.categoria === 'UTILITY' ? 'Utilidad' : 'Marketing'}</Td>
                <Td>
                  <Etiqueta
                    tono={
                      p.estado === 'APPROVED'
                        ? 'exito'
                        : p.estado === 'No existe' || p.estado === 'REJECTED'
                          ? 'peligro'
                          : 'aviso'
                    }
                  >
                    {p.estado === 'APPROVED'
                      ? 'Aprobada'
                      : p.estado === 'PENDING'
                        ? 'En revisión'
                        : p.estado === 'REJECTED'
                          ? 'Rechazada'
                          : p.estado}
                  </Etiqueta>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Tarjeta>

      <Tarjeta>
        <CabeceraTarjeta titulo="Últimos 100 seguimientos" />
        {cola.length === 0 ? (
          <Vacio mensaje="Aún no hay seguimientos. Aparecen cuando un lead deja de responder." />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Cuándo</Th>
                <Th>Lead</Th>
                <Th>Mensaje</Th>
                <Th>Estado</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {cola.map((f) => {
                const e = ESTADO[f.estado] ?? { texto: f.estado, tono: 'neutro' as const }
                return (
                  <tr key={f.id}>
                    <Td>{fechaHora(f.enviado_at ?? f.programado_at)}</Td>
                    <Td>
                      <Link className="hover:underline" href={`/panel/leads/${f.lead.id}`}>
                        {f.lead.empresa ?? f.lead.nombre ?? f.lead.telefono}
                      </Link>
                    </Td>
                    <Td className="max-w-md truncate">{f.texto}</Td>
                    <Td>
                      <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>
                    </Td>
                    <Td>{f.estado === 'pendiente' ? <CancelarSeguimiento id={f.id} /> : null}</Td>
                  </tr>
                )
              })}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  )
}
