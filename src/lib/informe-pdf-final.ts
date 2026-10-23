import type PDFDocument from 'pdfkit'
import { cuentasDolares, type Informe, type Persona } from '@/lib/informe-modelo'
import {
  CALIENTE,
  ESMERALDA,
  FRIO,
  type Herr,
  LINEA,
  M,
  SUAVE,
  TIBIO,
  TINTA,
  usd,
  W,
} from './informe-pdf-base'

/** Páginas 3 a 5 del informe: temperatura, caso a verificar, conversaciones, dólares y próximos pasos. */

type Doc = InstanceType<typeof PDFDocument>

export function paginasFinales(doc: Doc, h: Herr, d: Informe, total: number) {
  const { texto, alto, caja, seccion } = h

  // ── 3: calientes, tibios y fríos + caso a verificar ───────
  doc.addPage({ size: 'A4', margin: 0 })
  h.pagina(3, total)
  let y = seccion('Quién está caliente, tibio y frío', d.explicaciones.calor, 60)
  const bloque = (titulo: string, color: string, lista: Persona[]) => {
    caja(M, y, W - 2 * M, 22, 7, color)
    texto(`${titulo}  ·  ${lista.length}`, M + 12, y + 6, {
      size: 10,
      bold: true,
      color: '#ffffff',
    })
    y += 26
    if (lista.length === 0) {
      texto('Sin personas en esta lista por ahora.', M + 12, y + 2, { size: 8.5, color: SUAVE })
      y += 20
    }
    for (const p of lista.slice(0, 5)) {
      doc.circle(M + 6, y + 8, 3).fill(color)
      texto(`${p.nombre}${p.empresa ? ` · ${p.empresa}` : ''}`, M + 18, y + 2, {
        size: 9,
        bold: true,
        width: 360,
      })
      texto(p.fecha, W - M - 80, y + 2, { size: 8.5, color: SUAVE, width: 80, align: 'right' })
      texto(p.nota, M + 18, y + 14, { size: 7.5, color: SUAVE, width: 440 })
      y += 27
    }
    y += 8
  }
  bloque('CALIENTES · quieren reunirse', CALIENTE, d.calientes)
  bloque('TIBIOS · conversaron o preguntaron', TIBIO, d.tibios)
  bloque('FRÍOS · sin interés por ahora', FRIO, d.frios)

  if (d.casoExito.activo) {
    y = seccion('Caso destacado a verificar', d.explicaciones.exito, y + 6)
    const t = d.casoExito.texto
    const hh = 72 + alto(t, W - 2 * M - 40, 10)
    doc
      .roundedRect(M, y, W - 2 * M, hh, 14)
      .lineWidth(1.5)
      .fillAndStroke('#ffffff', ESMERALDA)
    caja(M + 14, y + 12, 118, 18, 9, ESMERALDA)
    texto('CASO DESTACADO', M + 24, y + 17, { size: 8, bold: true, color: '#ffffff' })
    const p = d.casoExito.persona
    texto(
      `${p.nombre}${p.empresa ? ` · ${p.empresa}` : ''}${p.fecha ? ` · ${p.fecha}` : ''}`,
      M + 144,
      y + 16,
      { size: 10, bold: true, width: W - 2 * M - 160 },
    )
    texto(t, M + 20, y + 40, { size: 10, color: TINTA, width: W - 2 * M - 40 })
    texto(
      p.nota || 'Pedimos al equipo verificar si esta reunión se realizó.',
      M + 20,
      y + 48 + alto(t, W - 2 * M - 40, 10),
      { size: 9, bold: true, color: ESMERALDA, width: W - 2 * M - 40 },
    )
  }

  // ── 4: conversaciones ─────────────────────────────────────
  doc.addPage({ size: 'A4', margin: 0 })
  h.pagina(4, total)
  y = seccion('Cómo conversa el asistente', d.explicaciones.charlas, 60)
  const cw = (W - 2 * M - 16) / 2
  const charlas = d.charlas.slice(0, 2)
  const altoCharla = (c: Informe['charlas'][number]) =>
    c.mensajes.reduce((t, m) => t + alto(m.texto, cw * 0.8 - 16, 8) + 21, 0)
  const hp = Math.min(640, Math.max(200, ...charlas.map(altoCharla)) + 74)
  charlas.forEach((c, i) => {
    const x = M + i * (cw + 16)
    caja(x, y, cw, hp, 18, '#efe7dc', LINEA)
    caja(x, y, cw, 34, 18, '#075e54')
    doc.rect(x, y + 16, cw, 18).fill('#075e54')
    texto(c.titulo, x + 14, y + 8, { size: 8.5, bold: true, color: '#ffffff', width: cw - 28 })
    if (c.ilustrativa)
      texto('Ejemplo ilustrativo (conversación simulada)', x + 14, y + 21, {
        size: 7,
        color: '#d9fdd3',
        width: cw - 28,
      })
    let yy = y + 46
    for (const m of c.mensajes) {
      const ancho = cw * 0.8
      const bh = alto(m.texto, ancho - 16, 8) + 14
      if (yy + bh > y + hp - 8) break
      const bx = m.de === 'asistente' ? x + cw - ancho - 10 : x + 10
      caja(bx, yy, ancho, bh, 8, m.de === 'asistente' ? '#d9fdd3' : '#ffffff')
      texto(m.texto, bx + 8, yy + 7, { size: 8, width: ancho - 16 })
      yy += bh + 7
    }
  })

  // ── 5: dólares, conclusiones y próximos pasos ─────────────
  doc.addPage({ size: 'A4', margin: 0 })
  h.pagina(5, total)
  const c = cuentasDolares(d.dolares, d.inversion)
  y = seccion('Lo que importa: los dólares', d.explicaciones.dolares, 60)
  const mitad = (W - 2 * M - 14) / 2
  caja(M, y, mitad, 118, 14, '#ffffff', LINEA)
  texto('COSTO DE LA PRUEBA (3 MESES)', M + 16, y + 14, { size: 8, bold: true, color: SUAVE })
  texto(usd(c.costoTrimestre + d.inversion), M + 16, y + 30, { size: 24, bold: true })
  texto(
    `Servicio: ${usd(d.dolares.servicioMensual)} + IVA al mes × ${d.dolares.meses} meses.\nPauta del testeo: ${usd(d.inversion)}.`,
    M + 16,
    y + 68,
    { size: 8.5, color: SUAVE, width: mitad - 32 },
  )
  caja(M + mitad + 14, y, mitad, 118, 14, TINTA)
  texto('UN CLIENTE NUEVO VALE', M + mitad + 30, y + 14, { size: 8, bold: true, color: '#5ee0a7' })
  texto(usd(c.valorAnual), M + mitad + 30, y + 30, { size: 24, bold: true, color: '#ffffff' })
  texto(
    `Plan anual de ${usd(d.dolares.planMensualCliente)} al mes durante 12 meses.`,
    M + mitad + 30,
    y + 68,
    { size: 8.5, color: '#c9d3e3', width: mitad - 32 },
  )
  y += 132
  caja(M, y, W - 2 * M, 44, 12, ESMERALDA)
  texto(
    `Una sola reunión que cierre ese plan paga el trimestre completo ${c.veces.toLocaleString('es-EC', { maximumFractionDigits: 1 })} veces.`,
    M + 16,
    y + 9,
    { size: 11, bold: true, color: '#ffffff', width: W - 2 * M - 32 },
  )
  texto(
    `Se pagaría con ${c.mesesParaPagar.toLocaleString('es-EC', { maximumFractionDigits: 1 })} mes(es) de ese plan.`,
    M + 16,
    y + 26,
    { size: 9, color: '#d9fdd3' },
  )
  y += 58
  if (d.dolares.propuestaDia > 0) {
    texto(
      `Propuesta de inversión para la siguiente etapa: ${usd(d.dolares.propuestaDia)} por día, enfocada en ${d.foco || 'el sector a definir'}. Monto, plazo y desembolso se acuerdan conforme al acuerdo vigente.`,
      M,
      y,
      { size: 9.5, bold: true, width: W - 2 * M },
    )
    y += 36
  } else {
    texto('Monto del siguiente desembolso: por acordar, conforme al acuerdo vigente.', M, y, {
      size: 9.5,
      bold: true,
      width: W - 2 * M,
    })
    y += 22
  }

  y = seccion('Conclusiones', '', y + 6)
  for (const t of d.conclusiones) {
    doc.circle(M + 4, y + 6, 3).fill(ESMERALDA)
    texto(t, M + 16, y, { size: 9.5, width: W - 2 * M - 20 })
    y += alto(t, W - 2 * M - 20, 9.5) + 9
  }
  y = seccion('Lo que haremos de aquí en adelante', '', y + 8)
  d.pasos.forEach((t, i) => {
    caja(M, y - 1, 18, 18, 9, TINTA)
    texto(String(i + 1), M, y + 3, {
      size: 9,
      bold: true,
      color: '#ffffff',
      width: 18,
      align: 'center',
    })
    texto(t, M + 28, y + 2, { size: 9.5, width: W - 2 * M - 30 })
    y += Math.max(24, alto(t, W - 2 * M - 30, 9.5) + 10)
  })
}
