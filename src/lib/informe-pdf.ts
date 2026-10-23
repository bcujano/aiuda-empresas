import PDFDocument from 'pdfkit'
import type { Informe } from '@/lib/informe-modelo'
import {
  ARENA,
  ESMERALDA,
  FONDO,
  fechaCorta,
  herramientas,
  LINEA,
  M,
  pct,
  SUAVE,
  TINTA,
  usd,
  W,
} from './informe-pdf-base'
import { paginasFinales } from './informe-pdf-final'

/** Informe de campañas en PDF vectorial (gráficos dibujados, no imágenes). A4 vertical. */

export function informePdf(d: Informe): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: { Title: `Informe de campañas · ${d.cliente}` },
  })
  const trozos: Buffer[] = []
  doc.on('data', (t: Buffer) => trozos.push(t))
  const listo = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(trozos))))
  const h = herramientas(doc)
  const { texto, caja, seccion } = h
  const TOTAL = 5

  // ── 1: portada, cifras, embudo y actividad ────────────────
  doc.rect(0, 0, W, 842).fill(FONDO)
  doc.rect(0, 0, W, 232).fill(TINTA)
  doc
    .circle(W - 40, 30, 150)
    .fillOpacity(0.07)
    .fill(ESMERALDA)
    .fillOpacity(1)
  texto('aiuda.', M, 40, { size: 15, bold: true, color: '#ffffff' })
  texto('ADS', M + 44, 40, { size: 15, bold: true, color: '#5ee0a7' })
  texto(`INFORME DE CAMPAÑAS · ${d.canal.toUpperCase()}`, M, 105, {
    size: 10,
    bold: true,
    color: '#5ee0a7',
  })
  texto('Resultados de captación', M, 122, { size: 30, bold: true, color: '#ffffff' })
  texto(`${d.cliente}  ·  ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}`, M, 160, {
    size: 12,
    color: '#c9d3e3',
  })
  texto(`Últimos ${d.ventanaDias} días · inversión inicial de US$ ${d.inversion}`, M, 180, {
    size: 11,
    bold: true,
    color: '#5ee0a7',
  })

  const kpis: [number, string, string][] = [
    [d.contactadas, 'Empresas contactadas', ESMERALDA],
    [d.respondieron, 'Respondieron', TINTA],
    [d.interesadas, 'Interesadas en reunión', TINTA],
    [d.reuniones, 'Reuniones agendadas', ESMERALDA],
  ]
  const kw = (W - 2 * M - 36) / 4
  kpis.forEach(([v, l, c], i) => {
    const x = M + i * (kw + 12)
    caja(x, 208, kw, 86, 12, '#ffffff', LINEA)
    texto(String(v), x + 14, 224, { size: 30, bold: true, color: c })
    texto(l, x + 14, 266, { size: 8.5, color: SUAVE, width: kw - 24 })
  })
  texto(d.explicaciones.cifras, M, 306, { size: 8.5, color: SUAVE, width: W - 2 * M })

  let y = seccion('Embudo de la campaña', d.explicaciones.embudo, 345)
  const etapas: [string, number][] = [
    ['Contactadas', d.contactadas],
    ['Respondieron', d.respondieron],
    ['Interesadas', d.interesadas],
    ['Reuniones', d.reuniones],
  ]
  const bw = W - 2 * M - 170
  etapas.forEach(([e, n], i) => {
    const yy = y + i * 34
    texto(e, M, yy + 6, { size: 10, bold: true })
    caja(M + 100, yy, bw, 22, 6, ARENA)
    caja(
      M + 100,
      yy,
      Math.max(n ? 8 : 0, (n / Math.max(1, d.contactadas)) * bw),
      22,
      6,
      i === 3 ? ESMERALDA : TINTA,
    )
    texto(String(n), M + 100 + bw + 10, yy + 5, { size: 11, bold: true })
    if (i > 0)
      texto(pct(n, etapas[i - 1]?.[1] ?? 0), M + 100 + bw + 40, yy + 7, { size: 8.5, color: SUAVE })
  })

  y = seccion(
    `Empresas contactadas por día (últimos ${d.ventanaDias} días)`,
    `${d.explicaciones.actividad} Barra verde: contactadas. Barra oscura: respondieron.`,
    y + 4 * 34 + 12,
  )
  const gx = M + 24
  const gh = 130
  const gw = W - 2 * M - 24
  const dias = d.porDia.slice(-d.ventanaDias)
  const maxD = Math.max(1, ...dias.map((x) => x.n))
  for (let k = 0; k <= 3; k++) {
    const yy = y + 14 + gh - (gh * k) / 3
    doc
      .moveTo(gx, yy)
      .lineTo(gx + gw, yy)
      .lineWidth(0.5)
      .stroke(LINEA)
    texto(String(Math.round((maxD * k) / 3)), M, yy - 4, { size: 7, color: SUAVE })
  }
  const paso = gw / Math.max(1, dias.length)
  dias.forEach((x, i) => {
    const alto = (x.n / maxD) * gh
    const bx = gx + i * paso + paso * 0.18
    caja(bx, y + 14 + gh - alto, paso * 0.64, alto, 3, ESMERALDA)
    if (x.resp > 0)
      caja(
        bx + paso * 0.22,
        y + 14 + gh - (x.resp / maxD) * gh,
        paso * 0.2,
        (x.resp / maxD) * gh,
        2,
        TINTA,
      )
    texto(String(x.n), bx - 4, y + 14 + gh - alto - 11, {
      size: 7,
      bold: true,
      width: paso * 0.64 + 8,
      align: 'center',
    })
    texto(fechaCorta(x.dia), bx - 6, y + 20 + gh, {
      size: 6.5,
      color: SUAVE,
      width: paso * 0.64 + 12,
      align: 'center',
    })
  })
  h.pagina(1, TOTAL, true)

  // ── 2: números transparentes y sectores ───────────────────
  doc.addPage({ size: 'A4', margin: 0 })
  doc.rect(0, 0, W, 842).fill(FONDO)
  h.pagina(2, TOTAL, true)
  texto('aiuda.', M, 28, { size: 11, bold: true })
  texto('ADS', M + 36, 28, { size: 11, bold: true, color: ESMERALDA })
  y = seccion(
    'Efectividad de la campaña',
    'Lo que rinde cada dólar y cada mensaje, y si vamos mejorando semana a semana.',
    60,
  )
  const costo = (n: number) => (n > 0 ? usd(d.inversion / n) : '—')
  const mets: [string, string][] = [
    [pct(d.respondieron, d.contactadas), 'respuesta de personas'],
    [
      d.contactadas ? ((d.interesadas / d.contactadas) * 100).toFixed(1) : '—',
      'interesadas por cada 100',
    ],
    [costo(d.respondieron), 'por conversación real'],
    [costo(d.interesadas), 'por empresa interesada'],
  ]
  const mw = (W - 2 * M - 36) / 4
  mets.forEach(([v, l], i) => {
    const x = M + i * (mw + 12)
    caja(x, y, mw, 56, 10, '#ffffff', LINEA)
    texto(v, x + 12, y + 9, { size: 17, bold: true, color: ESMERALDA })
    texto(l, x + 12, y + 36, { size: 7.5, color: SUAVE, width: mw - 20 })
  })
  const u7 = d.porDia.slice(-7)
  const a7 = d.porDia.slice(-14, -7)
  const cu = u7.reduce((t, x) => t + x.n, 0)
  const ru = u7.reduce((t, x) => t + x.resp, 0)
  const ca = a7.reduce((t, x) => t + x.n, 0)
  const ra = a7.reduce((t, x) => t + x.resp, 0)
  texto(
    ca > 0
      ? `Últimos 7 días: ${cu} contactadas y ${pct(ru, cu)} de respuesta. Los 7 días anteriores: ${ca} contactadas y ${pct(ra, ca)}.`
      : `Primera semana de la campaña: ${cu} contactadas y ${pct(ru, cu)} de respuesta. Aún no hay semana anterior para comparar.`,
    M,
    y + 66,
    { size: 9, bold: true, color: TINTA, width: W - 2 * M },
  )
  y = seccion(
    'Números transparentes',
    'Todo lo que pasó con cada empresa contactada, sin maquillaje: lo bueno y lo que no.',
    y + 98,
  )
  const filas: [string, number, string][] = [
    ['Empresas contactadas', d.contactadas, 'A cada una se le escribió una vez.'],
    [
      'Respondieron como personas',
      d.respondieron,
      `${pct(d.respondieron, d.contactadas)} de las contactadas.`,
    ],
    [
      'Respuestas automáticas',
      d.automaticas,
      'Asistentes o saludos de otras empresas; no cuentan como respuesta.',
    ],
    ['Dijeron que no', d.rechazos, 'Sin interés por ahora o ya tienen abogado.'],
    ['Pidieron no recibir más', d.bajas, 'Se respetó de inmediato.'],
    ['Interesadas en reunirse', d.interesadas, 'Aceptaron o pidieron coordinar una reunión.'],
    ['Reuniones agendadas', d.reuniones, 'Con fecha y hora en la agenda.'],
  ]
  filas.forEach(([t, n, nota], i) => {
    const yy = y + i * 30
    caja(M, yy, W - 2 * M, 26, 8, i % 2 ? '#ffffff' : ARENA)
    texto(t, M + 12, yy + 8, { size: 10, bold: true, width: 190 })
    texto(String(n), M + 205, yy + 6, { size: 13, bold: true, color: ESMERALDA })
    texto(nota, M + 250, yy + 9, { size: 8.5, color: SUAVE, width: W - 2 * M - 260 })
  })

  y = seccion('Contactos por sector', d.explicaciones.sectores, y + filas.length * 30 + 18)
  const sectores = d.porSector.slice(0, 6)
  const maxS = Math.max(1, ...sectores.map((s) => s.n))
  sectores.forEach((s, i) => {
    const yy = y + i * 26
    texto(s.sector.charAt(0).toUpperCase() + s.sector.slice(1), M, yy + 5, { size: 9, width: 150 })
    const sw = W - 2 * M - 250
    caja(M + 160, yy, sw, 16, 5, ARENA)
    caja(
      M + 160,
      yy,
      Math.max(6, (s.n / maxS) * sw),
      16,
      5,
      s.sector === d.foco ? ESMERALDA : TINTA,
    )
    texto(
      `${s.n} contactadas · ${s.respondieron} resp. · ${s.interesadas} int.`,
      M + 160 + sw + 8,
      yy + 4,
      { size: 8, bold: true, width: 130 },
    )
  })
  if (d.foco)
    texto(`Sector elegido para la siguiente etapa: ${d.foco}.`, M, y + sectores.length * 26 + 8, {
      size: 9.5,
      bold: true,
      color: ESMERALDA,
    })

  paginasFinales(doc, h, d, TOTAL)
  doc.end()
  return listo
}
