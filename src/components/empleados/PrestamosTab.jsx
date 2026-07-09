import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import FormPrestamo from './FormPrestamo';
import Modal from '../Modal';
import { formatearMoneda } from '../../utils/moneda';
import { SkeletonLineas } from '../common/Skeleton';

export default function PrestamosTab({ empleadoId }) {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);

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

  async function eliminar(prestamo) {
    if (!window.confirm('¿Eliminar este préstamo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/prestamos/${prestamo.id}`);
      cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  if (loading) {
    return <SkeletonLineas lineas={4} />;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  const activo = prestamos.find((prestamo) => prestamo.estado === 'activo');
  const sinAbonos = activo && (activo.abonos?.length ?? 0) === 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Préstamo activo</h2>

        {!activo ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Este empleado no tiene un préstamo activo.</p>
        ) : (
          <>
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

            {sinAbonos ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(activo)}
                  className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                Ya tiene abonos aplicados — no se puede editar ni eliminar.
              </p>
            )}
          </>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Otorgar nuevo préstamo</h2>
        <FormPrestamo empleadoId={empleadoId} onGuardado={cargar} />
      </section>

      <Modal open={editando} onClose={() => setEditando(false)} title="Editar préstamo" maxWidth="max-w-lg">
        <FormPrestamo
          empleadoId={empleadoId}
          prestamo={activo}
          onGuardado={() => {
            setEditando(false);
            cargar();
          }}
          onCancelar={() => setEditando(false)}
        />
      </Modal>
    </div>
  );
}
