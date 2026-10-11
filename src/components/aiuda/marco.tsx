import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

/** Marco de la landing de Aiuda: barra superior fija, pie y botones de WhatsApp siempre a mano. */

const ENLACES = [
  ['#como', 'Cómo funciona'],
  ['#calculadora', 'Calculadora'],
  ['#planes', 'Planes'],
  ['#preguntas', 'Preguntas'],
] as const

export function Encabezado({ boton }: { boton: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-[var(--linea)] border-b bg-[rgb(251_248_243/0.85)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span
          className="font-extrabold text-xl tracking-tight"
          style={{ fontFamily: 'var(--font-titulo)' }}
        >
          aiuda<span className="text-[var(--esmeralda)]">.</span>
          <span className="ml-1 font-semibold text-[var(--tinta-suave)] text-sm">empresas</span>
        </span>
        <nav className="hidden items-center gap-7 text-[var(--tinta-suave)] text-sm lg:flex">
          {ENLACES.map(([h, t]) => (
            <a className="hover:text-[var(--tinta)]" href={h} key={h}>
              {t}
            </a>
          ))}
          <Link className="hover:text-[var(--tinta)]" href="/login">
            Entrar
          </Link>
        </nav>
        <span className="hidden sm:block">{boton}</span>
      </div>
    </header>
  )
}

export function Pie({ enlace, botonMovil }: { enlace: string; botonMovil: ReactNode }) {
  return (
    <>
      <footer className="border-[var(--linea)] border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-[var(--tinta-suave)] text-sm sm:px-6">
          <span>Aiuda Empresas · Quito, Ecuador · Datos tratados según la LOPDP</span>
          <nav className="flex gap-5">
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/eliminacion-de-datos">Eliminación de datos</Link>
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
      </footer>

      <a
        aria-label="Escribir por WhatsApp"
        className="boton-latido fixed right-6 bottom-6 z-40 hidden size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-xl sm:flex"
        href={enlace}
        rel="noopener"
        target="_blank"
      >
        <MessageCircle size={26} />
      </a>
      <div className="fixed inset-x-0 bottom-0 z-40 border-[var(--linea)] border-t bg-[var(--marfil)] p-3 sm:hidden">
        {botonMovil}
      </div>
    </>
  )
}
