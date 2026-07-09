import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import { useAuth } from '../../context/AuthContext';
import ModalConfirmarPassword from '../../components/common/ModalConfirmarPassword';
import { IconEditar, IconEliminar } from '../../components/icons';
import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';
import { SkeletonListado } from '../../components/common/Skeleton';

// Colores semánticos: abierto = gris neutro (en curso, nada que resaltar),
// cerrado = azul (informativo, pendiente de revisión), revisado = verde
// (ciclo completo). Un único badge de Estado refleja las 3 etapas
// directamente — no hay un badge "Revisado" separado porque sería redundante
// con el propio badge de Estado ya en verde.
export const ESTADO_CIERRE_ESTILOS = {
  abierto: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  cerrado: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  revisado_secretaria: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
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
 * Historial de cierres de todos los cajeros, para Admin y Secretaria.
 * Admin puede editar (navegando al detalle) o eliminar el cierre completo
 * directamente desde la card; ambos roles pueden marcar revisado sin salir
 * del listado.
 */
export default function CierresCajaListado() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const esAdmin = user?.role === 'admin';

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('');
  const [cajeroId, setCajeroId] = useState('');
  const [cajeros, setCajeros] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [cierreAEliminar, setCierreAEliminar] = useState(null);

  useEffect(() => {
    api
      .get('/cajeros')
      .then(({ data }) => setCajeros(data))
      .catch(() => setCajeros([]));
  }, []);

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
    if (cajeroId) params.cajero_id = cajeroId;

    api
      .get('/cierres-caja', { params })
      .then(({ data }) => setRespuesta(data))
      .catch(() => setError('No se pudieron cargar los cierres de caja.'))
      .finally(() => setLoading(false));
  }, [desde, hasta, estado, cajeroId, pagina]);

  const cierres = respuesta?.data ?? [];

  function cambiarFiltro(setter) {
    return (event) => {
      setter(event.target.value);
      setPagina(1);
    };
  }

  function actualizarCierreLocal(id, cambios) {
    setRespuesta((prev) => ({
      ...prev,
      data: prev.data.map((c) => (c.id === id ? { ...c, ...cambios } : c)),
    }));
  }

  async function handleMarcarRevisado(cierre, event) {
    event.stopPropagation();
    setError('');
    setProcesandoId(cierre.id);

    try {
      const { data } = await api.post(`/cierres-caja/${cierre.id}/revisar`);
      actualizarCierreLocal(cierre.id, { estado: data.estado, revisado_en: data.revisado_en });
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleEliminarConPassword(password) {
    await api.delete(`/cierres-caja/${cierreAEliminar.id}`, { data: { password } });
    setRespuesta((prev) => ({ ...prev, data: prev.data.filter((c) => c.id !== cierreAEliminar.id) }));
    setCierreAEliminar(null);
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
              <option value="cerrado">Cerrado (sin revisar)</option>
              <option value="revisado_secretaria">Revisado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="filtro_cajero">
              Cajero
            </label>
            <select id="filtro_cajero" value={cajeroId} onChange={cambiarFiltro(setCajeroId)} className={INPUT_CLASES}>
              <option value="">Todos</option>
              {cajeros.map((cajero) => (
                <option key={cajero.id} value={cajero.id}>
                  {cajero.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonListado />
      ) : cierres.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay cierres de caja para los filtros seleccionados.
        </p>
      ) : (
        <>
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-col gap-2">
            {cierres.map((cierre) => (
              <div
                key={cierre.id}
                onClick={() => navigate(`/caja/${cierre.id}`)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {cierre.cajero?.name}{' '}
                    <span className="font-normal text-slate-400 dark:text-slate-500">
                      · Turno <span className="capitalize">{cierre.turno}</span>
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {formatearFechaLarga(cierre.fecha)} · Diferencia:{' '}
                    <span className={`font-medium ${claseDiferencia(cierre.diferencia)}`}>
                      {formatearMoneda(cierre.diferencia)}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CIERRE_ESTILOS[cierre.estado] ?? ''}`}
                  >
                    {ESTADO_CIERRE_ETIQUETAS[cierre.estado] ?? cierre.estado}
                  </span>

                  {esAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/caja/${cierre.id}`);
                        }}
                        aria-label="Editar cierre"
                        className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <IconEditar className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCierreAEliminar(cierre);
                        }}
                        aria-label="Eliminar cierre"
                        className="rounded-md bg-slate-100 p-1.5 text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <IconEliminar className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {cierre.estado === 'cerrado' && (
                    <button
                      type="button"
                      onClick={(event) => handleMarcarRevisado(cierre, event)}
                      disabled={procesandoId === cierre.id}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      {procesandoId === cierre.id ? 'Marcando...' : 'Marcar revisado'}
                    </button>
                  )}
                </div>
              </div>
            ))}
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

      <ModalConfirmarPassword
        open={Boolean(cierreAEliminar)}
        onClose={() => setCierreAEliminar(null)}
        title="Eliminar cierre completo"
        mensaje={
          cierreAEliminar &&
          `Esta acción borra el cierre de ${cierreAEliminar.cajero?.name} (${formatearFechaLarga(cierreAEliminar.fecha)}) y todos sus gastos y vales. No se puede deshacer.`
        }
        confirmLabel="Eliminar cierre"
        peligro
        onConfirmar={handleEliminarConPassword}
      />
    </div>
  );
}
