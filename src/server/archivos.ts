import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Imágenes públicas que se suben desde el panel (logos de clientes, fotos de
 * reseñas). Van al almacenamiento de Supabase, en un depósito público que se
 * crea solo la primera vez. Solo PNG, JPG o WebP de hasta 2 MB.
 */

const DEPOSITO = 'publico'
const TIPOS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
const MAXIMO = 2 * 1024 * 1024

export function hayArchivo(v: FormDataEntryValue | null): v is File {
  return typeof v === 'object' && v !== null && 'size' in v && v.size > 0
}

export async function subirImagen(
  archivo: File,
  carpeta: 'logos' | 'resenas',
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const extension = TIPOS[archivo.type]
  if (!extension) return { ok: false, error: 'La imagen debe ser PNG, JPG o WebP.' }
  if (archivo.size > MAXIMO) return { ok: false, error: 'La imagen pesa más de 2 MB.' }
  const almacen = supabaseAdmin().storage
  await almacen.createBucket(DEPOSITO, { public: true }).catch(() => undefined)
  const ruta = `${carpeta}/${crypto.randomUUID()}.${extension}`
  const { error } = await almacen
    .from(DEPOSITO)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false })
  if (error) return { ok: false, error: 'No se pudo subir la imagen.' }
  return { ok: true, url: almacen.from(DEPOSITO).getPublicUrl(ruta).data.publicUrl }
}
