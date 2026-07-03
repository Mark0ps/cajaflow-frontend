import { useEffect, useState } from 'react';
import api from '../../api/axios';
import ModalCompletarFactura from '../../components/gastos/ModalCompletarFactura';
import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

/**
 * Gastos cuyo N° de factura quedó pendiente (de cierres de caja o externos).
 * Secretaria los completa desde aquí; al guardarse salen del listado.
 */
export default function FacturasPendientes() {
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null);

  function cargar() {
    setLoading(true);
    setError('');

    api
      .get('/gastos', { params: { factura_pendiente: 1, page: pagina } })
      .then(({ data }) => setRespuesta(data))
      .catch(() => setError('No se pudieron cargar las facturas pendientes.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [pagina]);

  function handleGuardada() {
    // El gasto deja de estar pendiente: se recarga el listado.
    cargar();
  }

  const gastos = respuesta?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Facturas pendientes</h1>

      {loading ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : error ? (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : gastos.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay facturas pendientes. 🎉
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)]">
            <table className="w-full text-sm">
              <thead className="border-b-[0.5px] border-[var(--border)] text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Proveedor</th>
                  <th className="px-4 py-2.5 font-medium">Descripción</th>
                  <th className="px-4 py-2.5 font-medium">Origen</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-[var(--border)]">
                {gastos.map((gasto) => (
                  <tr key={gasto.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                      {gasto.proveedor?.nombre ?? gasto.proveedor_nombre_libre ?? 'Sin registrar'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{gasto.descripcion || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {gasto.es_externo
                        ? 'Gasto externo'
                        : gasto.cierre_caja
                          ? `Caja ${formatearFechaLarga(gasto.cierre_caja.fecha)} (${gasto.cierre_caja.turno})`
                          : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                      {formatearMoneda(gasto.valor)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setGastoSeleccionado(gasto)}
                        className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                      >
                        Completar factura
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {respuesta.last_page > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>
                Página {respuesta.current_page} de {respuesta.last_page} · {respuesta.total} pendientes
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

      <ModalCompletarFactura
        open={Boolean(gastoSeleccionado)}
        onClose={() => setGastoSeleccionado(null)}
        gasto={gastoSeleccionado}
        onGuardado={handleGuardada}
      />
    </div>
  );
}
