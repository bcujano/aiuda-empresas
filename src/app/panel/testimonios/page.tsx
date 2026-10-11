import { redirect } from 'next/navigation'
import { FormTestimonio } from '@/components/panel/form-testimonio'
import { CabeceraTarjeta, Etiqueta, Tarjeta, Vacio } from '@/components/ui/primitivos'
import { verifyAuth } from '@/lib/auth'
import { listarTestimonios } from '@/server/testimonios'

/** Reseñas que aparecen en la landing de Aiuda. Solo superadmin. */
export default async function Testimonios() {
  const sesion = await verifyAuth()
  if (sesion?.usuario.rol !== 'superadmin') redirect('/panel')
  const lista = await listarTestimonios()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-2xl tracking-tight">Reseñas de la landing</h1>
      <p className="text-[var(--texto-suave)] text-sm">
        Solo se publican las que tienen marcada la autorización del autor. Los clientes con sus
        números en vivo se activan en Clientes, con la casilla «Mostrar como cliente en la landing».
      </p>
      <Tarjeta>
        <CabeceraTarjeta titulo="Reseñas" />
        {lista.length === 0 ? (
          <Vacio mensaje="Aún no hay reseñas. Pide a tus clientes unas líneas y su permiso por escrito." />
        ) : (
          lista.map((t) => (
            <details className="border-[var(--borde)] border-t" key={t.id}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
                <span className="font-semibold">{t.autor}</span>
                <span className="text-[var(--texto-suave)]">{t.empresa}</span>
                {t.autorizado && t.visible ? (
                  <Etiqueta tono="exito">Publicada</Etiqueta>
                ) : (
                  <Etiqueta tono="aviso">{t.autorizado ? 'Oculta' : 'Sin autorización'}</Etiqueta>
                )}
              </summary>
              <FormTestimonio t={t} />
            </details>
          ))
        )}
      </Tarjeta>
      <Tarjeta>
        <CabeceraTarjeta titulo="Nueva reseña" />
        <FormTestimonio />
      </Tarjeta>
    </div>
  )
}
