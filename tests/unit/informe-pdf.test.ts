import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EXPLICACIONES, esquemaInforme, type Informe } from '@/lib/informe-modelo'
import { informePdf } from '@/lib/informe-pdf'

const persona = (nombre: string, empresa: string, fecha: string, nota: string) => ({
  nombre,
  empresa,
  fecha,
  nota,
})

const muestra: Informe = {
  cliente: 'Cliente de ejemplo',
  desde: '2026-10-20',
  hasta: '2026-10-23',
  inversion: 50,
  contactadas: 62,
  respondieron: 14,
  interesadas: 3,
  reuniones: 1,
  automaticas: 9,
  rechazos: 4,
  bajas: 1,
  porDia: [
    { dia: '2026-10-20', n: 10 },
    { dia: '2026-10-21', n: 25 },
    { dia: '2026-10-22', n: 27 },
  ],
  porSector: [
    { sector: 'inmobiliarias', n: 24, respondieron: 7, interesadas: 2 },
    { sector: 'concesionarias de vehículos', n: 20, respondieron: 4, interesadas: 1 },
  ],
  foco: 'inmobiliarias',
  calientes: [persona('Ana Pérez', 'Inmobiliaria Uno', '22 oct', 'Quiere reunirse')],
  tibios: [persona('Luis Mora', 'Autos Dos', '21 oct', 'Conversó (3 mensajes)')],
  frios: [persona('Eva Rey', 'Seguros Tres', '21 oct', 'Ya tienen abogado')],
  casoExito: {
    activo: true,
    titulo: 'Caso a verificar',
    persona: persona('Ana Pérez', 'Inmobiliaria Uno', '22 oct', 'Verificar si la reunión ocurrió'),
    texto: '«Ya conversé con un profesional y quedó en enviar información por correo»',
  },
  charlas: [
    {
      titulo: 'Ejemplo de conversación',
      ilustrativa: true,
      mensajes: [
        { de: 'contacto', texto: 'Hola, ¿de qué se trata?' },
        {
          de: 'asistente',
          texto: 'Hola, le escribe el equipo. ¿Le interesaría una reunión breve de 20 minutos?',
        },
        { de: 'contacto', texto: 'Sí, el martes en la tarde' },
      ],
    },
  ],
  dolares: { servicioMensual: 200, meses: 3, planMensualCliente: 500, propuestaDia: 15 },
  conclusiones: ['Con US$ 50 se contactaron 62 empresas.', 'El testeo dejó marcado el camino.'],
  pasos: ['Inyectar presupuesto por día.', 'Cumplir los 3 meses de prueba.'],
  explicaciones: EXPLICACIONES,
}

describe('informe en PDF', () => {
  it('el modelo de ejemplo es válido', () => {
    expect(esquemaInforme.safeParse(muestra).success).toBe(true)
    expect(esquemaInforme.safeParse({ ...muestra, contactadas: -1 }).success).toBe(false)
  })

  it('genera un PDF válido de cinco páginas', async () => {
    const pdf = await informePdf(muestra)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect((pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length).toBe(5)
    if (process.env.GUARDAR_INFORME) writeFileSync(process.env.GUARDAR_INFORME, pdf)
  })
})
