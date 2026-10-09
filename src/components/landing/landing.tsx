import { Check, X } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { enlaceWhatsApp, referencia } from '@/lib/whatsapp'
import type { Angulo, Organizacion } from '@/types/database'
import { BotonWhatsApp } from './boton-whatsapp'
import { PixelMeta } from './pixel'

/**
 * Landing de un ángulo. Todo el texto viene de la base (organización y
 * ángulo): el código no sabe nada de ningún cliente. Orden: hero → cómo
 * funciona → dolores → para quién es / no es → otros servicios → preguntas
 * → cierre. Un solo color fuerte (el del botón) y barra fija en móvil.
 */

type Props = {
  org: Pick<
    Organizacion,
    'nombre' | 'slug' | 'codigo' | 'especialista' | 'logo_url' | 'color_primario' | 'pixel_id'
  > & {
    wa_numero: string
  }
  angulo: Angulo
  otros: Pick<Angulo, 'slug' | 'servicio' | 'titular'>[]
}

function pasos(especialista: string) {
  return [
    { titulo: 'Escribes por WhatsApp', texto: 'Con un clic, sin formularios.' },
    { titulo: 'Respondes 3 preguntas', texto: 'Solo datos generales de tu empresa.' },
    { titulo: `Te reúnes con ${especialista}`, texto: 'Eliges el horario que te sirve.' },
  ]
}

export function Landing({ org, angulo, otros }: Props) {
  const ref = referencia(org.codigo, angulo.codigo)
  const enlace = enlaceWhatsApp(org.wa_numero, angulo.mensaje_whatsapp, ref)
  const estilo = { '--marca': org.color_primario } as CSSProperties
  const cta = 'Hablar por WhatsApp'

  return (
    <div className="min-h-screen bg-white pb-24 text-[#101828] sm:pb-0" style={estilo}>
      <PixelMeta pixelId={org.pixel_id} />

      <header className="border-[#e4e7ec] border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {org.logo_url ? (
            // biome-ignore lint/performance/noImgElement: logo externo de tamaño variable
            <img alt={org.nombre} className="h-9 w-auto" src={org.logo_url} />
          ) : (
            <span className="font-bold text-lg tracking-tight">{org.nombre}</span>
          )}
          <span className="hidden sm:block">
            <BotonWhatsApp enlace={enlace} referencia={ref} tamano="chico" texto={cta} />
          </span>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:py-20">
          <div>
            <p className="font-semibold text-[var(--marca)] text-sm uppercase tracking-wider">
              {angulo.servicio}
            </p>
            <h1 className="mt-3 font-bold text-4xl leading-tight tracking-tight sm:text-5xl">
              {angulo.titular}
            </h1>
            <p className="mt-5 max-w-xl text-[#475467] text-lg leading-relaxed">
              {angulo.subtitulo}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <BotonWhatsApp enlace={enlace} referencia={ref} texto={cta} />
              <p className="text-[#475467] text-sm">
                Te responden al instante y agendas tu reunión ahí mismo.
              </p>
            </div>
          </div>

          <ol className="self-center rounded-2xl border border-[#e4e7ec] bg-[#f9fafb] p-6">
            <li className="mb-4 font-semibold text-sm">Cómo funciona</li>
            {pasos(org.especialista).map((paso, i) => (
              <li className="flex gap-4 py-3" key={paso.titulo}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] font-semibold text-sm text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{paso.titulo}</p>
                  <p className="text-[#475467] text-sm">{paso.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {angulo.dolores.length > 0 ? (
          <section className="bg-[#f9fafb] py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
                ¿Te pasa algo de esto?
              </h2>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {angulo.dolores.map((dolor) => (
                  <li
                    className="rounded-xl border border-[#e4e7ec] bg-white p-5 text-[#344054]"
                    key={dolor}
                  >
                    {dolor}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <BotonWhatsApp
                  enlace={enlace}
                  referencia={ref}
                  texto={`Quiero hablar con ${org.especialista}`}
                />
              </div>
            </div>
          </section>
        ) : null}

        {angulo.para_quien.length > 0 ? (
          <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e4e7ec] p-6">
              <h2 className="font-bold text-xl">Es para ti si…</h2>
              <ul className="mt-4 space-y-3">
                {angulo.para_quien.map((t) => (
                  <li className="flex gap-3" key={t}>
                    <Check aria-hidden className="mt-0.5 shrink-0 text-[var(--marca)]" size={18} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            {angulo.no_para_quien.length > 0 ? (
              <div className="rounded-2xl border border-[#e4e7ec] p-6">
                <h2 className="font-bold text-xl">No es para ti si…</h2>
                <ul className="mt-4 space-y-3 text-[#475467]">
                  {angulo.no_para_quien.map((t) => (
                    <li className="flex gap-3" key={t}>
                      <X aria-hidden className="mt-0.5 shrink-0" size={18} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {otros.length > 0 ? (
          <section className="bg-[#f9fafb] py-14">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <h2 className="font-bold text-2xl tracking-tight">También te ayudamos con</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otros.map((o) => (
                  <Link
                    className="rounded-xl border border-[#e4e7ec] bg-white p-5 transition-colors hover:border-[var(--marca)]"
                    href={`/${org.slug}/${o.slug}`}
                    key={o.slug}
                  >
                    <p className="font-semibold">{o.servicio}</p>
                    <p className="mt-1 text-[#475467] text-sm">{o.titular}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {angulo.preguntas.length > 0 ? (
          <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <h2 className="font-bold text-2xl tracking-tight">Preguntas frecuentes</h2>
            <div className="mt-6 divide-y divide-[#e4e7ec] border-[#e4e7ec] border-y">
              {angulo.preguntas.map((p) => (
                <details className="group py-4" key={p.pregunta}>
                  <summary className="cursor-pointer list-none font-medium marker:hidden">
                    {p.pregunta}
                  </summary>
                  <p className="mt-2 text-[#475467]">{p.respuesta}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className="bg-[var(--marca)] py-14 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <h2 className="max-w-xl font-bold text-2xl tracking-tight sm:text-3xl">
              {angulo.titular}
            </h2>
            <a
              className="inline-flex min-h-14 items-center justify-center rounded-lg bg-white px-6 font-semibold text-[var(--marca)]"
              href={enlace}
              rel="noopener"
              target="_blank"
            >
              {cta}
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-[#667085] text-xs sm:px-6">
        <p>
          {org.nombre} · Canal de atención operado por Aiuda. Usamos tus datos solo para responderte
          y agendar tu reunión, según la Ley Orgánica de Protección de Datos Personales.
        </p>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-20 border-[#e4e7ec] border-t bg-white p-3 sm:hidden">
        <BotonWhatsApp className="w-full" enlace={enlace} referencia={ref} texto={cta} />
      </div>
    </div>
  )
}
