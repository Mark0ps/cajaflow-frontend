import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';

const ROLES = ['admin', 'secretaria', 'cajero'];

const INPUT_CLASES =
  'w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400';

function generarPasswordTemporal() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let resultado = '';
  for (let i = 0; i < 10; i++) {
    resultado += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return resultado;
}

/** Mismo formulario para crear un usuario o editar uno existente (pasar `usuario`). */
export default function FormUsuario({ usuario, onGuardado, onCancelar }) {
  const editando = Boolean(usuario);

  const [name, setName] = useState(usuario?.name ?? '');
  const [username, setUsername] = useState(usuario?.username ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [password, setPassword] = useState(() => (editando ? '' : generarPasswordTemporal()));
  const [role, setRole] = useState(usuario?.role ?? 'cajero');
  const [empleadoId, setEmpleadoId] = useState(usuario?.empleado_id ? String(usuario.empleado_id) : '');
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editando) return;

    api
      .get('/empleados')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setEmpleados([]));
  }, [editando]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = editando
      ? { username, email, role, activo }
      : {
          name,
          username,
          email,
          password,
          role,
          empleado_id: empleadoId || null,
        };

    try {
      const { data } = editando
        ? await api.patch(`/usuarios/${usuario.id}`, payload)
        : await api.post('/usuarios', payload);

      onGuardado(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {!editando && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="name_usuario">
            Nombre completo
          </label>
          <input
            id="name_usuario"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="username_usuario">
            Usuario
          </label>
          <input
            id="username_usuario"
            type="text"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="email_usuario">
            Correo
          </label>
          <input
            id="email_usuario"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>
      </div>

      {!editando && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="password_usuario">
            Contraseña temporal
          </label>
          <div className="flex gap-2">
            <input
              id="password_usuario"
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASES}
            />
            <button
              type="button"
              onClick={() => setPassword(generarPasswordTemporal())}
              className="whitespace-nowrap rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Generar otra
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Autogenerada, editable. Comunícasela al usuario para su primer ingreso.
          </p>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="role_usuario">
            Rol
          </label>
          <select id="role_usuario" value={role} onChange={(event) => setRole(event.target.value)} className={INPUT_CLASES}>
            {ROLES.map((valor) => (
              <option key={valor} value={valor} className="capitalize">
                {valor}
              </option>
            ))}
          </select>
        </div>

        {!editando && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="empleado_usuario">
              Empleado vinculado (opcional)
            </label>
            <select
              id="empleado_usuario"
              value={empleadoId}
              onChange={(event) => setEmpleadoId(event.target.value)}
              className={INPUT_CLASES}
            >
              <option value="">Sin vincular</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre} {empleado.apellido}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {editando && (
        <label className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={activo}
            onChange={(event) => setActivo(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
          />
          Activo
        </label>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={submitting}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
