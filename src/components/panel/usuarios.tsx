'use client'

import { KeyRound, Trash2 } from 'lucide-react'
import { useActionState, useState, useTransition } from 'react'
import type { Resultado } from '@/app/panel/acciones'
import {
  borrarUsuarioAccion,
  cambiarUsuarioAccion,
  crearUsuarioAccion,
  nuevaClaveAccion,
} from '@/app/panel/usuarios/acciones'
import { Aviso, BotonAccion } from '@/components/ui/primitivos'
import type { UsuarioConCorreo } from '@/server/usuarios'

export function FormNuevoUsuario() {
  const [estado, accion, pendiente] = useActionState<Resultado, FormData>(crearUsuarioAccion, {})
  return (
    <form action={accion} className="grid gap-3 p-4 sm:grid-cols-2">
      {[
        ['nombre_completo', 'Nombre', 'text'],
        ['email', 'Correo', 'email'],
        ['clave', 'Contraseña inicial (10+ caracteres)', 'text'],
      ].map(([n, t, tipo]) => (
        <div className="flex flex-col gap-1 text-sm" key={n}>
          <label className="font-medium" htmlFor={`u-${n}`}>
            {t}
          </label>
          <input className="campo" id={`u-${n}`} name={n} required type={tipo} />
        </div>
      ))}
      <div className="flex flex-col gap-1 text-sm">
        <label className="font-medium" htmlFor="u-rol">
          Rol
        </label>
        <select className="campo" id="u-rol" name="rol">
          <option value="operador">Operador: atiende leads y agenda</option>
          <option value="admin">Administrador: además configura, exporta y maneja usuarios</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button className="boton boton-primario" disabled={pendiente} type="submit">
          Crear usuario
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  )
}

export function FilaUsuario({ u, soyYo }: { u: UsuarioConCorreo; soyYo: boolean }) {
  const [estado, setEstado] = useState<Resultado>({})
  const [pendiente, iniciar] = useTransition()
  const ejecutar = (f: () => Promise<Resultado>) => iniciar(async () => setEstado(await f()))
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">
          {u.nombre_completo}
          {soyYo ? ' (tú)' : ''}
        </p>
        <p className="text-[var(--texto-suave)] text-xs">{u.email}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Rol"
          className="campo"
          defaultValue={u.rol}
          disabled={soyYo || pendiente}
          onChange={(e) => ejecutar(() => cambiarUsuarioAccion(u.id, 'rol', e.target.value))}
        >
          <option value="operador">Operador</option>
          <option value="admin">Administrador</option>
        </select>
        <select
          aria-label="Estado"
          className="campo"
          defaultValue={u.estado}
          disabled={soyYo || pendiente}
          onChange={(e) => ejecutar(() => cambiarUsuarioAccion(u.id, 'estado', e.target.value))}
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Sin acceso</option>
        </select>
        <button
          className="boton boton-suave"
          disabled={pendiente}
          onClick={() => {
            const clave = window.prompt('Nueva contraseña (10+ caracteres):')
            if (clave) ejecutar(() => nuevaClaveAccion(u.id, clave))
          }}
          type="button"
        >
          <KeyRound size={14} /> Contraseña
        </button>
        {soyYo ? null : (
          <BotonAccion
            confirmacion={`¿Borrar el acceso de ${u.nombre_completo}?`}
            icono={<Trash2 size={14} />}
            onEjecutar={() => borrarUsuarioAccion(u.id)}
            texto="Borrar"
            variante="peligro"
          />
        )}
        <Aviso estado={estado} />
      </div>
    </div>
  )
}
