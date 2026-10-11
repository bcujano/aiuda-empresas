import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Prueba social de la landing de Aiuda. Todo sale de la base: testimonios que
 * el autor autorizó y clientes marcados como caso público, con sus números
 * reales del CRM. Si no hay datos, la sección no aparece; nunca se rellena.
 */

export type Testimonio = {
  id: string
  autor: string
  cargo: string | null
  empresa: string
  texto: string
  calificacion: number | null
  foto_url: string | null
}

export type CasoCliente = {
  nombre: string
  rubro: string
  ciudad: string | null
  logo_url: string | null
  color_primario: string
  desde: string
  conversaciones: number
  calificados: number
  reuniones: number
}

export type PruebaSocial = { testimonios: Testimonio[]; casos: CasoCliente[] }

const CALIFICADOS = ['calificado', 'agendado', 'asistio', 'cliente']
const REUNIONES = ['agendada', 'confirmada', 'asistio', 'no_asistio']

export async function pruebaSocial(): Promise<PruebaSocial> {
  try {
    const [testimonios, casos] = await Promise.all([leerTestimonios(), leerCasos()])
    return { testimonios, casos }
  } catch {
    return { testimonios: [], casos: [] }
  }
}

async function leerTestimonios(): Promise<Testimonio[]> {
  const { data, error } = await supabaseAdmin()
    .from('testimonios')
    .select('id, autor, cargo, empresa, texto, calificacion, foto_url')
    .eq('autorizado', true)
    .eq('visible', true)
    .order('orden')
    .limit(9)
  if (error) return []
  return (data ?? []) as Testimonio[]
}

async function leerCasos(): Promise<CasoCliente[]> {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('organizaciones')
    .select('id, nombre, rubro, ciudad, logo_url, color_primario, inicio_contrato')
    .eq('caso_publico', true)
    .order('inicio_contrato')
  if (error || !data) return []
  type Fila = {
    id: string
    nombre: string
    rubro: string
    ciudad: string | null
    logo_url: string | null
    color_primario: string
    inicio_contrato: string
  }
  return Promise.all(
    (data as Fila[]).map(async (o) => {
      const contar = async (tabla: 'leads' | 'citas', columna: string, valores?: string[]) => {
        let q = db
          .from(tabla)
          .select('id', { count: 'exact', head: true })
          .eq('organizacion_id', o.id)
        if (valores) q = q.in(columna, valores)
        const { count } = await q
        return count ?? 0
      }
      const [conversaciones, calificados, reuniones] = await Promise.all([
        contar('leads', 'etapa'),
        contar('leads', 'etapa', CALIFICADOS),
        contar('citas', 'estado', REUNIONES),
      ])
      return {
        nombre: o.nombre,
        rubro: o.rubro,
        ciudad: o.ciudad,
        logo_url: o.logo_url,
        color_primario: o.color_primario,
        desde: o.inicio_contrato,
        conversaciones,
        calificados,
        reuniones,
      }
    }),
  )
}
