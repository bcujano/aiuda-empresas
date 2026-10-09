'use client'

import {
  Building2,
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type CSSProperties, useEffect, useState } from 'react'
import { salir } from '@/app/(auth)/login/actions'
import { elegirOrganizacion } from '@/app/panel/acciones'
import { type Area, ROL_LEGIBLE } from '@/lib/permisos'
import type { Rol } from '@/types/database'

type Enlace = { href: string; texto: string; icono: typeof KanbanSquare; area?: Area }

const ENLACES: Enlace[] = [
  { href: '/panel', texto: 'Resumen', icono: LayoutDashboard },
  { href: '/panel/pipeline', texto: 'Pipeline', icono: KanbanSquare, area: 'leads' },
  { href: '/panel/citas', texto: 'Citas', icono: CalendarDays, area: 'citas' },
  { href: '/panel/angulos', texto: 'Ángulos', icono: Megaphone, area: 'angulos' },
]

export type DatosBarra = {
  nombre: string
  rol: Rol
  /** Áreas que esta sesión puede usar (rol y plan ya cruzados en el servidor). */
  areas: Area[]
  org: { id: string; nombre: string } | null
  /** Solo para el superadmin: todos los clientes, para cambiar de uno a otro. */
  organizaciones: { id: string; nombre: string }[]
}

function Contenido({ datos, alNavegar }: { datos: DatosBarra; alNavegar?: () => void }) {
  const ruta = usePathname()
  const visibles = ENLACES.filter((e) => !e.area || datos.areas.includes(e.area))
  const esSuper = datos.rol === 'superadmin'

  return (
    <>
      <div className="flex items-start justify-between border-white/10 border-b p-5">
        <div className="min-w-0">
          <p className="font-bold text-lg text-white tracking-tight">Aiuda Setter</p>
          <p className="mt-0.5 truncate text-white/50 text-xs">
            {datos.org?.nombre ?? 'Elige un cliente'}
          </p>
        </div>
        {alNavegar ? (
          <button
            aria-label="Cerrar menú"
            className="p-1 text-white/60"
            onClick={alNavegar}
            type="button"
          >
            <X size={20} />
          </button>
        ) : null}
      </div>

      {esSuper ? (
        <form action={elegirOrganizacion} className="border-white/10 border-b p-3">
          <label
            className="mb-1 block px-1 text-[10px] text-white/40 uppercase tracking-wider"
            htmlFor="org"
          >
            Cliente
          </label>
          <div className="flex gap-2">
            <select
              className="min-w-0 flex-1 rounded-md bg-white/10 px-2 py-1.5 text-sm text-white"
              defaultValue={datos.org?.id ?? ''}
              id="org"
              name="organizacion_id"
            >
              <option value="">Todos los clientes</option>
              {datos.organizaciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-white/15 px-2 text-white text-xs" type="submit">
              Ir
            </button>
          </div>
        </form>
      ) : null}

      <nav className="nav-lateral flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {datos.org
            ? visibles.map(({ href, texto, icono: Icono }) => {
                const activo = href === '/panel' ? ruta === '/panel' : ruta.startsWith(href)
                return (
                  <Link
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      activo
                        ? 'bg-white/15 font-medium text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                    href={href}
                    key={href}
                    onClick={alNavegar}
                  >
                    <Icono size={18} />
                    {texto}
                  </Link>
                )
              })
            : null}
          {esSuper ? (
            <Link
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                ruta.startsWith('/panel/organizaciones')
                  ? 'bg-white/15 font-medium text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
              href="/panel/organizaciones"
              onClick={alNavegar}
            >
              <Building2 size={18} />
              Clientes
            </Link>
          ) : null}
        </div>
      </nav>

      <div className="border-white/10 border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--acento)] font-bold text-sm text-white">
            {datos.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm text-white">{datos.nombre}</p>
            <p className="text-white/40 text-xs">{ROL_LEGIBLE[datos.rol]}</p>
          </div>
          <form action={salir}>
            <button
              aria-label="Cerrar sesión"
              className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
              title="Cerrar sesión"
              type="submit"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export function BarraLateral({ datos }: { datos: DatosBarra }) {
  const [abierta, setAbierta] = useState(false)
  const ruta = usePathname()

  // biome-ignore lint/correctness/useExhaustiveDependencies: la ruta es justo el disparador
  useEffect(() => {
    setAbierta(false)
  }, [ruta])

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center gap-3 border-[var(--borde)] border-b bg-[var(--superficie)] px-4 lg:hidden">
        <button aria-label="Abrir menú" onClick={() => setAbierta(true)} type="button">
          <Menu size={22} />
        </button>
        <span className="font-semibold text-sm">{datos.org?.nombre ?? 'Aiuda Setter'}</span>
      </header>

      {abierta ? (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setAbierta(false)}
          type="button"
        />
      ) : null}

      <aside
        className="barra-lateral fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--lateral)]"
        style={{ '--cajon': abierta ? '0%' : '-100%' } as CSSProperties}
      >
        <Contenido alNavegar={abierta ? () => setAbierta(false) : undefined} datos={datos} />
      </aside>
    </>
  )
}
