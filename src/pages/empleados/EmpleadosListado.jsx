import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import FormEmpleado from '../../components/empleados/FormEmpleado';

export default function EmpleadosListado() {
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  function cargar() {
    setLoading(true);
    api
      .get('/empleados?todos=1')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setError('No se pudieron cargar los empleados.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  function handleCreado() {
    setModalAbierto(false);
    cargar();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Empleados</h1>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Nuevo empleado
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : empleados.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 dark:text-slate-500">No hay empleados registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Cargo</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {empleados.map((empleado) => (
                <tr
                  key={empleado.id}
                  onClick={() => navigate(`/empleados/${empleado.id}`)}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    empleado.activo ? '' : 'opacity-60'
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                    {empleado.nombre} {empleado.apellido}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-slate-600 dark:text-slate-300">
                    {empleado.cargo?.replaceAll('_', ' ')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        empleado.activo
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Nuevo empleado" maxWidth="max-w-xl">
        <FormEmpleado onGuardado={handleCreado} onCancelar={() => setModalAbierto(false)} />
      </Modal>
    </div>
  );
}
