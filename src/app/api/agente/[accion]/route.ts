import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { agendarDesdeAgente, disponibilidadParaAgente } from '@/server/agenda'
import { canalPorChatwoot, contextoAgente, registrarDesdeAgente } from '@/server/agente'
import {
  esquemaAgendar,
  esquemaCanal,
  esquemaContexto,
  esquemaDisponibilidad,
  esquemaLead,
  esquemaRecordatorio,
  secretoValido,
} from '@/server/agente-reglas'
import { marcarRecordatorio, recordatoriosPendientes } from '@/server/recordatorios'

/**
 * API del agente de n8n. Cabecera obligatoria `x-agente-secreto`.
 *   POST /api/agente/contexto → organización, servicios, conocimiento, lead y ángulo detectado
 *   POST /api/agente/lead     → crea o actualiza el lead y registra la actividad
 *   POST /api/agente/canal    → número de WhatsApp del cliente de una cuenta de Chatwoot
 *   POST /api/agente/disponibilidad → horas libres de la agenda para ofrecer
 *   POST /api/agente/agendar  → reserva (o reprograma) una hora libre y avisa al equipo
 *   POST /api/agente/recordatorios → recordatorios de reuniones por enviar
 *   POST /api/agente/recordatorio_enviado → marca un recordatorio como entregado
 * Los errores van como códigos en MAYÚSCULAS para que el workflow los distinga.
 */
export async function POST(peticion: Request, { params }: { params: Promise<{ accion: string }> }) {
  if (!secretoValido(peticion.headers.get('x-agente-secreto'), env().AGENTE_SECRETO)) {
    return NextResponse.json({ error: 'NO_AUTORIZADO' }, { status: 401 })
  }
  const { accion } = await params
  const cuerpo: unknown = await peticion.json().catch(() => null)

  if (accion === 'contexto') {
    const analisis = esquemaContexto.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    const contexto = await contextoAgente(analisis.data)
    if (!contexto) return NextResponse.json({ error: 'ORGANIZACION_DESCONOCIDA' }, { status: 404 })
    return NextResponse.json(contexto)
  }

  if (accion === 'lead') {
    const analisis = esquemaLead.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    const resultado = await registrarDesdeAgente(analisis.data)
    if (!resultado.ok) {
      const estado = resultado.error === 'ORGANIZACION_DESCONOCIDA' ? 404 : 422
      return NextResponse.json({ error: resultado.error }, { status: estado })
    }
    return NextResponse.json(resultado)
  }

  if (accion === 'canal') {
    const analisis = esquemaCanal.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    const canal = await canalPorChatwoot(analisis.data)
    if (!canal) return NextResponse.json({ error: 'CANAL_DESCONOCIDO' }, { status: 404 })
    return NextResponse.json(canal)
  }

  if (accion === 'disponibilidad') {
    const analisis = esquemaDisponibilidad.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    const datos = await disponibilidadParaAgente(
      analisis.data.phone_number_id,
      analisis.data.telefono,
    )
    if (!datos) return NextResponse.json({ error: 'ORGANIZACION_DESCONOCIDA' }, { status: 404 })
    return NextResponse.json(datos)
  }

  if (accion === 'agendar') {
    const analisis = esquemaAgendar.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    // Siempre 200: el agente lee `ok` y, si falla, las horas que sí están libres.
    return NextResponse.json(await agendarDesdeAgente(analisis.data))
  }

  if (accion === 'recordatorios') {
    return NextResponse.json({ recordatorios: await recordatoriosPendientes() })
  }

  if (accion === 'recordatorio_enviado') {
    const analisis = esquemaRecordatorio.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    return NextResponse.json({
      ok: await marcarRecordatorio(analisis.data.cita_id, analisis.data.tipo),
    })
  }

  return NextResponse.json({ error: 'ACCION_DESCONOCIDA' }, { status: 404 })
}

function invalido(issues: { path: PropertyKey[]; message: string }[]) {
  const detalle = issues.map((i) => `${i.path.map(String).join('.')}: ${i.message}`)
  return NextResponse.json({ error: 'DATOS_INVALIDOS', detalle }, { status: 400 })
}
