import { redirect } from 'next/navigation'

/**
 * Aiuda Empresas es la marca madre; cada servicio tiene su landing (/ads, …).
 * Mientras no exista la portada de la marca, la raíz lleva a Aiuda Ads.
 */
export default function Inicio() {
  redirect('/ads')
}
