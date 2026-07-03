import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function EmpleadosListado() {
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/empleados')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setError('No se pudieron cargar los empleados.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Empleados</h1>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : empleados.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 dark:text-slate-500">No hay empleados activos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Cargo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {empleados.map((empleado) => (
                <tr
                  key={empleado.id}
                  onClick={() => navigate(`/empleados/${empleado.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                    {empleado.nombre} {empleado.apellido}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-slate-600 dark:text-slate-300">
                    {empleado.cargo?.replaceAll('_', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
