import { describe, expect, it } from 'vitest'
import { validarEntorno } from '@/lib/env'
import { puede } from '@/lib/permisos'
import { avisoDePlan, diasDePrueba, estadoEfectivo, planPermite } from '@/lib/planes'
import { normalizarTelefono } from '@/lib/telefono'
import { enlaceWhatsApp, leerReferencia, referencia, ventanaAbierta } from '@/lib/whatsapp'

describe('roles', () => {
  it('el operador trabaja leads y citas, pero no ve reportes ni usuarios', () => {
    expect(puede('operador', 'leads')).toBe(true)
    expect(puede('operador', 'citas')).toBe(true)
    expect(puede('operador', 'reportes')).toBe(false)
    expect(puede('operador', 'usuarios')).toBe(false)
  })

  it('solo el superadmin administra organizaciones', () => {
    expect(puede('superadmin', 'organizaciones')).toBe(true)
    expect(puede('admin', 'organizaciones')).toBe(false)
  })
})

describe('planes', () => {
  const org = { estado_plan: 'prueba' as const, prueba_hasta: '2027-01-09' }

  it('una prueba vencida se comporta como restringida', () => {
    expect(estadoEfectivo(org, '2027-01-09')).toBe('prueba')
    expect(estadoEfectivo(org, '2027-01-10')).toBe('restringido')
  })

  it('restringido no exporta ni ve reportes; suspendido no ve nada', () => {
    expect(planPermite('restringido', 'leads')).toBe(true)
    expect(planPermite('restringido', 'exportar')).toBe(false)
    expect(planPermite('restringido', 'reportes')).toBe(false)
    expect(planPermite('suspendido', 'leads')).toBe(false)
  })

  it('cuenta los días de prueba y avisa a 30 y a 7 días', () => {
    expect(diasDePrueba('2027-01-09', '2027-01-02')).toBe(7)
    expect(avisoDePlan(org, '2026-10-09')).toBeNull()
    expect(avisoDePlan(org, '2026-12-20')?.tono).toBe('neutro')
    expect(avisoDePlan(org, '2027-01-08')?.texto).toBe('Tu prueba gratis termina en 1 día.')
    expect(avisoDePlan(org, '2027-02-01')?.tono).toBe('peligro')
  })
})

describe('whatsapp', () => {
  it('arma el enlace con la referencia y la vuelve a leer', () => {
    const ref = referencia('FAG', 'TRI')
    const enlace = enlaceWhatsApp('+593999999999', 'Hola, necesito ayuda.', ref)
    expect(enlace.startsWith('https://wa.me/593999999999?text=')).toBe(true)
    const texto = decodeURIComponent(enlace.split('text=')[1] ?? '')
    expect(texto).toBe('Hola, necesito ayuda. (Ref. FAG-TRI)')
    expect(leerReferencia(texto)).toEqual({ org: 'FAG', angulo: 'TRI' })
  })

  it('no inventa una referencia donde no la hay', () => {
    expect(leerReferencia('Hola, quiero información')).toBeNull()
  })

  it('la ventana es de 72 h desde anuncio y de 24 h en otro caso', () => {
    const ahora = new Date('2026-10-10T12:00:00Z')
    const hace30h = '2026-10-09T06:00:00Z'
    expect(ventanaAbierta(hace30h, 24, ahora)).toBe(false)
    expect(ventanaAbierta(hace30h, 72, ahora)).toBe(true)
    expect(ventanaAbierta(null, 72, ahora)).toBe(false)
  })
})

describe('teléfono', () => {
  it('normaliza números ecuatorianos a E.164', () => {
    expect(normalizarTelefono('0991234567')).toBe('+593991234567')
    expect(normalizarTelefono('+593 99 123 4567')).toBe('+593991234567')
  })
})

describe('entorno', () => {
  it('nombra cada variable que falta', () => {
    expect(() => validarEntorno({})).toThrow(/SUPABASE_URL: falta/)
  })
})

describe('semilla y vista previa', () => {
  it('la vista previa usa los mismos textos que la semilla', async () => {
    const { readFileSync } = await import('node:fs')
    const { ANGULOS_DEMO } = await import('../fixtures/landing-demo')
    const semilla = readFileSync(
      new URL('../../supabase/semillas/fagal.sql', import.meta.url),
      'utf8',
    )
    expect(ANGULOS_DEMO).toHaveLength(3)
    for (const a of ANGULOS_DEMO) {
      expect(semilla).toContain(a.titular)
      expect(semilla).toContain(a.subtitulo)
      for (const d of a.dolores) expect(semilla).toContain(d)
    }
  })
})
