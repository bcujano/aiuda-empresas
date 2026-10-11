import { nombrePlantilla, PLANTILLAS } from '@/lib/plantillas'
import type { Organizacion } from '@/types/database'
import { graph, tokenMeta } from './meta'

/** Estado en Meta de las plantillas que necesita un cliente, y creación de las que falten. */

export type EstadoPlantilla = { nombre: string; uso: string; categoria: string; estado: string }

export async function estadoPlantillas(
  org: Organizacion,
): Promise<{ error?: string; lista: EstadoPlantilla[] }> {
  const base = PLANTILLAS.map((p) => ({
    nombre: nombrePlantilla(org.prefijo_plantillas, p.base),
    uso: p.uso,
    categoria: p.categoria,
    estado: 'No existe',
  }))
  if (!org.wa_waba_id)
    return {
      error: 'Falta el ID de la cuenta de WhatsApp (WABA) en la ficha del cliente.',
      lista: base,
    }
  if (!tokenMeta()) return { error: 'Falta el token de Meta.', lista: base }
  const r = await graph<{ data: { name: string; status: string }[] }>(
    `/${org.wa_waba_id}/message_templates?fields=name,status&limit=200`,
  )
  if (!r.ok) return { error: r.error, lista: base }
  const enMeta = new Map(r.datos.data.map((t) => [t.name, t.status]))
  return { lista: base.map((p) => ({ ...p, estado: enMeta.get(p.nombre) ?? 'No existe' })) }
}

export async function crearPlantillasFaltantes(
  org: Organizacion,
): Promise<{ creadas: string[]; errores: string[] }> {
  const { lista, error } = await estadoPlantillas(org)
  if (error) return { creadas: [], errores: [error] }
  const creadas: string[] = []
  const errores: string[] = []
  for (const p of PLANTILLAS) {
    const nombre = nombrePlantilla(org.prefijo_plantillas, p.base)
    if (lista.find((x) => x.nombre === nombre)?.estado !== 'No existe') continue
    const r = await graph(`/${org.wa_waba_id}/message_templates`, {
      metodo: 'POST',
      cuerpo: {
        name: nombre,
        language: 'es',
        category: p.categoria,
        components: [{ type: 'BODY', text: p.cuerpo, example: { body_text: [p.ejemplo] } }],
      },
    })
    if (r.ok) creadas.push(nombre)
    else errores.push(`${nombre}: ${r.error}`)
  }
  return { creadas, errores }
}
