import { redirect } from 'next/navigation'
import { FormConfiguracion } from '@/components/panel/form-configuracion'
import { exigir } from '@/lib/auth'
import { leerConfiguracion } from '@/server/configuracion'

export default async function Configuracion() {
  const sesion = await exigir('conocimiento')
  if (!sesion) redirect('/panel')
  const inicial = await leerConfiguracion(sesion.org)
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Configuración de {sesion.org.nombre}</h1>
        <p className="text-[var(--texto-suave)] text-sm">
          Cuatro pasos. El asistente de WhatsApp y la agenda usan esto desde el próximo mensaje.
        </p>
      </div>
      <FormConfiguracion inicial={inicial} />
    </div>
  )
}
