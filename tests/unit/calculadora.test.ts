import { describe, expect, it } from 'vitest'
import { cuentas } from '@/lib/calculadora-reunion'

describe('calculadora de costo por reunión', () => {
  const base = {
    inversion: 300,
    costoConversacion: 3,
    califica: 30,
    agenda: 50,
    cierre: 20,
    ticket: 1500,
  }

  it('lleva el dinero en anuncios hasta clientes', () => {
    const r = cuentas(base, 200)
    expect(r.conversaciones).toBe(100)
    expect(r.calificados).toBe(30)
    expect(r.reuniones).toBe(15)
    expect(r.clientes).toBe(3)
    expect(r.costoPorReunion).toBeCloseTo(500 / 15)
    expect(r.ingreso).toBe(4500)
  })

  it('sin reuniones no inventa un costo por reunión', () => {
    expect(cuentas({ ...base, costoConversacion: 0 }, 200).costoPorReunion).toBeNull()
    expect(cuentas({ ...base, agenda: 0 }, 200).costoPorReunion).toBeNull()
  })
})
