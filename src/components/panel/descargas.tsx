import { Download } from 'lucide-react'

/** Enlaces de descarga en CSV (se abren en Excel). Solo se muestran si la sesión puede exportar. */
export function Descargas({ tipos }: { tipos: { tipo: string; texto: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tipos.map((t) => (
        <a className="boton boton-suave" download href={`/panel/exportar/${t.tipo}`} key={t.tipo}>
          <Download size={14} /> {t.texto}
        </a>
      ))}
    </div>
  )
}
