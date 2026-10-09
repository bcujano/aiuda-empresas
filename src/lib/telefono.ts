/**
 * Normalización a E.164. Es el formato que exige la base y el único que
 * entiende WhatsApp; lo que el operador escriba se convierte, no se rechaza.
 */
const PAIS_POR_DEFECTO = '593'

export function normalizarTelefono(entrada: string, pais = PAIS_POR_DEFECTO): string | null {
  const limpio = entrada.replace(/[^\d+]/g, '')
  if (limpio === '') return null

  let digitos = limpio.startsWith('+') ? limpio.slice(1) : limpio

  if (!limpio.startsWith('+')) {
    // 0963987124 -> 963987124: el cero es de marcación nacional.
    if (digitos.startsWith('0')) digitos = digitos.slice(1)
    if (!digitos.startsWith(pais)) digitos = pais + digitos
  }

  if (digitos.startsWith('0')) return null
  if (digitos.length < 8 || digitos.length > 15) return null
  return `+${digitos}`
}

export function esE164(valor: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(valor)
}
