import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

export const ESTADO_CIERRE_ESTILOS = {
  abierto: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  cerrado: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  revisado_secretaria: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export const ESTADO_CIERRE_ETIQUETAS = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
  revisado_secretaria: 'Revisado',
};

const INPUT_CLASES =
  'rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

function claseDiferencia(valor) {
  const diferencia = Number(valor ?? 0);
  if (diferencia === 0) return 'text-emerald-600 dark:text-emerald-400';
  return diferencia < 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';
}

/**
 * Historial de cierres de todos los cajeros, para Admin y Secretaria
 * (solo lectura — el detalle permite completar facturas y marcar revisado).
 */
export default function CierresCajaListado() {
  const navigate = useNavigate();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    const params = { page: pagina };
    if (desde && hasta) {
      params.fecha_desde = desde;
      params.fecha_hasta = hasta;
    } else if (desde && !hasta) {
      params.fecha = desde;
    }
    if (estado) params.estado = estado;

    api
      .get('/cierres-caja', { params })
      .then(({ data }) => setRespuesta(data))
      .catch(() => setError('No se pudieron cargar los cierres de caja.'))
      .finally(() => setLoading(false));
  }, [desde, hasta, estado, pagina]);

  const cierres = respuesta?.data ?? [];

  function cambiarFiltro(setter) {
    return (event) => {
      setter(event.target.value);
      setPagina(1);
    };
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Caja diaria</h1>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="filtro_desde">
              Desde
            </label>
            <input id="filtro_desde" type="date" value={desde} onChange={cambiarFiltro(setDesde)} className={INPUT_CLASES} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="filtro_hasta">
              Hasta
            </label>
            <input id="filtro_hasta" type="date" value={hasta} onChange={cambiarFiltro(setHasta)} className={INPUT_CLASES} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="filtro_estado">
              Estado
            </label>
            <select id="filtro_estado" value={estado} onChange={cambiarFiltro(setEstado)} className={INPUT_CLASES}>
              <option value="">Todos</option>
              <option value="abierto">Abierto</option>
              <option value="cerrado">Cerrado</option>
              <option value="revisado_secretaria">Revisado</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : error ? (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : cierres.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay cierres de caja para los filtros seleccionados.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)]">
            <table className="w-full text-sm">
              <thead className="border-b-[0.5px] border-[var(--border)] text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 font-medium">Turno</th>
                  <th className="px-4 py-2.5 font-medium">Cajero</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total ingreso</th>
                  <th className="px-4 py-2.5 text-right font-medium">Diferencia</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-[var(--border)]">
                {cierres.map((cierre) => (
                  <tr
                    key={cierre.id}
                    onClick={() => navigate(`/caja/${cierre.id}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                      {formatearFechaLarga(cierre.fecha)}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-slate-600 dark:text-slate-300">{cierre.turno}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{cierre.cajero?.name}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-700 dark:text-slate-200">
                      {formatearMoneda(cierre.total_ingreso)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${claseDiferencia(cierre.diferencia)}`}>
                      {formatearMoneda(cierre.diferencia)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CIERRE_ESTILOS[cierre.estado] ?? ''}`}
                      >
                        {ESTADO_CIERRE_ETIQUETAS[cierre.estado] ?? cierre.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {respuesta.last_page > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>
                Página {respuesta.current_page} de {respuesta.last_page} · {respuesta.total} cierres
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={respuesta.current_page <= 1}
                  onClick={() => setPagina((prev) => prev - 1)}
                  className="rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={respuesta.current_page >= respuesta.last_page}
                  onClick={() => setPagina((prev) => prev + 1)}
                  className="rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
