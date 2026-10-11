import { ArrowRight, Check } from 'lucide-react'
import { Manrope } from 'next/font/google'
import type { ReactNode } from 'react'
import { BotonWhatsApp } from '@/components/landing/boton-whatsapp'
import { PixelMeta } from '@/components/landing/pixel'
import type { PruebaSocial as Datos } from '@/server/landing-aiuda'
import type { Plan } from '@/types/database'
import { Calculadora } from './calculadora'
import { RUBROS } from './contenido'
import { DemoWhatsApp } from './demo-whatsapp'
import { FormLlamada, SalidaIntencion } from './llamada'
import { Encabezado, Pie } from './marco'
import { PlanesAiuda } from './planes-aiuda'
import { FranjaClientes, PruebaSocial } from './prueba-social'
import {
  Comparacion,
  Fundador,
  Garantias,
  Incluye,
  Pasos,
  Preguntas,
  Problema,
  Titulo,
} from './secciones'

/**
 * Landing de Aiuda Empresas, armada sobre lo que mejor convierte en servicios
 * B2B: titular de resultado, demo del producto arriba, dato con fuente, pasos,
 * calculadora, comparación, prueba social real, planes con ancla, reversión de
 * riesgo, fundador, preguntas y doble salida (WhatsApp o «que me llamen»).
 */

const titulo = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-titulo',
  display: 'swap',
})

export function LandingAiuda({
  planes,
  enlace,
  pixelId,
  prueba,
  fotoFundador,
}: {
  planes: Plan[]
  enlace: string
  pixelId: string | null
  prueba: Datos
  fotoFundador: string | null
}) {
  const boton = (
    texto = 'Quiero más reuniones',
    tamano: 'grande' | 'chico' = 'grande',
    className = '',
  ) => (
    <BotonWhatsApp
      className={className}
      enlace={enlace}
      referencia="AIU-WEB"
      tamano={tamano}
      texto={texto}
    />
  )
  const precioBasico = planes[0]?.precio_mensual ?? 200
  const seccion = (id: string, hijos: ReactNode, fondo = '') => (
    <section className={`scroll-mt-20 ${fondo}`} id={id}>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">{hijos}</div>
    </section>
  )

  return (
    <div className={`landing-aiuda min-h-screen pb-24 sm:pb-0 ${titulo.variable}`}>
      <PixelMeta pixelId={pixelId} />
      <Encabezado boton={boton('Hablemos', 'chico')} />

      <main>
        <section className="fondo-cuadricula overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20 lg:pb-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-medium text-sm ring-1 ring-[var(--linea)]">
                <span className="size-2 rounded-full bg-[var(--esmeralda)]" />
                Para empresas que venden a empresas · Ecuador
              </p>
              <h1 className="mt-6 font-extrabold text-[2.6rem] leading-[1.05] sm:text-6xl">
                Sus anuncios traen mensajes.{' '}
                <span className="text-[var(--esmeralda)]">
                  Nosotros los convertimos en reuniones.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-[var(--tinta-suave)] text-lg leading-relaxed sm:text-xl">
                Anuncios en Meta, un asistente con IA que responde por WhatsApp en segundos,
                califica y agenda en su calendario real. Usted solo se sienta a cerrar.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                {boton('Quiero más reuniones', 'grande', 'boton-latido')}
                <a
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg px-5 font-semibold ring-1 ring-[var(--linea)] hover:bg-white"
                  href="#calculadora"
                >
                  Calcular mi costo por reunión <ArrowRight aria-hidden size={18} />
                </a>
              </div>
              <ul className="mt-8 grid gap-2 text-[var(--tinta-suave)] text-sm sm:grid-cols-2">
                {[
                  'Responde en segundos, 24/7',
                  'Agenda solo en horas libres',
                  'La pauta y los datos son suyos',
                  'Notas de voz e imágenes',
                ].map((t) => (
                  <li className="flex items-center gap-2" key={t}>
                    <Check aria-hidden className="text-[var(--esmeralda)]" size={16} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <DemoWhatsApp />
          </div>
        </section>

        <div className="border-[var(--linea)] border-y bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            {prueba.casos.length > 0 ? (
              <FranjaClientes casos={prueba.casos} />
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[var(--tinta-suave)] text-sm">
                <span className="font-semibold text-[var(--tinta)]">Hecho para:</span>
                {RUBROS.map((r) => (
                  <span key={r}>{r}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {seccion('problema', <Problema />)}

        {seccion(
          'como',
          <>
            <Titulo
              antetitulo="Cómo funciona"
              bajada="Nosotros ponemos los anuncios, el asistente y la agenda. Usted pone el conocimiento de su negocio y las reuniones."
              titulo="Del anuncio a la reunión, sin que nadie se enfríe"
            />
            <Pasos />
          </>,
          'bg-white',
        )}

        {seccion(
          'incluye',
          <>
            <Titulo
              antetitulo="Todo incluido"
              titulo="Un equipo comercial completo, funcionando desde la primera semana"
            />
            <Incluye />
          </>,
        )}

        {seccion(
          'calculadora',
          <>
            <Titulo
              antetitulo="Haga la cuenta"
              bajada="Ponga sus números y vea cuánto le costaría cada reunión. Si la cuenta no le conviene, se lo diremos antes de empezar."
              titulo="¿Cuánto le cuesta hoy una reunión con un cliente nuevo?"
            />
            <div className="mt-10">
              <Calculadora precioPlan={precioBasico} />
            </div>
          </>,
          'bg-[var(--arena)]',
        )}

        {seccion(
          'comparacion',
          <>
            <Titulo antetitulo="Compare" titulo="Más que una agencia, menos que un vendedor más" />
            <Comparacion />
          </>,
        )}

        {prueba.casos.length > 0 || prueba.testimonios.length > 0
          ? seccion(
              'clientes',
              <>
                <Titulo
                  antetitulo="Clientes"
                  bajada="Números en vivo, tal como salen del CRM de cada cliente."
                  titulo="Resultados reales, sin maquillaje"
                />
                <div className="mt-10">
                  <PruebaSocial datos={prueba} />
                </div>
              </>,
              'bg-white',
            )
          : null}

        {seccion(
          'planes',
          <>
            <Titulo
              antetitulo="Planes"
              bajada="Precio mensual. La inversión en anuncios va aparte y se paga directo a Meta, desde su cuenta."
              titulo="Elija cuánto quiere crecer"
            />
            <PlanesAiuda
              boton={(claro) => (
                <BotonWhatsApp
                  className={`w-full ${claro ? '' : 'opacity-95'}`}
                  enlace={enlace}
                  referencia="AIU-PLAN"
                  tamano="chico"
                  texto="Empezar con este plan"
                />
              )}
              planes={planes}
            />
          </>,
        )}

        <section className="bg-[var(--tinta)]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <p className="font-semibold text-[#5ee0a7] text-sm uppercase tracking-wider">
              Sin letra pequeña
            </p>
            <h2 className="mt-3 max-w-2xl font-bold text-3xl text-white sm:text-4xl">
              Usted mantiene el control de todo
            </h2>
            <Garantias />
          </div>
        </section>

        {seccion('fundador', <Fundador foto={fotoFundador} />)}

        {seccion(
          'preguntas',
          <div className="mx-auto max-w-3xl">
            <Titulo antetitulo="Preguntas" titulo="Lo que nos preguntan antes de empezar" />
            <Preguntas />
          </div>,
          'bg-white',
        )}

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-[2rem] bg-[var(--tinta)] p-8 text-white sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-bold text-3xl sm:text-4xl">
                Hablemos de las reuniones que su empresa necesita
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Revisamos su caso en 15 minutos y le decimos con honestidad si Aiuda le sirve.
              </p>
              <div className="mt-8">{boton('Escribir por WhatsApp')}</div>
            </div>
            <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/15">
              <p className="mb-4 font-semibold">¿Prefiere que le llamemos?</p>
              <FormLlamada oscuro />
            </div>
          </div>
        </section>
      </main>

      <Pie botonMovil={boton('Quiero más reuniones', 'grande', 'w-full')} enlace={enlace} />
      <SalidaIntencion enlace={enlace} />
    </div>
  )
}
