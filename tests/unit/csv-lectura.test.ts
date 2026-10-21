import { describe, expect, it } from 'vitest'
import { leerCsv } from '@/lib/csv'
import { leerListaCsv } from '@/server/prospectos-panel'

describe('lectura de CSV del Prospector', () => {
  const csv =
    '﻿"#","Nombre","Dirección","Teléfono","WhatsApp","Emails","Segmentos"\n' +
    '1,"Acme, S.A.","Av. 1","099 123 4567","+593991234567","a@acme.com; b@acme.com","inmobiliarias"\n' +
    '2,"Solo Fijo","Av. 2","(02) 352-0420","","","seguros"\n'

  it('respeta comillas, comas dentro del texto y BOM', () => {
    const f = leerCsv(csv)
    expect(f).toHaveLength(3)
    expect(f[1]?.[1]).toBe('Acme, S.A.')
  })

  it('arma prospectos: celular a WhatsApp, fijo sin WhatsApp, primer correo válido', () => {
    const l = leerListaCsv(csv)
    expect(l[0]).toMatchObject({
      nombre: 'Acme, S.A.',
      telefono_wa: '+593991234567',
      email: 'a@acme.com',
      segmento: 'inmobiliarias',
    })
    expect(l[1]).toMatchObject({ nombre: 'Solo Fijo', telefono_wa: null, email: null })
  })
})
