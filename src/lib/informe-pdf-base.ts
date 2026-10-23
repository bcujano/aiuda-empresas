import type PDFDocument from 'pdfkit'

/** Piezas de dibujo del informe en PDF (vectorial). */

export const TINTA = '#0f1e33'
export const ESMERALDA = '#0b8a5a'
export const ARENA = '#f3ece0'
export const LINEA = '#e6dccb'
export const SUAVE = '#5b6577'
export const FONDO = '#fbf8f3'
export const CALIENTE = '#e4572e'
export const TIBIO = '#e0a100'
export const FRIO = '#4a90b8'
export const W = 595
export const M = 40

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const fechaCorta = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]}`
    : iso
export const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—')
export const usd = (n: number) => `US$ ${n.toLocaleString('es-EC', { maximumFractionDigits: 2 })}`

type Doc = InstanceType<typeof PDFDocument>
type Opc = {
  size?: number
  color?: string
  bold?: boolean
  width?: number
  align?: 'left' | 'center' | 'right'
}

export function herramientas(doc: Doc) {
  const texto = (t: string, x: number, y: number, o: Opc = {}) => {
    doc
      .font(o.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(o.size ?? 10)
      .fillColor(o.color ?? TINTA)
    doc.text(t, x, y, { width: o.width, align: o.align, lineBreak: o.width !== undefined })
  }
  const alto = (t: string, ancho: number, size = 10) => {
    doc.font('Helvetica').fontSize(size)
    return doc.heightOfString(t, { width: ancho })
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
  /** Título de sección con su explicación breve debajo. Devuelve la y donde sigue el contenido. */
  const seccion = (t: string, explicacion: string, y: number) => {
    doc.rect(M, y + 2, 3, 14).fill(ESMERALDA)
    texto(t, M + 10, y, { size: 13, bold: true })
    if (!explicacion) return y + 26
    texto(explicacion, M + 10, y + 19, { size: 8.5, color: SUAVE, width: W - 2 * M - 10 })
    return y + 22 + alto(explicacion, W - 2 * M - 10, 8.5) + 8
  }
  /** Fondo y cabecera de la página (la portada pasa `primera` y trae su propio fondo) y su pie. */
  const pagina = (n: number, total: number, primera = false) => {
    if (!primera) {
      doc.rect(0, 0, W, 842).fill(FONDO)
      texto('aiuda.', M, 28, { size: 11, bold: true })
      texto('ADS', M + 36, 28, { size: 11, bold: true, color: ESMERALDA })
    }
    texto('aiuda.ADS · un servicio de Aiuda Empresas', M, 800, { size: 8, color: SUAVE })
    texto(`${n} / ${total}`, W - M - 40, 800, { size: 8, color: SUAVE, width: 40, align: 'right' })
  }
  return { texto, alto, caja, seccion, pagina }
}
export type Herr = ReturnType<typeof herramientas>
