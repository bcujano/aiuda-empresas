import type { Etapa, Origen } from '@/types/database'

/** Ecuador continental es UTC-5 fijo, sin horario de verano. */
export const ZONA = 'America/Guayaquil'

/** Fecha de hoy en Quito, AAAA-MM-DD. */
export function hoyQuito(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(ahora)
}

export function fechaHora(iso: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function fecha(iso: string): string {
  return new Intl.DateTimeFormat('es-EC', { timeZone: ZONA, dateStyle: 'medium' }).format(
    new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso),
  )
}

export const ETAPA_LEGIBLE: Record<Etapa, string> = {
  nuevo: 'Nuevo',
  calificado: 'Calificado',
  agendado: 'Agendado',
  asistio: 'Asistió',
  cliente: 'Cliente',
  descartado: 'Descartado',
}

export const ORIGEN_LEGIBLE: Record<Origen, string> = {
  anuncio_whatsapp: 'Anuncio a WhatsApp',
  landing: 'Landing',
  whatsapp_directo: 'WhatsApp directo',
  redes_cliente: 'Redes del cliente',
  manual: 'Ingreso manual',
}
