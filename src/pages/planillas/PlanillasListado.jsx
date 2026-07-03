import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import FormGenerarPlanilla from '../../components/planillas/FormGenerarPlanilla';
import { IconUsuarios } from '../../components/icons';
import { formatearMoneda, NOMBRES_MESES } from '../../utils/moneda';

const ESTADO_ESTILOS = {
  borrador: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  cerrada: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function PlanillasListado() {
  const navigate = useNavigate();
  const [planillas, setPlanillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  function cargar() {
    setLoading(true);
    setError('');

    api
      .get('/planillas')
      .then(({ data }) => setPlanillas(data.data ?? []))
      .catch(() => setError('No se pudieron cargar las planillas.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  function handleGenerada(planilla) {
    setModalAbierto(false);
    navigate(`/planillas/${planilla.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Planillas</h1>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Generar planilla
        </button>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : error ? (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : planillas.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay planillas generadas todavía.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {planillas.map((planilla) => (
            <button
              key={planilla.id}
              type="button"
              onClick={() => navigate(`/planillas/${planilla.id}`)}
              className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4 text-left transition hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {NOMBRES_MESES[planilla.mes]} {planilla.anio}
                </h2>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ESTADO_ESTILOS[planilla.estado] ?? ''}`}>
                  {planilla.estado}
                </span>
              </div>

              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Quincena {planilla.quincena}</p>

              <div className="flex items-end justify-between">
                <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <IconUsuarios className="h-4 w-4" />
                  {planilla.detalles_count ?? 0} empleados
                </span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {formatearMoneda(planilla.detalles_sum_total_a_pagar)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Generar planilla" maxWidth="max-w-xl">
        <FormGenerarPlanilla onGenerada={handleGenerada} onCancelar={() => setModalAbierto(false)} />
      </Modal>
    </div>
  );
}
