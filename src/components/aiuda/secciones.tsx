import {
  BellRing,
  Bot,
  CalendarDays,
  ChartColumn,
  Check,
  Clock,
  FileSpreadsheet,
  Megaphone,
  MessageCircleReply,
  MousePointerClick,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  type Celda,
  COMPARACION,
  DATOS_PROBLEMA,
  FUENTE_HBR,
  GARANTIAS,
  INCLUYE,
  PASOS,
  PREGUNTAS,
} from './contenido'

/** Secciones fijas de la landing de Aiuda: solo presentación, el texto vive en contenido.ts. */

export function Titulo({
  antetitulo,
  titulo,
  bajada,
}: {
  antetitulo: string
  titulo: string
  bajada?: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-semibold text-[var(--esmeralda)] text-sm uppercase tracking-wider">
        {antetitulo}
      </p>
      <h2 className="mt-3 font-bold text-3xl leading-tight sm:text-4xl">{titulo}</h2>
      {bajada ? (
        <p className="mt-4 text-[var(--tinta-suave)] text-lg leading-relaxed">{bajada}</p>
      ) : null}
    </div>
  )
}

export function Problema() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
      <Titulo
        antetitulo="El problema"
        bajada="Sus anuncios sí traen mensajes. Pero si nadie responde en minutos, ese interesado le escribe a su competencia, y usted pagó el clic igual."
        titulo="Un mensaje sin respuesta es dinero de pauta perdido"
      />
      <div>
        <div className="grid gap-4 sm:grid-cols-3">
          {DATOS_PROBLEMA.map((d) => (
            <div className="rounded-3xl bg-white p-6 ring-1 ring-[var(--linea)]" key={d.cifra}>
              <p className="font-bold text-5xl text-[var(--esmeralda)] tabular-nums">{d.cifra}</p>
              <p className="mt-3 text-[var(--tinta-suave)] text-sm leading-relaxed">{d.texto}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[var(--tinta-suave)] text-xs">
          Fuente:{' '}
          <a className="underline" href={FUENTE_HBR.url} rel="noopener noreferrer" target="_blank">
            {FUENTE_HBR.nombre}
          </a>{' '}
          (estudio de 2.241 empresas de EE. UU.).
        </p>
      </div>
    </div>
  )
}

const ICONOS_PASO = [Megaphone, Clock, MousePointerClick, CalendarDays]

export function Pasos() {
  return (
    <ol className="mt-12 grid gap-6 md:grid-cols-4">
      {PASOS.map((p, i) => {
        const Icono = ICONOS_PASO[i] ?? Check
        return (
          <li className="relative" key={p.titulo}>
            {i < PASOS.length - 1 ? (
              <span
                aria-hidden
                className="absolute top-6 left-14 hidden h-px w-[calc(100%-3rem)] bg-[var(--linea)] md:block"
              />
            ) : null}
            <span className="relative flex size-12 items-center justify-center rounded-2xl bg-[var(--tinta)] text-white">
              <Icono aria-hidden size={22} />
            </span>
            <p className="mt-5 font-semibold text-[var(--esmeralda)] text-xs uppercase tracking-wider">
              {i + 1} · {p.cuando}
            </p>
            <h3 className="mt-1 font-bold text-xl">{p.titulo}</h3>
            <p className="mt-2 text-[var(--tinta-suave)] leading-relaxed">{p.texto}</p>
          </li>
        )
      })}
    </ol>
  )
}

const ICONOS_INCLUYE = [
  Bot,
  CalendarDays,
  BellRing,
  Clock,
  MessageCircleReply,
  FileSpreadsheet,
  MousePointerClick,
  ChartColumn,
]

export function Incluye() {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {INCLUYE.map((f, i) => {
        const Icono = ICONOS_INCLUYE[i] ?? Check
        return (
          <div
            className="rounded-3xl bg-white p-6 ring-1 ring-[var(--linea)] transition-transform hover:-translate-y-1"
            key={f.titulo}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--esmeralda-claro)] text-[var(--esmeralda)]">
              <Icono aria-hidden size={20} />
            </span>
            <h3 className="mt-4 font-bold">{f.titulo}</h3>
            <p className="mt-1.5 text-[var(--tinta-suave)] text-sm leading-relaxed">{f.texto}</p>
          </div>
        )
      })}
    </div>
  )
}

function Valor({ v, fuerte = false }: { v: Celda; fuerte?: boolean }) {
  if (v === true)
    return (
      <Check
        aria-label="Sí"
        className={fuerte ? 'mx-auto text-[#5ee0a7]' : 'mx-auto text-[var(--esmeralda)]'}
        size={20}
      />
    )
  if (v === false) return <X aria-label="No" className="mx-auto text-[#b3261e]" size={20} />
  return <span className="text-xs">{v}</span>
}

export function Comparacion() {
  return (
    <div className="mt-10 overflow-x-auto rounded-3xl bg-white ring-1 ring-[var(--linea)]">
      <table className="w-full min-w-[40rem] text-center text-sm">
        <thead>
          <tr>
            <th className="p-4 text-left font-medium text-[var(--tinta-suave)]" scope="col">
              <span className="sr-only">Característica</span>
            </th>
            <th className="bg-[var(--tinta)] p-4 font-bold text-white" scope="col">
              Aiuda Ads
            </th>
            <th className="p-4 font-semibold" scope="col">
              Vendedor interno
            </th>
            <th className="p-4 font-semibold" scope="col">
              Agencia de anuncios
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARACION.map((f) => (
            <tr className="border-[var(--linea)] border-t" key={f.fila}>
              <th className="p-4 text-left font-medium" scope="row">
                {f.fila}
              </th>
              <td className="bg-[var(--tinta)] p-4 text-white">
                <Valor fuerte v={f.aiuda} />
              </td>
              <td className="p-4 text-[var(--tinta-suave)]">
                <Valor v={f.vendedor} />
              </td>
              <td className="p-4 text-[var(--tinta-suave)]">
                <Valor v={f.agencia} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Garantias() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {GARANTIAS.map((g) => (
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/15" key={g.titulo}>
          <ShieldCheck aria-hidden className="text-[#5ee0a7]" size={24} />
          <h3 className="mt-4 font-bold text-lg text-white">{g.titulo}</h3>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">{g.texto}</p>
        </div>
      ))}
    </div>
  )
}

export function Preguntas() {
  return (
    <div className="mt-10 flex flex-col gap-3">
      {PREGUNTAS.map((p) => (
        <details
          className="group rounded-2xl bg-white p-5 ring-1 ring-[var(--linea)] open:shadow-sm"
          key={p.pregunta}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {p.pregunta}
            <span
              aria-hidden
              className="text-2xl text-[var(--esmeralda)] transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-[var(--tinta-suave)] leading-relaxed">{p.respuesta}</p>
        </details>
      ))}
    </div>
  )
}
