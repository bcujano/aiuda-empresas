/** Tipos de las filas de la base. Reflejan supabase/migrations/** a mano. */

export type Rol = 'superadmin' | 'admin' | 'operador'
export type EstadoPlan = 'prueba' | 'activo' | 'restringido' | 'suspendido'

export type Organizacion = {
  id: string
  slug: string
  codigo: string
  nombre: string
  rubro: string
  especialista: string
  ciudad: string | null
  logo_url: string | null
  color_primario: string
  estado_plan: EstadoPlan
  inicio_contrato: string
  prueba_hasta: string
  modulos: string[]
  wa_numero: string | null
  wa_phone_number_id: string | null
  chatwoot_cuenta_id: number | null
  chatwoot_bandeja_id: number | null
  pixel_id: string | null
  cita_minutos: number
  cita_intervalo_minutos: number
  cita_anticipacion_horas: number
  cita_dias_adelante: number
  modalidades: ('virtual' | 'presencial')[]
  direccion: string | null
  aviso_email: string | null
  aviso_whatsapp: string | null
  plan_codigo: string
  precio_acordado: number | null
  meta_ad_account_id: string | null
  meta_page_id: string | null
  meta_ig_id: string | null
  drive_carpeta_id: string | null
  created_at: string
  updated_at: string
}

export type Plan = {
  codigo: string
  nombre: string
  precio_mensual: number
  mas_iva: boolean
  descripcion: string
  modulos: string[]
  limites: Record<string, unknown>
  orden: number
  activo: boolean
}

export type Usuario = {
  id: string
  auth_user_id: string
  organizacion_id: string | null
  nombre_completo: string
  rol: Rol
  estado: 'activo' | 'inactivo'
}

export type PreguntaFrecuente = { pregunta: string; respuesta: string }

export type Angulo = {
  id: string
  organizacion_id: string
  slug: string
  codigo: string
  servicio: string
  titular: string
  subtitulo: string
  dolores: string[]
  para_quien: string[]
  no_para_quien: string[]
  preguntas: PreguntaFrecuente[]
  mensaje_whatsapp: string
  meta_ad_ids: string[]
  orden: number
  activo: boolean
}

export const ETAPAS = [
  'nuevo',
  'calificado',
  'agendado',
  'asistio',
  'cliente',
  'descartado',
] as const
export type Etapa = (typeof ETAPAS)[number]

export const ORIGENES = [
  'anuncio_whatsapp',
  'landing',
  'whatsapp_directo',
  'redes_cliente',
  'manual',
] as const
export type Origen = (typeof ORIGENES)[number]

export const COLABORADORES = ['1-9', '10-49', '50-199', '200+'] as const
export type Colaboradores = (typeof COLABORADORES)[number]

export type Lead = {
  id: string
  organizacion_id: string
  telefono: string
  nombre: string | null
  empresa: string | null
  ruc: string | null
  cargo: string | null
  colaboradores: Colaboradores | null
  ciudad: string | null
  necesidad: string | null
  urgencia: 'baja' | 'media' | 'alta' | null
  encaje: number | null
  etapa: Etapa
  motivo_descarte: string | null
  origen: Origen
  angulo_id: string | null
  referral: Record<string, unknown> | null
  meta_ad_id: string | null
  primer_contacto_at: string
  ultimo_inbound_at: string | null
  ventana_horas: 24 | 72
  notas: string | null
  chatwoot_contacto_id: number | null
  chatwoot_conversacion_id: number | null
  created_at: string
  updated_at: string
}

export type EstadoCita = 'agendada' | 'confirmada' | 'asistio' | 'no_asistio' | 'cancelada'

export type Cita = {
  id: string
  organizacion_id: string
  lead_id: string
  inicia_at: string
  termina_at: string
  modalidad: 'virtual' | 'presencial'
  estado: EstadoCita
  google_event_id: string | null
  enlace_reunion: string | null
  notas: string | null
  token: string
  origen: 'agente' | 'equipo'
  confirmada_at: string | null
  aviso_equipo_at: string | null
  recordatorio_24h_at: string | null
  recordatorio_2h_at: string | null
  created_at: string
}

export type TipoActividad =
  | 'mensaje_entrante'
  | 'mensaje_agente'
  | 'mensaje_persona'
  | 'cambio_etapa'
  | 'nota'
  | 'cita'
  | 'escalado'

export type Actividad = {
  id: string
  lead_id: string
  tipo: TipoActividad
  contenido: string
  autor: string | null
  created_at: string
}
