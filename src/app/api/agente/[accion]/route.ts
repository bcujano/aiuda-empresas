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
  esquemaSeguimiento,
  secretoValido,
} from '@/server/agente-reglas'
import { esquemaResultadoFrio, marcarProspecto, prospectosPorEnviar } from '@/server/contacto-frio'
import {
  esquemaRegistroFrio,
  marcarRegistro,
  registrosPorHacer,
} from '@/server/contacto-frio-respuestas'
import { esquemaResultadoInforme, informesPorEnviar, marcarInforme } from '@/server/informe-envio'
import { marcarRecordatorio, recordatoriosPendientes } from '@/server/recordatorios'
import { marcarSeguimiento, seguimientosPorEnviar } from '@/server/seguimientos'

/**
 * API del agente de n8n. Cabecera obligatoria `x-agente-secreto`.
 *   POST /api/agente/contexto → organización, servicios, conocimiento, lead y ángulo detectado
 *   POST /api/agente/lead     → crea o actualiza el lead y registra la actividad
 *   POST /api/agente/canal    → número de WhatsApp del cliente de una cuenta de Chatwoot
 *   POST /api/agente/disponibilidad → horas libres de la agenda para ofrecer
 *   POST /api/agente/agendar  → reserva (o reprograma) una hora libre y avisa al equipo
 *   POST /api/agente/recordatorios → recordatorios de reuniones por enviar
 *   POST /api/agente/recordatorio_enviado → marca un recordatorio como entregado
 *   POST /api/agente/seguimientos → seguimientos por enviar ahora (ya decidido el canal)
 *   POST /api/agente/frio → contactos en frío por enviar ahora (WhatsApp con plantilla y correo)
 *   POST /api/agente/informes → informes del cliente que ya toca enviar por correo (con su PDF)
 *   POST /api/agente/informe_resultado → marca el informe como enviado o fallido
 *   POST /api/agente/frio_registros → WhatsApp en frío por registrar en Chatwoot
 *   POST /api/agente/frio_registrado → marca el registro hecho
 *   POST /api/agente/frio_resultado → marca un contacto en frío como enviado o fallido
 *   POST /api/agente/seguimiento_resultado → marca un seguimiento como enviado o fallido
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
      analisis.data.fecha,
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

  if (accion === 'seguimientos') {
    return NextResponse.json({ seguimientos: await seguimientosPorEnviar() })
  }

  if (accion === 'frio') {
    return NextResponse.json({ contactos: await prospectosPorEnviar() })
  }

  if (accion === 'informes') {
    return NextResponse.json({ informes: await informesPorEnviar() })
  }

  if (accion === 'informe_resultado') {
    const analisis = esquemaResultadoInforme.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    return NextResponse.json({ ok: await marcarInforme(analisis.data) })
  }

  if (accion === 'frio_registros') {
    return NextResponse.json({ registros: await registrosPorHacer() })
  }

  if (accion === 'frio_registrado') {
    const analisis = esquemaRegistroFrio.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    return NextResponse.json({ ok: await marcarRegistro(analisis.data) })
  }

  if (accion === 'frio_resultado') {
    const analisis = esquemaResultadoFrio.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    return NextResponse.json({ ok: await marcarProspecto(analisis.data) })
  }

  if (accion === 'seguimiento_resultado') {
    const analisis = esquemaSeguimiento.safeParse(cuerpo)
    if (!analisis.success) return invalido(analisis.error.issues)
    const { id, ok, error } = analisis.data
    return NextResponse.json({ ok: await marcarSeguimiento(id, ok, error) })
  }

  return NextResponse.json({ error: 'ACCION_DESCONOCIDA' }, { status: 404 })
}

function invalido(issues: { path: PropertyKey[]; message: string }[]) {
  const detalle = issues.map((i) => `${i.path.map(String).join('.')}: ${i.message}`)
  return NextResponse.json({ error: 'DATOS_INVALIDOS', detalle }, { status: 400 })
}
