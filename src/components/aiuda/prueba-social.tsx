import { Quote, Star } from 'lucide-react'
import type { CasoCliente, PruebaSocial as Datos } from '@/server/landing-aiuda'

/**
 * Clientes y reseñas reales. Los números de cada caso salen del CRM del
 * cliente en el momento; si aún no hay suficientes, se dice «resultados en
 * curso». Sin testimonios autorizados, esa parte no aparece.
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const mesAnio = (f: string) => `${MESES[Number(f.slice(5, 7)) - 1] ?? ''} ${f.slice(0, 4)}`

/** Con menos de esto, mostrar números sería ruido: se dice que están en curso. */
const MINIMO_PARA_MOSTRAR = 10

export function FranjaClientes({ casos }: { casos: CasoCliente[] }) {
  if (casos.length === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
      <span className="text-[var(--tinta-suave)] text-sm">Ya trabajan con Aiuda:</span>
      {casos.map((c) =>
        c.logo_url ? (
          // biome-ignore lint/performance/noImgElement: logos externos de cada cliente, sin dominio fijo.
          <img
            alt={c.nombre}
            className="h-8 w-auto object-contain"
            key={c.nombre}
            src={c.logo_url}
          />
        ) : (
          <span
            className="font-bold text-lg tracking-tight"
            key={c.nombre}
            style={{ color: c.color_primario }}
          >
            {c.nombre}
          </span>
        ),
      )}
    </div>
  )
}

export function PruebaSocial({ datos }: { datos: Datos }) {
  const { casos, testimonios } = datos
  return (
    <>
      {casos.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {casos.map((c) => (
            <article
              className="rounded-3xl bg-white p-6 ring-1 ring-[var(--linea)] sm:p-8"
              key={c.nombre}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-xl">{c.nombre}</h3>
                  <p className="text-[var(--tinta-suave)] text-sm">
                    {c.rubro}
                    {c.ciudad ? ` · ${c.ciudad}` : ''} · con Aiuda desde {mesAnio(c.desde)}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--esmeralda-claro)] px-3 py-1 font-semibold text-[var(--esmeralda)] text-xs">
                  Cliente piloto
                </span>
              </div>
              {c.conversaciones >= MINIMO_PARA_MOSTRAR ? (
                <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    ['Conversaciones', c.conversaciones],
                    ['Calificados', c.calificados],
                    ['Reuniones', c.reuniones],
                  ].map(([t, n]) => (
                    <div className="rounded-2xl bg-[var(--marfil)] p-3" key={t}>
                      <dd className="font-bold text-3xl tabular-nums">{n}</dd>
                      <dt className="text-[var(--tinta-suave)] text-xs">{t}</dt>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-6 rounded-2xl bg-[var(--marfil)] p-4 text-[var(--tinta-suave)] text-sm">
                  Resultados en curso: la campaña está arrancando. Los números de este cliente se
                  publican aquí, tal como salen de su CRM.
                </p>
              )}
              <p className="mt-4 text-[var(--tinta-suave)] text-xs">
                Datos en vivo del CRM del cliente, publicados con su autorización.
              </p>
            </article>
          ))}
          <article className="flex flex-col justify-center rounded-3xl border-2 border-[var(--linea)] border-dashed p-6 sm:p-8">
            <h3 className="font-bold text-xl">Su empresa puede ser la siguiente</h3>
            <p className="mt-2 text-[var(--tinta-suave)]">
              Publicamos los resultados de cada cliente, con su permiso, tal como salen del sistema.
              Sin cifras maquilladas.
            </p>
          </article>
        </div>
      ) : null}

      {testimonios.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonios.map((t) => (
            <figure
              className="flex flex-col rounded-3xl bg-white p-6 ring-1 ring-[var(--linea)]"
              key={t.id}
            >
              <Quote aria-hidden className="text-[var(--esmeralda)]" size={28} />
              {t.calificacion ? (
                <div aria-label={`${t.calificacion} de 5`} className="mt-3 flex gap-0.5" role="img">
                  {Array.from({ length: 5 }, (_, i) => `${t.id}-${i}`).map((k, i) => (
                    <Star
                      aria-hidden
                      className={
                        i < (t.calificacion ?? 0)
                          ? 'fill-[#f5b301] text-[#f5b301]'
                          : 'text-[var(--linea)]'
                      }
                      key={k}
                      size={16}
                    />
                  ))}
                </div>
              ) : null}
              <blockquote className="mt-3 flex-1 leading-relaxed">«{t.texto}»</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {t.foto_url ? (
                  // biome-ignore lint/performance/noImgElement: foto del autor alojada fuera.
                  <img alt="" className="size-10 rounded-full object-cover" src={t.foto_url} />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-[var(--tinta)] font-bold text-white">
                    {t.autor.charAt(0)}
                  </span>
                )}
                <span className="text-sm">
                  <span className="block font-semibold">{t.autor}</span>
                  <span className="text-[var(--tinta-suave)]">
                    {t.cargo ? `${t.cargo}, ` : ''}
                    {t.empresa}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </>
  )
}
