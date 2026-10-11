import { describe, expect, it } from 'vitest'
import { aCsv } from '@/lib/csv'

describe('aCsv', () => {
  it('separa con ; y protege comillas, saltos y vacíos', () => {
    const csv = aCsv(
      [{ a: 'Ñandú; "SA"', b: null, c: 3 }],
      [
        { titulo: 'Empresa', valor: (f) => f.a },
        { titulo: 'Vacío', valor: (f) => f.b },
        { titulo: 'N', valor: (f) => f.c },
      ],
    )
    expect(csv).toBe('﻿Empresa;Vacío;N\r\n"Ñandú; ""SA""";;3\r\n')
  })
})
