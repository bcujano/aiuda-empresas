import { describe, expect, it } from 'vitest'
import { enHorarioDeContacto, rellenarCorreo } from '@/server/contacto-frio'

describe('contacto en frío', () => {
  it('solo de lunes a viernes entre 09:00 y 17:00 de Quito', () => {
    expect(enHorarioDeContacto(new Date('2026-10-21T14:00:00Z'))).toBe(true) // miércoles 09:00
    expect(enHorarioDeContacto(new Date('2026-10-21T13:59:00Z'))).toBe(false) // 08:59
    expect(enHorarioDeContacto(new Date('2026-10-21T22:00:00Z'))).toBe(false) // 17:00
    expect(enHorarioDeContacto(new Date('2026-10-24T16:00:00Z'))).toBe(false) // sábado
  })

  it('rellena las variables del correo y deja vacías las que no existen', () => {
    expect(rellenarCorreo('Hola {empresa}, {x}', { empresa: 'Acme' })).toBe('Hola Acme, ')
  })
})
