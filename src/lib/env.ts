import { z } from 'zod'

/**
 * Variables del servidor. Se validan la primera vez que se piden, no al
 * importar: así `next build` compila sin credenciales y una variable que falta
 * se nombra en el primer uso real, nunca se rellena con un valor por defecto.
 */
/**
 * Supabase solo necesita el origen (https://<proyecto>.supabase.co). Si se pegó
 * con una ruta (p. ej. /rest/v1/), cada consulta da PGRST125: se recorta aquí.
 */
export function origenSupabase(url: string): string {
  return new URL(url).origin
}

const urlSupabase = (nombre: string) =>
  z.url(`${nombre} debe ser una URL absoluta`).transform(origenSupabase)

const esquema = z.object({
  SUPABASE_URL: urlSupabase('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: urlSupabase('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Secreto compartido con n8n: cabecera x-agente-secreto en /api/agente/*.
  AGENTE_SECRETO: z.string().min(24, 'AGENTE_SECRETO debe tener al menos 24 caracteres'),
})

export type Entorno = z.infer<typeof esquema>

let validado: Entorno | null = null

export function validarEntorno(fuente: Record<string, string | undefined>): Entorno {
  const limpio: Record<string, string | undefined> = {}
  for (const nombre of Object.keys(esquema.shape)) {
    const valor = fuente[nombre]
    limpio[nombre] = valor === undefined || valor.trim() === '' ? undefined : valor
  }
  const resultado = esquema.safeParse(limpio)
  if (!resultado.success) {
    const detalles = resultado.error.issues.map((issue) => {
      const nombre = String(issue.path[0] ?? '(desconocida)')
      const motivo = limpio[nombre] === undefined ? 'falta, no está definida' : issue.message
      return `  - ${nombre}: ${motivo}`
    })
    throw new Error(`Configuración de entorno inválida:\n${detalles.join('\n')}`)
  }
  return resultado.data
}

export function env(): Entorno {
  if (!validado) {
    validado = validarEntorno({
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  }
  return validado
}
