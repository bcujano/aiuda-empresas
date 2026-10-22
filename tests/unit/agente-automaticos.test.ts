import { describe, expect, it } from 'vitest'
import { nombreDePila } from '@/lib/seguimientos'
import { esEco, esRespuestaAutomatica } from '@/server/agente-reglas'

describe('mensajes de máquinas', () => {
  it('detecta saludos y menús automáticos, no a una persona', () => {
    expect(
      esRespuestaAutomatica(
        'NAUTOS concesionario desde 1995 le saluda, en breve nos contactaremos con usted',
      ),
    ).toBe(true)
    expect(esRespuestaAutomatica('Por favor envíanos tu número de cédula para registrarte.')).toBe(
      true,
    )
    expect(esRespuestaAutomatica('Tu mensaje no pudo ser procesado por WhatsApp')).toBe(true)
    expect(
      esRespuestaAutomatica(
        'Gracias por escribirnos. Somos Anticipa Seguros. En unos minutos te respondemos personalmente.',
      ),
    ).toBe(true)
    expect(esRespuestaAutomatica('Nuestras redes sociales https://linktr.ee/tienda')).toBe(true)
    expect(esRespuestaAutomatica('Buenos días gracias por su mensaje')).toBe(false)
    expect(esRespuestaAutomatica('le comento que si disponemos de un departamento legal')).toBe(
      false,
    )
  })

  it('detecta cuando devuelven nuestro propio texto', () => {
    const nuestro = 'Hola, gracias por responder. ¿Podría indicarme su nombre, por favor?'
    expect(esEco(`Mucho gusto ${nuestro}!`, nuestro)).toBe(true)
    expect(esEco('Diana Araujo', nuestro)).toBe(false)
  })
})

describe('nombre para los seguimientos', () => {
  it('usa nombres de persona y descarta perfiles de empresa o número', () => {
    expect(nombreDePila('Diana Araujo')).toBe('Diana')
    expect(nombreDePila('ESTEBAN #100')).toBeUndefined()
    expect(nombreDePila('+593995573995')).toBeUndefined()
    expect(nombreDePila('Inmobiliaria La Coruña')).toBeUndefined()
    expect(nombreDePila('Fernanda Vinueza V.', 'inmo24')).toBe('Fernanda')
  })
})
