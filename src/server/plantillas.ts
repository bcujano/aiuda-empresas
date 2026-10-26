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
  // Seguro contra equivocarse de cuenta: el WABA debe contener el número de WhatsApp de ESTE cliente.
  const numeros = await graph<{ data: { id: string; display_phone_number: string }[] }>(
    `/${org.wa_waba_id}/phone_numbers?fields=id,display_phone_number`,
  )
  if (!numeros.ok)
    return { creadas: [], errores: [`No pude verificar la cuenta de WhatsApp: ${numeros.error}`] }
  const digitos = (t: string | null) => (t ?? '').replace(/\D/g, '')
  const contiene = numeros.datos.data.some(
    (n) =>
      n.id === org.wa_phone_number_id ||
      (org.wa_numero && digitos(n.display_phone_number) === digitos(org.wa_numero)),
  )
  if (!contiene) {
    return {
      creadas: [],
      errores: [
        `El WABA ${org.wa_waba_id} no contiene el número de ${org.nombre} (${org.wa_numero ?? 'sin número'}). No se creó nada: revisa la ficha del cliente.`,
      ],
    }
  }
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
        components: [
          { type: 'BODY', text: p.cuerpo, example: { body_text: [p.ejemplo] } },
          ...(p.boton
            ? [
                {
                  type: 'BUTTONS',
                  buttons: [
                    {
                      type: 'URL',
                      text: p.boton.texto,
                      url: p.boton.url,
                      example: [p.boton.ejemplo],
                    },
                  ],
                },
              ]
            : []),
        ],
      },
    })
    if (r.ok) creadas.push(nombre)
    else errores.push(`${nombre}: ${r.error}`)
  }
  return { creadas, errores }
}
