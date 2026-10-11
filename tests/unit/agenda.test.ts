import { describe, expect, it } from 'vitest'
import { calcularEspacios, etiquetaHora, horaPedida, repartir } from '@/lib/agenda'

const LUNES_A_VIERNES = [1, 2, 3, 4, 5].map((d) => ({
  dia_semana: d,
  desde: '08:00:00',
  hasta: '17:00:00',
}))
const REGLAS = { minutos: 45, intervalo: 60, anticipacionHoras: 3, diasAdelante: 5 }

describe('calcularEspacios', () => {
  // Viernes 9 de octubre de 2026, 14:52 en Quito (19:52 UTC).
  const ahora = new Date('2026-10-09T19:52:00Z')

  it('respeta la anticipación, el fin de semana y el cierre a las 17:00', () => {
    const espacios = calcularEspacios(LUNES_A_VIERNES, [], REGLAS, ahora)
    // Hoy ya no hay (14:52 + 3 h pasa el cierre); sábado y domingo no se atiende.
    expect(espacios[0]?.toISOString()).toBe('2026-10-12T13:00:00.000Z') // lunes 08:00
    // Último del lunes: 16:00 (16:00 + 45 min cabe antes de las 17:00).
    const lunes = espacios.filter((e) => e.toISOString().startsWith('2026-10-12'))
    expect(lunes).toHaveLength(9)
    expect(lunes.at(-1)?.toISOString()).toBe('2026-10-12T21:00:00.000Z')
  })

  it('no ofrece horas que se cruzan con una cita existente', () => {
    const ocupados = [{ inicia_at: '2026-10-12T14:00:00Z', termina_at: '2026-10-12T14:45:00Z' }]
    const espacios = calcularEspacios(LUNES_A_VIERNES, ocupados, REGLAS, ahora).map((e) =>
      e.toISOString(),
    )
    expect(espacios).not.toContain('2026-10-12T14:00:00.000Z')
    expect(espacios).toContain('2026-10-12T15:00:00.000Z')
  })
})

describe('repartir y etiquetaHora', () => {
  it('limita por día y en total', () => {
    const espacios = calcularEspacios(LUNES_A_VIERNES, [], REGLAS, new Date('2026-10-09T19:52:00Z'))
    const pocos = repartir(espacios, 2, 5)
    expect(pocos).toHaveLength(5)
    expect(pocos.filter((e) => e.toISOString().startsWith('2026-10-12'))).toHaveLength(2)
  })

  it('escribe la hora de Quito en español', () => {
    expect(etiquetaHora('2026-10-13T15:00:00Z')).toBe('martes 13 de octubre, 10:00')
  })
})

describe('repartir a lo largo del día y horaPedida', () => {
  const espacios = calcularEspacios(LUNES_A_VIERNES, [], REGLAS, new Date('2026-10-09T19:52:00Z'))

  it('ofrece mañana, mediodía y tarde, no solo las primeras horas', () => {
    const lunes = repartir(espacios, 3, 3).map((e) => etiquetaHora(e))
    expect(lunes).toEqual([
      'lunes 12 de octubre, 08:00',
      'lunes 12 de octubre, 12:00',
      'lunes 12 de octubre, 16:00',
    ])
  })

  it('acepta el instante exacto y también la hora de Quito escrita con Z', () => {
    expect(horaPedida('2026-10-14T15:00:00.000Z', espacios)?.toISOString()).toBe(
      '2026-10-14T15:00:00.000Z',
    )
    expect(horaPedida('2026-10-14T10:00:00Z', espacios)?.toISOString()).toBe(
      '2026-10-14T15:00:00.000Z',
    )
    expect(horaPedida('2026-10-14T03:00:00Z', espacios)).toBeNull()
  })
})
