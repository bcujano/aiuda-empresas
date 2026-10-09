import type { ReactNode } from 'react'

/** Marco simple para las páginas legales públicas (privacidad, eliminación de datos). */
export function PaginaLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-[#101828] leading-relaxed sm:px-6">
      <p className="font-semibold text-[#475467] text-sm">Aiuda Empresas</p>
      <h1 className="mt-2 font-bold text-3xl tracking-tight">{titulo}</h1>
      <div className="mt-8 space-y-5 text-[#344054] [&_h2]:mt-8 [&_h2]:font-semibold [&_h2]:text-[#101828] [&_h2]:text-lg [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </main>
  )
}
