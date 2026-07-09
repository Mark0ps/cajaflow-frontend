import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';
import ModalMotivo from '../common/ModalMotivo';
import NumberInput from '../common/NumberInput';
import { IconEditar, IconEliminar } from '../icons';
import { SkeletonLineas } from '../common/Skeleton';
import { fechaLocalHoy, formatearFechaCorta, formatearMoneda, generarOpcionesMes } from '../../utils/moneda';

const SELECT_CLASES =
  'rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

/**
 * Vista de supervisión de Admin sobre TODOS los vales del mes (de turno y
 * libres). A diferencia de la edición normal de un vale durante un turno
 * abierto, aquí editar/eliminar SIEMPRE exige un motivo, que queda registrado
 * en `historial` — toda corrección "en frío" debe quedar justificada.
 */
export default function HistorialVales({ refreshKey }) {
  const [mesSeleccionado, setMesSeleccionado] = useState(generarOpcionesMes(1)[0].value);
  const [vales, setVales] = useState(null); // null = cargando
  const [error, setError] = useState('');
  const [valeEditando, setValeEditando] = useState(null);
  const [valeAEliminar, setValeAEliminar] = useState(null);

  const opcionesMes = generarOpcionesMes(24);

  async function cargar() {
    setError('');
    const [anio, mes] = mesSeleccionado.split('-');

    try {
      // Number(): "07" con cero inicial no pasa la regla `integer` del backend
      const { data } = await api.get('/vales', { params: { anio: Number(anio), mes: Number(mes) } });
      setVales(data);
    } catch (err) {
      setError(extraerMensajeError(err));
      setVales([]);
    }
  }

  useEffect(() => {
    setVales(null);
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSeleccionado, refreshKey]);

  function rutaVale(vale) {
    // Los vales de turno se editan por su ruta anidada (recalcula los totales
    // del cierre); los libres por la ruta top-level.
    return vale.cierre_caja_id ? `/cierres-caja/${vale.cierre_caja_id}/vales/${vale.id}` : `/vales/${vale.id}`;
  }

  async function confirmarEliminar(motivo) {
    await api.delete(rutaVale(valeAEliminar), { data: { motivo } });
    await cargar();
  }

  const totalMes = (vales ?? []).reduce((suma, v) => suma + Number(v.monto), 0);

  return (
    <div className="mt-4 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Historial de vales{' '}
          {vales && vales.length > 0 && (
            <span className="font-normal text-slate-400 dark:text-slate-500">
              ({vales.length} · {formatearMoneda(totalMes)})
            </span>
          )}
        </h2>
        <select
          value={mesSeleccionado}
          onChange={(event) => setMesSeleccionado(event.target.value)}
          aria-label="Mes del historial"
          className={SELECT_CLASES}
        >
          {opcionesMes.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {vales === null ? (
        <div className="py-2">
          <SkeletonLineas lineas={3} />
        </div>
      ) : vales.length === 0 ? (
        <p className="py-4 text-sm text-slate-400 dark:text-slate-500">Sin vales en este mes.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {vales.map((vale) => (
            <li key={vale.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {vale.empleado?.nombre} {vale.empleado?.apellido}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatearMoneda(vale.monto)}
                  </span>
                  {vale.cierre_caja_id ? (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      Turno
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Libre
                    </span>
                  )}
                  {vale.aplicado_en_planilla && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      Aplicado a planilla
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {formatearFechaCorta(vale.fecha_emision)}
                  {vale.descripcion ? ` · ${vale.descripcion}` : ''}
                  {/* la relación registradoPor serializa sobre la clave
                      registrado_por (pisa el FK entero) */}
                  {vale.registrado_por?.name ? ` · Registró: ${vale.registrado_por.name}` : ''}
                </p>
              </div>

              {vale.aplicado_en_planilla ? (
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500" title="Gestión desde la planilla en borrador (o forzar eliminación desde su widget de vales)">
                  Bloqueado
                </span>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setValeEditando(vale)}
                    aria-label="Editar vale"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    <IconEditar className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setValeAEliminar(vale)}
                    aria-label="Eliminar vale"
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <IconEliminar className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ModalEditarVale
        vale={valeEditando}
        onClose={() => setValeEditando(null)}
        rutaVale={rutaVale}
        onGuardado={cargar}
      />

      <ModalMotivo
        open={Boolean(valeAEliminar)}
        onClose={() => setValeAEliminar(null)}
        title="Eliminar vale"
        mensaje={
          valeAEliminar
            ? `Se eliminará el vale de ${formatearMoneda(valeAEliminar.monto)} de ${valeAEliminar.empleado?.nombre ?? ''} ${valeAEliminar.empleado?.apellido ?? ''}. Indica el motivo — queda registrado en el historial.`
            : ''
        }
        onConfirmar={confirmarEliminar}
      />
    </div>
  );
}

function ModalEditarVale({ vale, onClose, rutaVale, onGuardado }) {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!vale) return;
    setMonto(String(vale.monto ?? ''));
    setDescripcion(vale.descripcion ?? '');
    setFechaEmision(String(vale.fecha_emision ?? '').slice(0, 10));
    setMotivo('');
    setError('');
  }, [vale]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (motivo.trim() === '') {
      setError('El motivo es obligatorio.');
      return;
    }

    setError('');
    setGuardando(true);

    const payload = { monto, descripcion: descripcion.trim() || null, motivo: motivo.trim() };
    // La fecha solo es editable en vales libres — la de un vale de turno es la
    // fecha del cierre.
    if (!vale.cierre_caja_id) payload.fecha_emision = fechaEmision;

    try {
      await api.patch(rutaVale(vale), payload);
      await onGuardado();
      onClose();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open={Boolean(vale)} onClose={guardando ? () => {} : onClose} title="Editar vale">
      {vale && (
        <form onSubmit={handleSubmit}>
          <p className="mb-3 text-xs text-[var(--text-muted)]">
            {vale.empleado?.nombre} {vale.empleado?.apellido} · {vale.cierre_caja_id ? 'Vale de turno' : 'Vale libre'}
          </p>

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
          )}

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`monto_hist_${vale.id}`}>
                Monto
              </label>
              <NumberInput
                id={`monto_hist_${vale.id}`}
                min="0.01"
                step="0.01"
                required
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                className="px-2 py-1.5"
              />
            </div>
            {!vale.cierre_caja_id && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`fecha_hist_${vale.id}`}>
                  Fecha de emisión
                </label>
                <input
                  id={`fecha_hist_${vale.id}`}
                  type="date"
                  required
                  max={fechaLocalHoy()}
                  value={fechaEmision}
                  onChange={(event) => setFechaEmision(event.target.value)}
                  className={INPUT_CLASES}
                />
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`desc_hist_${vale.id}`}>
              Descripción (opcional)
            </label>
            <textarea
              id={`desc_hist_${vale.id}`}
              rows={2}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              className={INPUT_CLASES}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`motivo_hist_${vale.id}`}>
              Motivo de la corrección
            </label>
            <textarea
              id={`motivo_hist_${vale.id}`}
              rows={2}
              required
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Queda registrado en el historial"
              className={INPUT_CLASES}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={guardando || motivo.trim() === ''}
              className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="rounded-lg border-[0.5px] border-[var(--border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
