import PDFDocument from 'pdfkit'
import type { Informe } from '@/server/informe'

/** Informe de campañas en PDF vectorial (gráficos dibujados, no imágenes). A4 vertical, dos páginas. */

const TINTA = '#0f1e33'
const ESMERALDA = '#0b8a5a'
const ARENA = '#f3ece0'
const LINEA = '#e6dccb'
const SUAVE = '#5b6577'
const W = 595
const M = 40

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fechaCorta = (iso: string) =>
  `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]}`
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—')

export function informePdf(d: Informe): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: { Title: `Informe de campañas · ${d.organizacion.nombre}` },
  })
  const trozos: Buffer[] = []
  doc.on('data', (t: Buffer) => trozos.push(t))
  const listo = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(trozos))))

  const texto = (
    t: string,
    x: number,
    y: number,
    o: {
      size?: number
      color?: string
      bold?: boolean
      width?: number
      align?: 'left' | 'center' | 'right'
    } = {},
  ) => {
    doc
      .font(o.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(o.size ?? 10)
      .fillColor(o.color ?? TINTA)
    doc.text(t, x, y, { width: o.width, align: o.align, lineBreak: o.width !== undefined })
  }
  const caja = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    relleno: string,
    borde?: string,
  ) => {
    doc.roundedRect(x, y, w, h, r).fillAndStroke(relleno, borde ?? relleno)
  }
  const titulo = (t: string, y: number) => {
    doc.rect(M, y + 2, 3, 14).fill(ESMERALDA)
    texto(t, M + 10, y, { size: 13, bold: true })
  }

  // ── Página 1: portada y cifras ─────────────────────────────
  doc.rect(0, 0, W, 842).fill('#fbf8f3')
  doc.rect(0, 0, W, 215).fill(TINTA)
  doc
    .circle(W - 40, 30, 150)
    .fillOpacity(0.07)
    .fill(ESMERALDA)
    .fillOpacity(1)
  texto('aiuda.', M, 40, { size: 15, bold: true, color: '#ffffff' })
  texto('ADS', M + 44, 40, { size: 15, bold: true, color: '#5ee0a7' })
  texto('INFORME DE CAMPAÑAS', M, 105, { size: 10, bold: true, color: '#5ee0a7' })
  texto('Resultados de captación', M, 122, { size: 30, bold: true, color: '#ffffff' })
  texto(`${d.organizacion.nombre}  ·  ${fechaCorta(d.desde)} al ${fechaCorta(d.hasta)}`, M, 168, {
    size: 12,
    color: '#c9d3e3',
  })

  const kpis: [string, string, string][] = [
    [String(d.contactadas), 'Empresas contactadas', ESMERALDA],
    [String(d.respondieron), 'Respondieron', TINTA],
    [String(d.interesadas), 'Interesadas en reunión', TINTA],
    [String(d.reuniones), 'Reuniones agendadas', ESMERALDA],
  ]
  const kw = (W - 2 * M - 3 * 12) / 4
  kpis.forEach(([v, l, c], i) => {
    const x = M + i * (kw + 12)
    caja(x, 190, kw, 86, 12, '#ffffff', LINEA)
    texto(v, x + 14, 206, { size: 30, bold: true, color: c })
    texto(l, x + 14, 248, { size: 8.5, color: SUAVE, width: kw - 24 })
  })

  titulo('Embudo de la campaña', 304)
  const etapas: [string, number][] = [
    ['Contactadas', d.contactadas],
    ['Respondieron', d.respondieron],
    ['Interesadas', d.interesadas],
    ['Reuniones', d.reuniones],
  ]
  const maxE = Math.max(1, d.contactadas)
  const bw = W - 2 * M - 170
  etapas.forEach(([e, n], i) => {
    const y = 336 + i * 38
    texto(e, M, y + 6, { size: 10, bold: true })
    caja(M + 100, y, bw, 24, 6, ARENA)
    caja(M + 100, y, Math.max(n ? 8 : 0, (n / maxE) * bw), 24, 6, i === 3 ? ESMERALDA : TINTA)
    texto(String(n), M + 100 + bw + 10, y + 6, { size: 11, bold: true })
    if (i > 0)
      texto(pct(n, etapas[i - 1]?.[1] ?? 0), M + 100 + bw + 40, y + 7, { size: 8.5, color: SUAVE })
  })
  texto('El porcentaje compara cada paso con el anterior.', M + 100, 490, { size: 8, color: SUAVE })

  titulo('Empresas contactadas por día', 520)
  const gx = M + 24
  const gy = 560
  const gh = 150
  const gw = W - 2 * M - 24
  const dias = d.porDia.slice(-14)
  const maxD = Math.max(1, ...dias.map((x) => x.n))
  for (let k = 0; k <= 3; k++) {
    const yy = gy + gh - (gh * k) / 3
    doc
      .moveTo(gx, yy)
      .lineTo(gx + gw, yy)
      .lineWidth(0.5)
      .stroke(LINEA)
    texto(String(Math.round((maxD * k) / 3)), M, yy - 4, { size: 7, color: SUAVE })
  }
  const paso = gw / Math.max(1, dias.length)
  dias.forEach((x, i) => {
    const h = (x.n / maxD) * gh
    const bx = gx + i * paso + paso * 0.18
    caja(bx, gy + gh - h, paso * 0.64, h, 3, ESMERALDA)
    texto(String(x.n), bx - 4, gy + gh - h - 11, {
      size: 7,
      bold: true,
      width: paso * 0.64 + 8,
      align: 'center',
    })
    texto(fechaCorta(x.dia), bx - 6, gy + gh + 6, {
      size: 6.5,
      color: SUAVE,
      width: paso * 0.64 + 12,
      align: 'center',
    })
  })
  texto('aiuda.ADS · un servicio de Aiuda Empresas', M, 800, { size: 8, color: SUAVE })
  texto('1 / 2', W - M - 40, 800, { size: 8, color: SUAVE, width: 40, align: 'right' })

  // ── Página 2: sectores y conversaciones ────────────────────
  doc.addPage({ size: 'A4', margin: 0 })
  doc.rect(0, 0, W, 842).fill('#fbf8f3')
  texto('aiuda.', M, 28, { size: 11, bold: true })
  texto('ADS', M + 36, 28, { size: 11, bold: true, color: ESMERALDA })

  titulo('Contactos por sector', 60)
  const sectores = d.porSector.slice(0, 6)
  const maxS = Math.max(1, ...sectores.map((s) => s.n))
  sectores.forEach((s, i) => {
    const y = 92 + i * 26
    texto(s.sector.charAt(0).toUpperCase() + s.sector.slice(1), M, y + 5, { size: 9, width: 150 })
    const sw = W - 2 * M - 210
    caja(M + 160, y, sw, 16, 5, ARENA)
    caja(M + 160, y, Math.max(6, (s.n / maxS) * sw), 16, 5, i === 0 ? ESMERALDA : TINTA)
    texto(`${s.n}  (${pct(s.n, d.contactadas)})`, M + 160 + sw + 8, y + 4, {
      size: 8.5,
      bold: true,
    })
  })

  const yC = Math.max(190, 92 + sectores.length * 26 + 30)
  titulo('Conversaciones destacadas', yC)
  texto('Conversaciones reales con el asistente; se omitieron nombres y teléfonos.', M, yC + 20, {
    size: 8.5,
    color: SUAVE,
  })
  const cw = (W - 2 * M - 16) / 2
  const charlas = d.charlas.slice(0, 2)
  if (charlas.length === 0) {
    caja(M, yC + 46, W - 2 * M, 70, 12, '#ffffff', LINEA)
    texto(
      'Aún no hay conversaciones con interés para mostrar. Aparecerán aquí apenas lleguen.',
      M + 16,
      yC + 74,
      { size: 10, color: SUAVE, width: W - 2 * M - 32 },
    )
  }
  const altos = (c: (typeof charlas)[number]) => {
    doc.font('Helvetica').fontSize(8)
    return c.mensajes.reduce(
      (t, m) => t + doc.heightOfString(m.texto, { width: cw * 0.78 - 16 }) + 21,
      0,
    )
  }
  const alto = Math.min(380, Math.max(160, ...charlas.map(altos)) + 56)
  charlas.forEach((c, i) => {
    const x = M + i * (cw + 16)
    const y0 = yC + 46
    caja(x, y0, cw, alto, 18, '#efe7dc', LINEA)
    caja(x, y0, cw, 30, 18, '#075e54')
    doc.rect(x, y0 + 14, cw, 16).fill('#075e54')
    texto(c.sector ? `Interesado · ${c.sector}` : 'Interesado', x + 14, y0 + 10, {
      size: 9,
      bold: true,
      color: '#ffffff',
    })
    let y = y0 + 44
    for (const m of c.mensajes) {
      const ancho = cw * 0.78
      doc.font('Helvetica').fontSize(8)
      const h = doc.heightOfString(m.texto, { width: ancho - 16 }) + 14
      if (y + h > y0 + alto - 8) break
      const bx = m.de === 'asistente' ? x + cw - ancho - 10 : x + 10
      caja(bx, y, ancho, h, 8, m.de === 'asistente' ? '#d9fdd3' : '#ffffff')
      texto(m.texto, bx + 8, y + 7, { size: 8, width: ancho - 16 })
      y += h + 7
    }
  })

  const yP = yC + 46 + (charlas.length ? alto : 70) + 30
  titulo('Próximos pasos', yP)
  texto(
    'Ampliar la cobertura a nuevos sectores · Afinar el mensaje con las respuestas reales · Convertir el interés en reuniones con su equipo.',
    M + 10,
    yP + 22,
    { size: 9, color: SUAVE, width: W - 2 * M - 10 },
  )
  texto('aiuda.ADS · un servicio de Aiuda Empresas', M, 800, { size: 8, color: SUAVE })
  texto('2 / 2', W - M - 40, 800, { size: 8, color: SUAVE, width: 40, align: 'right' })

  doc.end()
  return listo
}
