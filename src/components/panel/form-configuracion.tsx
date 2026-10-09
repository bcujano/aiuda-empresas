'use client'

import { Loader2 } from 'lucide-react'
import { type ReactNode, useActionState } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import { guardarConfiguracionAccion } from '@/app/panel/configuracion/acciones'
import { Aviso } from '@/components/ui/primitivos'
import type { Configuracion } from '@/server/configuracion'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function Paso({
  n,
  titulo,
  ayuda,
  listo,
  children,
}: {
  n: number
  titulo: string
  ayuda: string
  listo: boolean
  children: ReactNode
}) {
  return (
    <section className="tarjeta flex flex-col gap-4 p-5">
      <header className="flex items-start gap-3">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full font-semibold text-sm ${listo ? 'bg-[var(--exito)] text-white' : 'bg-[var(--fondo)] text-[var(--texto-suave)]'}`}
        >
          {listo ? '✓' : n}
        </span>
        <div>
          <h2 className="font-semibold">{titulo}</h2>
          <p className="text-[var(--texto-suave)] text-sm">{ayuda}</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Dato({
  nombre,
  texto,
  valor,
  ayuda,
  ancho,
  area,
  tipo = 'text',
}: {
  nombre: string
  texto: string
  valor: string | number
  ayuda?: string
  ancho?: boolean
  area?: boolean
  tipo?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${ancho ? 'sm:col-span-2' : ''}`}>
      <label className="font-medium text-sm" htmlFor={nombre}>
        {texto}
      </label>
      {area ? (
        <textarea
          className="campo min-h-24"
          defaultValue={String(valor)}
          id={nombre}
          name={nombre}
        />
      ) : (
        <input className="campo" defaultValue={valor} id={nombre} name={nombre} type={tipo} />
      )}
      {ayuda ? <p className="text-[var(--texto-suave)] text-xs">{ayuda}</p> : null}
    </div>
  )
}

export function FormConfiguracion({ inicial }: { inicial: Configuracion }) {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(
    guardarConfiguracionAccion,
    {},
  )
  const c = inicial
  return (
    <form action={accion} className="flex flex-col gap-4">
      <Paso
        ayuda="Lo único que el asistente puede afirmar sobre ustedes. Si algo no está aquí, dirá que lo confirman en la reunión."
        listo={Boolean(c.experiencia && c.direccion)}
        n={1}
        titulo="Datos del estudio"
      >
        <Dato
          nombre="experiencia"
          texto="Experiencia"
          valor={c.experiencia}
          ancho
          ayuda="Ej.: Más de 15 años de experiencia."
        />
        <Dato
          area
          nombre="trayectoria"
          texto="Trayectoria (una por línea)"
          valor={c.trayectoria}
          ancho
          ayuda="Cargos, clientes o convenios que se pueden mencionar."
        />
        <Dato nombre="direccion" texto="Dirección de la oficina" valor={c.direccion} ancho />
        <Dato
          nombre="reuniones"
          texto="Cómo son las reuniones"
          valor={c.reuniones}
          ancho
          ayuda="Ej.: Virtuales o presenciales en la oficina."
        />
        <Dato
          nombre="horario_texto"
          texto="Horario (como se lo dice al cliente)"
          valor={c.horario_texto}
          ancho
        />
        <Dato
          nombre="honorarios"
          texto="Qué decir si preguntan precios"
          valor={c.honorarios}
          ancho
        />
      </Paso>

      <Paso
        ayuda="El asistente solo ofrece horas libres dentro de este horario y nunca cruza dos reuniones."
        listo={c.dias.length > 0}
        n={2}
        titulo="Agenda"
      >
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1 font-medium text-sm">Días de atención</legend>
          <div className="flex flex-wrap gap-3">
            {DIAS.map((d, i) => (
              <label className="inline-flex items-center gap-1.5 text-sm" key={d}>
                <input
                  defaultChecked={c.dias.includes(i + 1)}
                  name="dias"
                  type="checkbox"
                  value={i + 1}
                />
                {d}
              </label>
            ))}
          </div>
        </fieldset>
        <Dato nombre="desde" texto="Abre" tipo="time" valor={c.desde} />
        <Dato nombre="hasta" texto="Cierra" tipo="time" valor={c.hasta} />
        <Dato
          nombre="cita_minutos"
          texto="Duración de cada reunión (minutos)"
          tipo="number"
          valor={c.cita_minutos}
        />
        <Dato
          nombre="cita_anticipacion_horas"
          texto="Anticipación mínima (horas)"
          tipo="number"
          valor={c.cita_anticipacion_horas}
          ayuda="No se ofrecen horas más cercanas que esto."
        />
        <Dato
          nombre="cita_dias_adelante"
          texto="Hasta cuántos días adelante"
          tipo="number"
          valor={c.cita_dias_adelante}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium text-sm">Modalidades</legend>
          {(['virtual', 'presencial'] as const).map((m) => (
            <label className="inline-flex items-center gap-1.5 text-sm" key={m}>
              <input
                defaultChecked={c.modalidades.includes(m)}
                name="modalidades"
                type="checkbox"
                value={m}
              />
              {m === 'virtual' ? 'Virtual' : 'Presencial'}
            </label>
          ))}
        </fieldset>
      </Paso>

      <Paso
        ayuda="Aquí llega cada reunión nueva con el enlace para confirmarla, moverla o cancelarla."
        listo={Boolean(c.aviso_email || c.aviso_whatsapp)}
        n={3}
        titulo="A quién avisar"
      >
        <Dato nombre="aviso_email" texto="Correo" tipo="email" valor={c.aviso_email} />
        <Dato
          nombre="aviso_whatsapp"
          texto="WhatsApp"
          valor={c.aviso_whatsapp}
          ayuda="Ej.: 0991234567. Requiere la plantilla aviso_cita_equipo aprobada por Meta."
        />
      </Paso>

      <Paso
        ayuda="Mide las visitas a las landings y los clics a WhatsApp en Meta."
        listo={Boolean(c.pixel_id)}
        n={4}
        titulo="Medición"
      >
        <Dato
          nombre="pixel_id"
          texto="ID del píxel de Meta"
          valor={c.pixel_id}
          ayuda="Administrador de eventos → tu píxel → número de 15 a 16 dígitos."
        />
      </Paso>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-[var(--borde)] border-t bg-[var(--fondo)] py-3">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          {pendiente ? <Loader2 className="animate-spin" size={14} /> : null}
          Guardar configuración
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  )
}
