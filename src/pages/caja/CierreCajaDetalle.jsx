import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import { useAuth } from '../../context/AuthContext';
import ResumenCierre from '../../components/caja/ResumenCierre';
import SeccionIngresos from '../../components/caja/SeccionIngresos';
import SeccionGastos from '../../components/caja/SeccionGastos';
import SeccionVales from '../../components/caja/SeccionVales';
import SeccionMovimientosEfectivo from '../../components/caja/SeccionMovimientosEfectivo';
import SeccionObservaciones from '../../components/caja/SeccionObservaciones';
import SeccionFotos from '../../components/caja/SeccionFotos';
import BotonDescargarResumen from '../../components/caja/BotonDescargarResumen';
import ModalCompletarFactura from '../../components/gastos/ModalCompletarFactura';
import ModalConfirmarPassword from '../../components/common/ModalConfirmarPassword';
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
 * Vista unificada de un cierre para Admin y Secretaria.
 *
 * Admin: puede editar/eliminar ingresos, gastos y vales (con motivo
 * obligatorio si el cierre ya no está abierto), eliminar el cierre completo
 * (con contraseña) y marcar revisado. Secretaria: solo completar N° de
 * factura pendiente y marcar revisado (sin edición de montos).
 */
export default function CierreCajaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';

  const [cierre, setCierre] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gastoFactura, setGastoFactura] = useState(null);
  const [revisando, setRevisando] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');

    api
      .get(`/cierres-caja/${id}`)
      .then(({ data }) => setCierre(data))
      .catch(() => setError('No se pudo cargar el cierre de caja.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!esAdmin) return;

    api
      .get('/empleados', { params: { cargo: 'cajero_barista,cocinero' } })
      .then(({ data }) => setEmpleados(data))
      .catch(() => setEmpleados([]));
  }, [esAdmin]);

  async function refrescar() {
    const { data } = await api.get(`/cierres-caja/${id}`);
    setCierre(data);
  }

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

  async function handleEliminarCierre(password) {
    await api.delete(`/cierres-caja/${id}`, { data: { password } });
    navigate('/caja');
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
  const requerirMotivo = esAdmin && cierre.estado !== 'abierto';

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

        <div className="flex flex-wrap items-center gap-2">
          <BotonDescargarResumen cierre={cierre} />

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

          {esAdmin && (
            <button
              type="button"
              onClick={() => setModalEliminarAbierto(true)}
              className="rounded-lg border-[0.5px] border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Eliminar cierre
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {requerirMotivo && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Este cierre ya no está abierto — cualquier edición te pedirá un motivo, que queda registrado en el historial.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-4">
          {esAdmin ? (
            <>
              <SeccionIngresos cierre={cierre} editable requerirMotivo={requerirMotivo} onGuardado={refrescar} />
              <SeccionGastos cierre={cierre} editable requerirMotivo={requerirMotivo} onGuardado={refrescar} />
              <SeccionVales
                cierre={cierre}
                empleados={empleados}
                editable
                requerirMotivo={requerirMotivo}
                onGuardado={refrescar}
              />
              <SeccionMovimientosEfectivo cierre={cierre} editable requerirMotivo={requerirMotivo} onGuardado={refrescar} />
            </>
          ) : (
            <>
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

              <SeccionMovimientosEfectivo cierre={cierre} editable={false} onGuardado={refrescar} />
            </>
          )}

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

          <SeccionObservaciones
            cierre={cierre}
            editable={esAdmin}
            requerirMotivo={requerirMotivo}
            onGuardado={refrescar}
          />

          <SeccionFotos cierre={cierre} editable={esAdmin} requerirMotivo={requerirMotivo} onGuardado={refrescar} />
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

      <ModalConfirmarPassword
        open={modalEliminarAbierto}
        onClose={() => setModalEliminarAbierto(false)}
        title="Eliminar cierre completo"
        mensaje="Esta acción borra el cierre y todos sus gastos y vales. No se puede deshacer. Confirma tu contraseña de administrador."
        confirmLabel="Eliminar cierre"
        peligro
        onConfirmar={handleEliminarCierre}
      />
    </div>
  );
}
