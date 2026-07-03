import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import EstadoCuentaTab from '../../components/empleados/EstadoCuentaTab';
import PrestamosTab from '../../components/empleados/PrestamosTab';
import { formatearMoneda } from '../../utils/moneda';

const TABS = [
  { id: 'estado-cuenta', label: 'Estado de cuenta' },
  { id: 'prestamos', label: 'Préstamos' },
];

export default function EmpleadoDetalle() {
  const { id } = useParams();
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('estado-cuenta');

  useEffect(() => {
    api
      .get(`/empleados/${id}`)
      .then(({ data }) => setEmpleado(data))
      .catch(() => setError('No se pudo cargar el empleado.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  if (error || !empleado) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {empleado.nombre} {empleado.apellido}
        </h1>
        <p className="text-sm capitalize text-slate-500 dark:text-slate-400">
          {empleado.cargo?.replaceAll('_', ' ')} · Sueldo quincenal: {formatearMoneda(empleado.sueldo_quincenal)}
        </p>
      </div>

      <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'border-slate-800 text-slate-900 dark:border-slate-300 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'estado-cuenta' ? (
        <EstadoCuentaTab empleadoId={empleado.id} />
      ) : (
        <PrestamosTab empleadoId={empleado.id} />
      )}
    </div>
  );
}
