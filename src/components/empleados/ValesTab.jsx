import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatearMoneda } from '../../utils/moneda';
import { SkeletonLineas } from '../common/Skeleton';

const ESTADO_APLICADO_ESTILOS = {
  true: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  false: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function ValesTab({ empleadoId }) {
  const [vales, setVales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/empleados/${empleadoId}/vales`)
      .then(({ data }) => setVales(data.data ?? []))
      .catch(() => setError('No se pudieron cargar los vales.'))
      .finally(() => setLoading(false));
  }, [empleadoId]);

  if (loading) {
    return <SkeletonLineas lineas={4} />;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Vales</h2>

      {vales.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Sin vales registrados.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {vales.map((vale) => (
            <li key={vale.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div className="text-slate-700 dark:text-slate-200">
                <span className="font-medium">{String(vale.fecha_emision).slice(0, 10)}</span>
                {' · '}
                {vale.cierre_caja_id ? 'Vale de turno' : 'Vale libre'}
                {vale.descripcion && <span className="text-slate-500 dark:text-slate-400"> — {vale.descripcion}</span>}
                {vale.comprobante_url && (
                  <a
                    href={vale.comprobante_url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-xs font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Ver comprobante
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{formatearMoneda(vale.monto)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_APLICADO_ESTILOS[String(vale.aplicado_en_planilla)]}`}
                >
                  {vale.aplicado_en_planilla ? 'Aplicado' : 'Pendiente'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
