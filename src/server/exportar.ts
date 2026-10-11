import { aCsv, type Columna } from '@/lib/csv'
import { fechaHora } from '@/lib/formato'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Descargas en CSV (se abren en Excel) de UNA organización. Es lo que el
 * cliente se lleva si deja el servicio: sus datos son suyos.
 */

export const EXPORTABLES = ['leads', 'citas', 'actividad', 'seguimientos'] as const
export type Exportable = (typeof EXPORTABLES)[number]

type Fila = Record<string, unknown>
const t = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const f = (v: unknown) => (v ? fechaHora(String(v)) : '')

const COLUMNAS: Record<Exportable, { select: string; orden: string; columnas: Columna<Fila>[] }> = {
  leads: {
    select: '*, angulo:angulos(servicio, codigo)',
    orden: 'created_at',
    columnas: [
      { titulo: 'Creado', valor: (r) => f(r.created_at) },
      { titulo: 'Nombre', valor: (r) => t(r.nombre) },
      { titulo: 'Empresa', valor: (r) => t(r.empresa) },
      { titulo: 'RUC', valor: (r) => t(r.ruc) },
      { titulo: 'Cargo', valor: (r) => t(r.cargo) },
      { titulo: 'Colaboradores', valor: (r) => t(r.colaboradores) },
      { titulo: 'Ciudad', valor: (r) => t(r.ciudad) },
      { titulo: 'Teléfono', valor: (r) => t(r.telefono) },
      { titulo: 'Necesidad', valor: (r) => t(r.necesidad) },
      { titulo: 'Urgencia', valor: (r) => t(r.urgencia) },
      { titulo: 'Encaje', valor: (r) => t(r.encaje) },
      { titulo: 'Etapa', valor: (r) => t(r.etapa) },
      { titulo: 'Motivo de descarte', valor: (r) => t(r.motivo_descarte) },
      { titulo: 'Servicio', valor: (r) => t((r.angulo as Fila | null)?.servicio) },
      { titulo: 'Origen', valor: (r) => t(r.origen) },
      { titulo: 'No contactar', valor: (r) => (r.no_contactar ? 'sí' : 'no') },
    ],
  },
  citas: {
    select: '*, lead:leads(nombre, empresa, telefono)',
    orden: 'inicia_at',
    columnas: [
      { titulo: 'Inicia', valor: (r) => f(r.inicia_at) },
      { titulo: 'Termina', valor: (r) => f(r.termina_at) },
      { titulo: 'Empresa', valor: (r) => t((r.lead as Fila | null)?.empresa) },
      { titulo: 'Contacto', valor: (r) => t((r.lead as Fila | null)?.nombre) },
      { titulo: 'Teléfono', valor: (r) => t((r.lead as Fila | null)?.telefono) },
      { titulo: 'Modalidad', valor: (r) => t(r.modalidad) },
      { titulo: 'Estado', valor: (r) => t(r.estado) },
      { titulo: 'Origen', valor: (r) => t(r.origen) },
      { titulo: 'Confirmada', valor: (r) => f(r.confirmada_at) },
      { titulo: 'Notas', valor: (r) => t(r.notas) },
    ],
  },
  actividad: {
    select: '*, lead:leads(nombre, empresa, telefono)',
    orden: 'created_at',
    columnas: [
      { titulo: 'Fecha', valor: (r) => f(r.created_at) },
      { titulo: 'Empresa', valor: (r) => t((r.lead as Fila | null)?.empresa) },
      { titulo: 'Teléfono', valor: (r) => t((r.lead as Fila | null)?.telefono) },
      { titulo: 'Tipo', valor: (r) => t(r.tipo) },
      { titulo: 'Autor', valor: (r) => t(r.autor) },
      { titulo: 'Contenido', valor: (r) => t(r.contenido) },
    ],
  },
  seguimientos: {
    select: '*, lead:leads(nombre, empresa, telefono)',
    orden: 'programado_at',
    columnas: [
      { titulo: 'Programado', valor: (r) => f(r.programado_at) },
      { titulo: 'Enviado', valor: (r) => f(r.enviado_at) },
      { titulo: 'Empresa', valor: (r) => t((r.lead as Fila | null)?.empresa) },
      { titulo: 'Teléfono', valor: (r) => t((r.lead as Fila | null)?.telefono) },
      { titulo: 'Secuencia', valor: (r) => t(r.secuencia) },
      { titulo: 'Estado', valor: (r) => t(r.estado) },
      { titulo: 'Mensaje', valor: (r) => t(r.texto) },
    ],
  },
}

/** Lee por páginas de 1.000 para no cargar la base de golpe. */
export async function exportar(orgId: string, tipo: Exportable): Promise<string> {
  const def = COLUMNAS[tipo]
  const filas: Fila[] = []
  for (let desde = 0; desde < 50_000; desde += 1000) {
    const { data, error } = await supabaseAdmin()
      .from(tipo)
      .select(def.select)
      .eq('organizacion_id', orgId)
      .order(def.orden, { ascending: true })
      .range(desde, desde + 999)
    if (error) throw new Error(`No se pudo exportar: ${error.message}`)
    filas.push(...((data ?? []) as unknown as Fila[]))
    if (!data || data.length < 1000) break
  }
  return aCsv(filas, def.columnas)
}
