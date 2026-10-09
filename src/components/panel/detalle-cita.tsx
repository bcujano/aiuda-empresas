import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Etiqueta } from '@/components/ui/primitivos'
import { etiquetaHora } from '@/lib/agenda'
import { fechaHora } from '@/lib/formato'
import type { CitaConLead } from '@/server/citas-y-angulos'

const ESTADO: Record<
  string,
  { texto: string; tono: 'aviso' | 'exito' | 'primario' | 'peligro' | 'neutro' }
> = {
  agendada: { texto: 'Por confirmar', tono: 'aviso' },
  confirmada: { texto: 'Confirmada', tono: 'exito' },
  asistio: { texto: 'Asistió', tono: 'primario' },
  no_asistio: { texto: 'No asistió', tono: 'peligro' },
  cancelada: { texto: 'Cancelada', tono: 'neutro' },
}

/** Ficha de una reunión: quién, cuándo y qué avisos y recordatorios ya salieron. */
export function DetalleCita({ cita }: { cita: CitaConLead }) {
  const estado = ESTADO[cita.estado] ?? { texto: cita.estado, tono: 'neutro' as const }
  const pasos: [string, string | null, string][] = [
    [
      cita.origen === 'agente' ? 'Reservada por el asistente' : 'Creada por el equipo',
      cita.created_at,
      '',
    ],
    [
      'Aviso al equipo (correo y WhatsApp)',
      cita.aviso_equipo_at,
      'No salió: revisa el correo y WhatsApp de avisos en Configuración',
    ],
    ['Confirmada por el equipo', cita.confirmada_at, 'Todavía no la confirman'],
    ['Recordatorio al cliente 24 h antes', cita.recordatorio_24h_at, 'Sale solo, un día antes'],
    ['Recordatorio al cliente 2 h antes', cita.recordatorio_2h_at, 'Sale solo, dos horas antes'],
  ]
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-lg">
            {cita.lead.empresa ?? cita.lead.nombre ?? cita.lead.telefono}
          </p>
          <p className="text-[var(--texto-suave)] text-sm">
            {etiquetaHora(cita.inicia_at)} ·{' '}
            {cita.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
          </p>
        </div>
        <Etiqueta tono={estado.tono}>{estado.texto}</Etiqueta>
      </div>
      <ol className="flex flex-col gap-2 text-sm">
        {pasos.map(([texto, cuando, falta]) => (
          <li className="flex gap-2" key={texto}>
            <span
              className={`mt-1.5 size-2 shrink-0 rounded-full ${cuando ? 'bg-[var(--exito)]' : 'bg-[var(--borde)]'}`}
            />
            <span>
              {texto}
              <span className="block text-[var(--texto-suave)] text-xs">
                {cuando ? fechaHora(cuando) : falta}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <a
          className="boton boton-primario"
          href={`/cita/${cita.token}`}
          rel="noopener"
          target="_blank"
        >
          Confirmar, mover o cancelar <ExternalLink size={14} />
        </a>
        <Link className="boton boton-suave" href={`/panel/leads/${cita.lead.id}`}>
          Ver la ficha del lead
        </Link>
      </div>
    </div>
  )
}
