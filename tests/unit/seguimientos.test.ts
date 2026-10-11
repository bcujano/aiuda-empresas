import { describe, expect, it } from 'vitest'
import { horaDeEnviar, pideBaja, rellenar, ventanaLibre } from '@/lib/seguimientos'

describe('seguimientos', () => {
  it('solo escribe de 08:00 a 19:59 de Quito', () => {
    expect(horaDeEnviar(new Date('2026-10-12T13:00:00Z'))).toBe(true) // 08:00
    expect(horaDeEnviar(new Date('2026-10-12T12:59:00Z'))).toBe(false) // 07:59
    expect(horaDeEnviar(new Date('2026-10-13T00:59:00Z'))).toBe(true) // 19:59
    expect(horaDeEnviar(new Date('2026-10-13T01:00:00Z'))).toBe(false) // 20:00
  })

  it('rellena variables y omite el nombre si falta', () => {
    const t = 'Hola {nombre}, ¿sigue interesado en {servicio}?'
    expect(rellenar(t, { nombre: 'Ana', servicio: 'defensa tributaria' })).toBe(
      'Hola Ana, ¿sigue interesado en defensa tributaria?',
    )
    expect(rellenar(t, { servicio: 'defensa tributaria' })).toBe(
      'Hola, ¿sigue interesado en defensa tributaria?',
    )
    expect(rellenar('{nombre}, quedó pendiente', {})).toBe('Quedó pendiente')
  })

  it('detecta la baja', () => {
    expect(pideBaja('No gracias')).toBe(true)
    expect(pideBaja('por favor no me escriban más')).toBe(true)
    expect(pideBaja('quiero bajar costos de mi empresa')).toBe(false)
  })

  it('ventana libre con 5 minutos de margen', () => {
    const ahora = new Date('2026-10-12T15:00:00Z')
    expect(ventanaLibre('2026-10-11T15:10:00Z', 24, ahora)).toBe(true)
    expect(ventanaLibre('2026-10-11T15:04:00Z', 24, ahora)).toBe(false)
    expect(ventanaLibre(null, 24, ahora)).toBe(false)
  })
})
