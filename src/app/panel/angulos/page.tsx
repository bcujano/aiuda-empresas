import { redirect } from 'next/navigation'
import { CabeceraTarjeta, Etiqueta, Tarjeta, Vacio } from '@/components/ui/primitivos'
import { exigir } from '@/lib/auth'
import { referencia } from '@/lib/whatsapp'
import { listarAngulos } from '@/server/citas-y-angulos'

export default async function Angulos() {
  const sesion = await exigir('angulos')
  if (!sesion) redirect('/panel')
  const angulos = await listarAngulos(sesion.org.id)
  const org = sesion.org

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Ángulos</h1>
        <p className="mt-1 text-[var(--texto-suave)] text-sm">
          Cada ángulo es un servicio con su propio anuncio y su propia landing. El que consigue
          reuniones más baratas se queda; el peor se reemplaza.
        </p>
      </div>
      {angulos.length === 0 ? (
        <Tarjeta>
          <Vacio mensaje="Este cliente todavía no tiene ángulos cargados." />
        </Tarjeta>
      ) : (
        angulos.map((a) => (
          <Tarjeta key={a.id}>
            <CabeceraTarjeta
              titulo={a.servicio}
              extra={
                <span className="flex gap-1">
                  <Etiqueta>Ref. {referencia(org.codigo, a.codigo)}</Etiqueta>
                  <Etiqueta tono={a.activo ? 'exito' : 'neutro'}>
                    {a.activo ? 'Activo' : 'Pausado'}
                  </Etiqueta>
                </span>
              }
            />
            <div className="grid gap-3 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[var(--texto-suave)] text-xs">Titular</p>
                <p className="font-medium">{a.titular}</p>
                <p className="mt-2 text-[var(--texto-suave)] text-xs">Landing</p>
                {org.wa_numero ? (
                  <a
                    className="text-[var(--primario)] hover:underline"
                    href={`/${org.slug}/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    /{org.slug}/{a.slug}
                  </a>
                ) : (
                  <p>Se publica cuando el cliente tenga su número de WhatsApp conectado.</p>
                )}
              </div>
              <div>
                <p className="text-[var(--texto-suave)] text-xs">Dolores que ataca</p>
                <ul className="list-disc pl-4">
                  {a.dolores.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Tarjeta>
        ))
      )}
    </div>
  )
}
