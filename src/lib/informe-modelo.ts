import { z } from 'zod'

/**
 * El informe de campañas como datos editables. El sistema lo llena con lo que cuenta en la base;
 * la persona lo ajusta en el editor y recién entonces se convierte en PDF.
 */

const texto = (max: number) => z.string().trim().max(max)
const numero = z.coerce.number().finite().min(0).max(10_000_000)

export const esquemaPersona = z.object({
  nombre: texto(80),
  empresa: texto(80),
  fecha: texto(30),
  nota: texto(200),
})
export type Persona = z.infer<typeof esquemaPersona>

export const esquemaCharla = z.object({
  titulo: texto(80),
  ilustrativa: z.boolean(),
  mensajes: z.array(z.object({ de: z.enum(['contacto', 'asistente']), texto: texto(260) })).max(12),
})
export type Charla = z.infer<typeof esquemaCharla>

export const esquemaInforme = z.object({
  cliente: texto(80),
  canal: texto(80).default('Campaña de captación directa por WhatsApp'),
  desde: texto(30),
  hasta: texto(30),
  inversion: numero,
  contactadas: numero,
  respondieron: numero,
  interesadas: numero,
  reuniones: numero,
  automaticas: numero,
  rechazos: numero,
  bajas: numero,
  porDia: z.array(z.object({ dia: texto(10), n: numero, resp: numero.default(0) })).max(31),
  ventanaDias: numero.default(14),
  porSector: z
    .array(z.object({ sector: texto(60), n: numero, respondieron: numero, interesadas: numero }))
    .max(10),
  foco: texto(60),
  calientes: z.array(esquemaPersona).max(5),
  tibios: z.array(esquemaPersona).max(5),
  frios: z.array(esquemaPersona).max(5),
  casoExito: z.object({
    activo: z.boolean(),
    titulo: texto(80),
    persona: esquemaPersona,
    texto: texto(400),
  }),
  charlas: z.array(esquemaCharla).max(3),
  dolares: z.object({
    servicioMensual: numero,
    meses: numero,
    planMensualCliente: numero,
    propuestaDia: numero,
  }),
  conclusiones: z.array(texto(300)).max(8),
  pasos: z.array(texto(240)).max(8),
  explicaciones: z.object({
    cifras: texto(300),
    embudo: texto(300),
    actividad: texto(300),
    sectores: texto(300),
    calor: texto(300),
    exito: texto(300),
    charlas: texto(300),
    dolares: texto(300),
  }),
})
export type Informe = z.infer<typeof esquemaInforme>

export const EXPLICACIONES: Informe['explicaciones'] = {
  cifras:
    'Resumen de la campaña: a cuántas empresas se les escribió, cuántas respondieron como personas, cuántas quieren reunirse y cuántas reuniones hay.',
  embudo:
    'Cada barra es un paso de la campaña. El porcentaje compara con el paso anterior: así se ve dónde se pierde gente.',
  actividad:
    'Cuántas empresas se contactaron cada día. Con el presupuesto de arranque el ritmo diario fue bajo, a propósito.',
  sectores:
    'Los rubros a los que se escribió y cómo respondió cada uno. Sirve para decidir a cuál darle más inversión.',
  calor:
    'Las personas ordenadas por temperatura: caliente quiere reunirse, tibio conversó o preguntó, frío no tiene interés por ahora.',
  exito:
    'Un caso real que merece seguimiento del equipo. Pedimos que lo verifiquen para confirmar si hubo la reunión.',
  charlas:
    'Cómo conversa el asistente con las empresas: directo, cordial y siempre llevando a una reunión.',
  dolares:
    'Lo que cuesta el servicio frente a lo que vale un cliente nuevo. Una sola reunión que cierre puede pagar todo el trimestre.',
}

/** Cuentas de dinero del informe (siempre calculadas, nunca escritas a mano). */
export function cuentasDolares(d: Informe['dolares'], inversion: number) {
  const costoTrimestre = d.servicioMensual * d.meses
  const valorAnual = d.planMensualCliente * 12
  return {
    costoTrimestre,
    valorAnual,
    veces: costoTrimestre + inversion > 0 ? valorAnual / (costoTrimestre + inversion) : 0,
    mesesParaPagar:
      d.planMensualCliente > 0 ? (costoTrimestre + inversion) / d.planMensualCliente : 0,
  }
}
