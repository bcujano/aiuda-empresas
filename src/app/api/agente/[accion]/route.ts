import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { canalPorChatwoot, contextoAgente, registrarDesdeAgente } from '@/server/agente'
import { esquemaCanal, esquemaContexto, esquemaLead, secretoValido } from '@/server/agente-reglas'

/**
 * API del agente de n8n. Cabecera obligatoria `x-agente-secreto`.
 *   POST /api/agente/contexto → organización, servicios, conocimiento, lead y ángulo detectado
 *   POST /api/agente/lead     → crea o actualiza el lead y registra la actividad
 *   POST /api/agente/canal    → número de WhatsApp del cliente de una cuenta de Chatwoot
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

  return NextResponse.json({ error: 'ACCION_DESCONOCIDA' }, { status: 404 })
}

function invalido(issues: { path: PropertyKey[]; message: string }[]) {
  const detalle = issues.map((i) => `${i.path.map(String).join('.')}: ${i.message}`)
  return NextResponse.json({ error: 'DATOS_INVALIDOS', detalle }, { status: 400 })
}
