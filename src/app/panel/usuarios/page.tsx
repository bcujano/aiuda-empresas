import { redirect } from 'next/navigation'
import { FilaUsuario, FormNuevoUsuario } from '@/components/panel/usuarios'
import { CabeceraTarjeta, Tarjeta, Vacio } from '@/components/ui/primitivos'
import { exigir } from '@/lib/auth'
import { listarUsuarios } from '@/server/usuarios'

export default async function Usuarios() {
  const sesion = await exigir('usuarios')
  if (!sesion) redirect('/panel')
  const usuarios = await listarUsuarios(sesion.org.id)
  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Usuarios de {sesion.org.nombre}</h1>
        <p className="text-[var(--texto-suave)] text-sm">
          Quién entra al CRM de este cliente. «Sin acceso» bloquea la entrada sin borrar lo que
          hizo.
        </p>
      </div>
      <Tarjeta>
        <CabeceraTarjeta titulo={`${usuarios.length} usuarios`} />
        {usuarios.length === 0 ? (
          <Vacio mensaje="Este cliente aún no tiene usuarios. Crea el primero abajo." />
        ) : (
          <div className="divide-y divide-[var(--borde)]">
            {usuarios.map((u) => (
              <FilaUsuario key={u.id} soyYo={u.auth_user_id === sesion.userId} u={u} />
            ))}
          </div>
        )}
      </Tarjeta>
      <Tarjeta>
        <CabeceraTarjeta titulo="Nuevo usuario" />
        <FormNuevoUsuario />
      </Tarjeta>
    </div>
  )
}
