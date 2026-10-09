import { describe, expect, it } from 'vitest'
import {
  esquemaContexto,
  esquemaLead,
  origenDeEntrada,
  resolverAngulo,
  secretoValido,
} from '@/server/agente-reglas'

const ANGULOS = [
  { id: 'a-tri', codigo: 'TRI', meta_ad_ids: ['120001'] },
  { id: 'a-lab', codigo: 'LAB', meta_ad_ids: [] },
]

describe('ángulo del lead', () => {
  it('manda el anuncio sobre la referencia del texto', () => {
    expect(
      resolverAngulo(ANGULOS, 'FAG', {
        texto: 'Hola (Ref. FAG-LAB)',
        referral: { source_id: '120001' },
      }),
    ).toBe('a-tri')
  })

  it('usa la referencia de la landing cuando no hay anuncio', () => {
    expect(resolverAngulo(ANGULOS, 'FAG', { texto: 'Hola (Ref. FAG-LAB)' })).toBe('a-lab')
  })

  it('no toma la referencia de otro cliente ni adivina', () => {
    expect(resolverAngulo(ANGULOS, 'FAG', { texto: 'Hola (Ref. LAV-LAB)' })).toBeNull()
    expect(resolverAngulo(ANGULOS, 'FAG', { texto: 'Hola, necesito un abogado' })).toBeNull()
  })
})

describe('origen y ventana', () => {
  it('anuncio Click-to-WhatsApp = 72 h; landing y directo = 24 h', () => {
    expect(origenDeEntrada({ referral: { source_id: '1' } })).toEqual({
      origen: 'anuncio_whatsapp',
      ventana_horas: 72,
    })
    expect(origenDeEntrada({ texto: 'Hola (Ref. FAG-TRI)' }).origen).toBe('landing')
    expect(origenDeEntrada({ texto: 'Hola' })).toEqual({
      origen: 'whatsapp_directo',
      ventana_horas: 24,
    })
  })
})

describe('datos que manda n8n', () => {
  it('normaliza el teléfono que llega sin +', () => {
    const r = esquemaContexto.parse({ phone_number_id: '123', telefono: '593991234567' })
    expect(r.telefono).toBe('+593991234567')
  })

  it('el agente no puede agendar ni cerrar un cliente por esta vía', () => {
    const base = { phone_number_id: '123', telefono: '+593991234567' }
    expect(esquemaLead.safeParse({ ...base, etapa: 'calificado' }).success).toBe(true)
    expect(esquemaLead.safeParse({ ...base, etapa: 'agendado' }).success).toBe(false)
    expect(esquemaLead.safeParse({ ...base, etapa: 'cliente' }).success).toBe(false)
  })

  it('rechaza un RUC que no tiene 13 dígitos', () => {
    const base = { phone_number_id: '123', telefono: '+593991234567' }
    expect(esquemaLead.safeParse({ ...base, ruc: '17912345' }).success).toBe(false)
  })
})

describe('secreto', () => {
  it('solo acepta el secreto exacto', () => {
    const s = 'a'.repeat(32)
    expect(secretoValido(s, s)).toBe(true)
    expect(secretoValido(`${'a'.repeat(31)}b`, s)).toBe(false)
    expect(secretoValido(null, s)).toBe(false)
  })
})
