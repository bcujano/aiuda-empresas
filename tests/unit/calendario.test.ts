import { describe, expect, it } from 'vitest'
import { bloque, diaQuito, inicioDia, lunesDe } from '@/lib/calendario'

describe('calendario', () => {
  it('usa el día de Quito, no el de UTC', () => {
    // 02:00 UTC del sábado 10 todavía es viernes 9 en Quito.
    expect(diaQuito('2026-10-10T02:00:00Z')).toBe('2026-10-09')
  })

  it('encuentra el lunes de la semana', () => {
    expect(lunesDe('2026-10-09')).toBe('2026-10-05')
    expect(lunesDe('2026-10-11')).toBe('2026-10-05') // domingo
    expect(lunesDe('2026-10-12')).toBe('2026-10-12')
    expect(lunesDe('basura', new Date('2026-10-09T15:00:00Z'))).toBe('2026-10-05')
  })

  it('el día de Quito empieza a las 05:00 UTC', () => {
    expect(inicioDia('2026-10-12').toISOString()).toBe('2026-10-12T05:00:00.000Z')
  })

  it('ubica una cita del martes 10:00 a 10:45', () => {
    expect(bloque('2026-10-13T15:00:00Z', '2026-10-13T15:45:00Z', '2026-10-12', 7, 20)).toEqual({
      columna: 1,
      arriba: 180,
      alto: 45,
    })
    expect(bloque('2026-10-20T15:00:00Z', '2026-10-20T15:45:00Z', '2026-10-12', 7, 20)).toBeNull()
  })
})
