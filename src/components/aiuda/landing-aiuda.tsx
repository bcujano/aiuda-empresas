import { Check, X } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { BotonWhatsApp } from '@/components/landing/boton-whatsapp'
import { PixelMeta } from '@/components/landing/pixel'
import type { Plan } from '@/types/database'
import { ES_PARA, INCLUYE, NO_ES_PARA, PASOS, PREGUNTAS, REGLAS } from './contenido'

/**
 * Landing de Aiuda Empresas. Estilo corporativo sobrio: titular de resultado,
 * un solo color fuerte (el del botón), CTA repetido y barra fija en móvil,
 * «para quién es / no es», planes reales de la base y preguntas al final.
 */

const USD = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function LandingAiuda({
  planes,
  enlace,
  pixelId,
}: {
  planes: Plan[]
  enlace: string
  pixelId: string | null
}) {
  const cta = 'Quiero más reuniones'
  const boton = (tamano: 'grande' | 'chico' = 'grande', className = '') => (
    <BotonWhatsApp
      className={className}
      enlace={enlace}
      referencia="AIU-WEB"
      tamano={tamano}
      texto={cta}
    />
  )
  return (
    <div
      className="min-h-screen bg-white pb-24 text-[#101828] sm:pb-0"
      style={{ '--marca': '#1f3a5f' } as CSSProperties}
    >
      <PixelMeta pixelId={pixelId} />
      <header className="sticky top-0 z-20 border-[#e4e7ec] border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <span className="font-bold text-lg tracking-tight">Aiuda Empresas</span>
          <nav className="hidden items-center gap-6 text-[#475467] text-sm md:flex">
            <a href="#como">Cómo funciona</a>
            <a href="#planes">Planes</a>
            <a href="#preguntas">Preguntas</a>
            <Link href="/login">Entrar</Link>
          </nav>
          <span className="hidden sm:block">{boton('chico')}</span>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:py-24">
          <div>
            <p className="font-semibold text-[#475467] text-sm uppercase tracking-wider">
              Para empresas B2B en Ecuador
            </p>
            <h1 className="mt-4 font-bold text-4xl leading-tight tracking-tight sm:text-5xl">
              Reuniones con empresas que pueden pagar, cada semana
            </h1>
            <p className="mt-5 max-w-xl text-[#475467] text-lg leading-relaxed">
              Ponemos sus anuncios en Meta, un asistente con IA atiende y califica por WhatsApp a
              toda hora, y la reunión llega a su agenda. Usted solo cierra.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {boton()}
              <a
                className="font-medium text-[#1f3a5f] text-sm underline-offset-4 hover:underline"
                href="#planes"
              >
                Ver planes y precios
              </a>
            </div>
          </div>
          <ol
            className="self-center rounded-2xl border border-[#e4e7ec] bg-[#f9fafb] p-6"
            id="como"
          >
            <li className="mb-4 font-semibold text-sm">Así llega cada reunión</li>
            {PASOS.map((p, i) => (
              <li
                className="flex gap-4 border-[#e4e7ec] border-t py-4 first-of-type:border-t-0"
                key={p.titulo}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1f3a5f] font-semibold text-sm text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{p.titulo}</span>
                  <span className="block text-[#475467] text-sm">{p.texto}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-[#e4e7ec] border-y bg-[#f9fafb]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
              Lo que recibe desde el primer mes
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {INCLUYE.map((t) => (
                <li className="flex gap-3" key={t}>
                  <Check aria-hidden className="mt-0.5 shrink-0 text-[#1e7a46]" size={20} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e4e7ec] p-6">
            <h2 className="font-bold text-xl">Es para usted si…</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {ES_PARA.map((t) => (
                <li className="flex gap-3" key={t}>
                  <Check aria-hidden className="mt-0.5 shrink-0 text-[#1e7a46]" size={20} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#e4e7ec] p-6">
            <h2 className="font-bold text-xl">No es para usted si…</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {NO_ES_PARA.map((t) => (
                <li className="flex gap-3" key={t}>
                  <X aria-hidden className="mt-0.5 shrink-0 text-[#b3261e]" size={20} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-[#e4e7ec] border-t bg-[#f9fafb]" id="planes">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">Planes</h2>
            <p className="mt-2 max-w-2xl text-[#475467]">
              Precio mensual más IVA. La inversión en anuncios va aparte y se paga directo a Meta.
            </p>
            {planes.length === 0 ? (
              <div className="mt-8">{boton()}</div>
            ) : (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {planes.map((p, i) => (
                  <article
                    className={`flex flex-col rounded-2xl border bg-white p-6 ${i === 0 ? 'border-[#1f3a5f] ring-1 ring-[#1f3a5f]' : 'border-[#e4e7ec]'}`}
                    key={p.codigo}
                  >
                    <h3 className="font-semibold text-lg">{p.nombre}</h3>
                    <p className="mt-2">
                      <span className="font-bold text-3xl">{USD.format(p.precio_mensual)}</span>
                      <span className="text-[#475467] text-sm">
                        {' '}
                        /mes{p.mas_iva ? ' + IVA' : ''}
                      </span>
                    </p>
                    <p className="mt-2 text-[#475467] text-sm">{p.descripcion}</p>
                    <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm">
                      {p.incluye.map((t) => (
                        <li className="flex gap-2" key={t}>
                          <Check aria-hidden className="mt-0.5 shrink-0 text-[#1e7a46]" size={16} />
                          <span className={t.includes('(en preparación)') ? 'text-[#475467]' : ''}>
                            {t}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">{boton('chico', 'w-full')}</div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">Cómo trabajamos</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REGLAS.map((r) => (
              <div className="rounded-2xl border border-[#e4e7ec] p-5" key={r.titulo}>
                <h3 className="font-semibold">{r.titulo}</h3>
                <p className="mt-2 text-[#475467] text-sm">{r.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-[#e4e7ec] border-t bg-[#f9fafb]" id="preguntas">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">Preguntas frecuentes</h2>
            <div className="mt-6 flex flex-col gap-3">
              {PREGUNTAS.map((p) => (
                <details
                  className="rounded-xl border border-[#e4e7ec] bg-white p-5"
                  key={p.pregunta}
                >
                  <summary className="cursor-pointer font-semibold">{p.pregunta}</summary>
                  <p className="mt-3 text-[#475467]">{p.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
            Hablemos de las reuniones que su empresa necesita
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[#475467]">
            Escríbanos por WhatsApp: revisamos su caso y le decimos con honestidad si encaja.
          </p>
          <div className="mt-8 flex justify-center">{boton()}</div>
        </section>
      </main>

      <footer className="border-[#e4e7ec] border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[#475467] text-sm sm:px-6">
          <span>Aiuda Empresas · Quito, Ecuador</span>
          <nav className="flex gap-4">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/eliminacion-de-datos">Eliminación de datos</Link>
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-30 border-[#e4e7ec] border-t bg-white p-3 sm:hidden">
        {boton('grande', 'w-full')}
      </div>
    </div>
  )
}
