import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import FormUsuario from '../../components/usuarios/FormUsuario';
import ModalResetPassword from '../../components/usuarios/ModalResetPassword';
import { IconEditar } from '../../components/icons';

const ROLE_ESTILOS = {
  admin: 'bg-slate-800 text-white dark:bg-slate-700',
  secretaria: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  cajero: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export default function UsuariosListado() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioResetPassword, setUsuarioResetPassword] = useState(null);

  function cargar() {
    setLoading(true);
    api
      .get('/usuarios')
      .then(({ data }) => setUsuarios(data))
      .catch(() => setError('No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  function handleCreado() {
    setModalCrear(false);
    cargar();
  }

  function handleEditado() {
    setUsuarioEditando(null);
    cargar();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Usuarios</h1>
        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* overflow-x-auto: en móvil la tabla excede el viewport; con
          overflow-hidden las columnas de estado/acciones quedaban cortadas
          sin forma de alcanzarlas */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : usuarios.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 dark:text-slate-500">No hay usuarios registrados.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className={usuario.activo ? '' : 'opacity-60'}>
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                    {usuario.name}
                    {usuario.empleado && (
                      <p className="text-xs font-normal text-slate-400 dark:text-slate-500">
                        {usuario.empleado.nombre} {usuario.empleado.apellido}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{usuario.username}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_ESTILOS[usuario.role] ?? ''}`}>
                      {usuario.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        usuario.activo
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setUsuarioResetPassword(usuario)}
                        className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                      >
                        Restablecer contraseña
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsuarioEditando(usuario)}
                        aria-label="Editar usuario"
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      >
                        <IconEditar className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo usuario" maxWidth="max-w-xl">
        <FormUsuario onGuardado={handleCreado} onCancelar={() => setModalCrear(false)} />
      </Modal>

      <Modal open={Boolean(usuarioEditando)} onClose={() => setUsuarioEditando(null)} title="Editar usuario" maxWidth="max-w-xl">
        {usuarioEditando && (
          <FormUsuario usuario={usuarioEditando} onGuardado={handleEditado} onCancelar={() => setUsuarioEditando(null)} />
        )}
      </Modal>

      <ModalResetPassword
        open={Boolean(usuarioResetPassword)}
        onClose={() => setUsuarioResetPassword(null)}
        usuario={usuarioResetPassword}
      />
    </div>
  );
}
