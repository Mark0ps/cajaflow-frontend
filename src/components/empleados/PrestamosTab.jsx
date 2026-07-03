import { useEffect, useState } from 'react';
import api from '../../api/axios';
import FormPrestamo from './FormPrestamo';
import { formatearMoneda } from '../../utils/moneda';

export default function PrestamosTab({ empleadoId }) {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function cargar() {
    setLoading(true);
    setError('');

    api
      .get(`/empleados/${empleadoId}/prestamos`)
      .then(({ data }) => setPrestamos(data))
      .catch(() => setError('No se pudieron cargar los préstamos.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [empleadoId]);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  const activo = prestamos.find((prestamo) => prestamo.estado === 'activo');

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Préstamo activo</h2>

        {!activo ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Este empleado no tiene un préstamo activo.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Monto original</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatearMoneda(activo.monto_original)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Saldo pendiente</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatearMoneda(activo.saldo_pendiente)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Cuota</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">{formatearMoneda(activo.monto_cuota)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Método de cobro</dt>
              <dd className="font-semibold capitalize text-slate-800 dark:text-slate-100">{activo.metodo_cobro}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Otorgar nuevo préstamo</h2>
        <FormPrestamo empleadoId={empleadoId} onCreado={cargar} />
      </section>
    </div>
  );
}
