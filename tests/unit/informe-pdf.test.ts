import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { informePdf } from '@/lib/informe-pdf'
import type { Informe } from '@/server/informe'

const muestra: Informe = {
  organizacion: { nombre: 'Cliente de ejemplo', color: '#1f3a5f' },
  desde: '2026-10-20',
  hasta: '2026-10-23',
  contactadas: 62,
  respondieron: 14,
  interesadas: 3,
  reuniones: 1,
  porDia: [
    { dia: '2026-10-20', n: 10 },
    { dia: '2026-10-21', n: 25 },
    { dia: '2026-10-22', n: 27 },
  ],
  porSector: [
    { sector: 'inmobiliarias', n: 24, respondieron: 7, interesadas: 2 },
    { sector: 'concesionarias de vehículos', n: 20, respondieron: 4, interesadas: 1 },
    { sector: 'compañías de seguros', n: 18, respondieron: 3, interesadas: 0 },
  ],
  foco: 'inmobiliarias',
  inversion: 50,
  propuestaDia: 15,
  charlas: [
    {
      sector: 'inmobiliarias',
      mensajes: [
        {
          de: 'contacto',
          texto: 'Ya conversé con un profesional y quedó en enviar información por correo',
        },
        {
          de: 'asistente',
          texto:
            'Entiendo. ¿Le gustaría coordinar una reunión breve de 20 minutos con uno de nuestros abogados?',
        },
        { de: 'contacto', texto: 'Sí, el martes en la tarde' },
      ],
    },
  ],
}

describe('informe en PDF', () => {
  it('genera un PDF válido de tres páginas', async () => {
    const pdf = await informePdf(muestra)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect((pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length).toBe(3)
    if (process.env.GUARDAR_INFORME) writeFileSync(process.env.GUARDAR_INFORME, pdf)
  })
})
