import { esquemaInforme } from '@/lib/informe-modelo'
import { informePdf } from '@/lib/informe-pdf'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Enlace del informe que recibe el cliente (botón de la plantilla de WhatsApp o del correo).
 * El identificador es un UUID aleatorio: quien no tiene el enlace no puede adivinarlo.
 */
export async function GET(_p: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('No existe.', { status: 404 })
  const { data } = await supabaseAdmin()
    .from('informes_envio')
    .select('datos')
    .eq('id', id)
    .maybeSingle()
  const analisis = esquemaInforme.safeParse((data as { datos?: unknown } | null)?.datos)
  if (!analisis.success) return new Response('No existe.', { status: 404 })
  const pdf = await informePdf(analisis.data)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="informe-de-campanas.pdf"',
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  })
}
