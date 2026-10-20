import { describe, expect, it } from 'vitest'
import { leerLista } from '@/server/prospectos-panel'

describe('lista de prospectos pegada', () => {
  it('lee empresa, teléfono, correo y sector; solo celulares van a WhatsApp', () => {
    const f = leerLista(
      'Acme S.A.; 099 123 4567; Ventas@Acme.com; inmobiliarias\nSolo Fijo; 02 352 0420\nX\nSin Datos',
    )
    expect(f).toHaveLength(3)
    expect(f[0]).toMatchObject({
      telefono_wa: '+593991234567',
      email: 'ventas@acme.com',
      segmento: 'inmobiliarias',
    })
    expect(f[1]?.telefono_wa).toBeNull()
    expect(f[2]?.telefono).toBeNull()
  })
})
