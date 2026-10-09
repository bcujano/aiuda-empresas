import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { BarraLateral } from '@/components/panel/barra-lateral'
import { permite, verifyAuth } from '@/lib/auth'
import { hoyQuito } from '@/lib/formato'
import type { Area } from '@/lib/permisos'
import { avisoDePlan } from '@/lib/planes'
import { listarOrganizaciones } from '@/server/organizaciones'

export const dynamic = 'force-dynamic'

const AREAS: Area[] = [
  'leads',
  'citas',
  'angulos',
  'reportes',
  'exportar',
  'usuarios',
  'conocimiento',
  'organizaciones',
]

const TONO_AVISO = {
  neutro: 'bg-[var(--fondo)] text-[var(--texto-suave)] border-[var(--borde)]',
  aviso: 'bg-[var(--aviso-suave)] text-[var(--aviso)] border-transparent',
  peligro: 'bg-[var(--peligro-suave)] text-[var(--peligro)] border-transparent',
}

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const sesion = await verifyAuth()
  if (!sesion) redirect('/login')

  const esSuper = sesion.usuario.rol === 'superadmin'

  // Un cliente suspendido no entra. El superadmin sí, para arreglar o exportar.
  if (!esSuper && sesion.plan === 'suspendido') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="tarjeta max-w-md p-6 text-center">
          <h1 className="font-semibold text-lg">Tu acceso al CRM está suspendido</h1>
          <p className="mt-2 text-[var(--texto-suave)] text-sm">
            Escríbele a Aiuda para reactivar tu plan o recibir la exportación de tus datos.
          </p>
        </div>
      </main>
    )
  }

  const organizaciones = esSuper
    ? (await listarOrganizaciones()).map((o) => ({ id: o.id, nombre: o.nombre }))
    : []
  const aviso = sesion.org && !esSuper ? avisoDePlan(sesion.org, hoyQuito()) : null

  return (
    <div className="min-h-screen">
      <BarraLateral
        datos={{
          nombre: sesion.usuario.nombre_completo,
          rol: sesion.usuario.rol,
          areas: AREAS.filter((a) => permite(sesion, a)),
          org: sesion.org ? { id: sesion.org.id, nombre: sesion.org.nombre } : null,
          organizaciones,
        }}
      />
      <main className="min-w-0 overflow-x-hidden px-4 pt-18 pb-10 lg:ml-64 lg:px-6 lg:pt-6">
        {aviso ? (
          <p
            className={`mb-4 rounded-lg border px-3 py-2 text-sm ${TONO_AVISO[aviso.tono]}`}
            role="status"
          >
            {aviso.texto}
          </p>
        ) : null}
        {children}
      </main>
    </div>
  )
}
