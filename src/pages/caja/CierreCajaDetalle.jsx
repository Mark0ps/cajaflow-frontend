import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import ResumenCierre from '../../components/caja/ResumenCierre';
import ModalCompletarFactura from '../../components/gastos/ModalCompletarFactura';
import { ESTADO_CIERRE_ESTILOS, ESTADO_CIERRE_ETIQUETAS } from './CierresCajaListado';
import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

function Seccion({ titulo, children }) {
  return (
    <section className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{titulo}</h2>
      {children}
    </section>
  );
}

/**
 * Detalle de un cierre en modo solo lectura, para Admin y Secretaria.
 * Permite completar N° de factura pendiente de los gastos y marcar el
 * cierre como revisado — el resto es consulta.
 */
export default function CierreCajaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cierre, setCierre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gastoFactura, setGastoFactura] = useState(null);
  const [revisando, setRevisando] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');

    api
      .get(`/cierres-caja/${id}`)
      .then(({ data }) => setCierre(data))
      .catch(() => setError('No se pudo cargar el cierre de caja.'))
      .finally(() => setLoading(false));
  }, [id]);

  function handleFacturaGuardada(gastoActualizado) {
    setCierre((prev) => ({
      ...prev,
      gastos: prev.gastos.map((gasto) =>
        gasto.id === gastoActualizado.id ? { ...gasto, ...gastoActualizado } : gasto
      ),
    }));
  }

  async function handleRevisar() {
    setError('');
    setRevisando(true);

    try {
      const { data } = await api.post(`/cierres-caja/${id}/revisar`);
      setCierre((prev) => ({ ...prev, estado: data.estado, revisado_por: data.revisado_por, revisado_en: data.revisado_en }));
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setRevisando(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  if (error && !cierre) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!cierre) return null;

  const gastos = cierre.gastos ?? [];
  const vales = cierre.vales ?? [];
  const empleadosTurno = cierre.empleados_turno ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/caja')}
              className="rounded-lg border-[0.5px] border-[var(--border)] px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              ← Volver
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Cierre — {formatearFechaLarga(cierre.fecha)}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CIERRE_ESTILOS[cierre.estado] ?? ''}`}
            >
              {ESTADO_CIERRE_ETIQUETAS[cierre.estado] ?? cierre.estado}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Turno <span className="capitalize">{cierre.turno}</span> · {cierre.cajero?.name} · Monto de apertura:{' '}
            {formatearMoneda(cierre.monto_inicial)}
            {cierre.revisado_en && ` · Revisado el ${formatearFechaLarga(cierre.revisado_en)}`}
          </p>
        </div>

        {cierre.estado === 'cerrado' && (
          <button
            type="button"
            onClick={handleRevisar}
            disabled={revisando}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {revisando ? 'Marcando...' : 'Marcar revisado'}
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-4">
          <Seccion titulo={`Gastos (${gastos.length})`}>
            {gastos.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Sin gastos registrados.</p>
            ) : (
              <ul className="divide-y-[0.5px] divide-[var(--border)]">
                {gastos.map((gasto) => (
                  <li key={gasto.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {gasto.proveedor?.nombre ?? gasto.proveedor_nombre_libre ?? 'Proveedor sin registrar'}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {gasto.descripcion || 'Sin descripción'}
                        {gasto.numero_factura && ` · Factura ${gasto.numero_factura}`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {gasto.factura_pendiente && (
                        <button
                          type="button"
                          onClick={() => setGastoFactura(gasto)}
                          className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                        >
                          Factura pendiente — completar
                        </button>
                      )}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{formatearMoneda(gasto.valor)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion titulo={`Vales (${vales.length})`}>
            {vales.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Sin vales registrados.</p>
            ) : (
              <ul className="divide-y-[0.5px] divide-[var(--border)]">
                {vales.map((vale) => (
                  <li key={vale.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {vale.empleado?.nombre} {vale.empleado?.apellido}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{vale.descripcion || 'Sin descripción'}</p>
                    </div>
                    <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">
                      {formatearMoneda(vale.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion titulo={`Empleados en turno (${empleadosTurno.length})`}>
            {empleadosTurno.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Sin empleados registrados en el turno.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {empleadosTurno.map((empleado) => (
                  <span
                    key={empleado.id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {empleado.nombre} {empleado.apellido}
                  </span>
                ))}
              </div>
            )}
          </Seccion>

          {cierre.observaciones && (
            <Seccion titulo="Observaciones">
              <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{cierre.observaciones}</p>
            </Seccion>
          )}
        </div>

        <div className="lg:sticky lg:top-4">
          <ResumenCierre cierre={cierre} editable={false} />
        </div>
      </div>

      <ModalCompletarFactura
        open={Boolean(gastoFactura)}
        onClose={() => setGastoFactura(null)}
        gasto={gastoFactura}
        onGuardado={handleFacturaGuardada}
      />
    </div>
  );
}
