import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import { IconChevronDown } from '../icons';
import { formatearMoneda } from '../../utils/moneda';

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

function difieren(a, b) {
  return Number(a).toFixed(2) !== Number(b).toFixed(2);
}

/**
 * Sección colapsable del préstamo activo aplicado a esta quincena. Solo se
 * renderiza si el detalle tiene un abono de préstamo (generarDetalleEmpleado
 * ya lo crea automáticamente si el empleado tenía un préstamo activo).
 */
export default function SeccionPrestamo({ planillaId, detalle, editable, onDetalleActualizado }) {
  const [abierto, setAbierto] = useState(false);
  const [abono, setAbono] = useState(detalle.prestamo_abonos?.[0] ?? null);
  const [monto, setMonto] = useState(abono ? String(abono.monto) : '');
  const [motivo, setMotivo] = useState(abono?.motivo ?? '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!abono || !abono.prestamo) return null;

  const prestamo = abono.prestamo;
  const montoCuota = Number(prestamo.monto_cuota);
  const saldoDespues = Number(prestamo.saldo_pendiente);
  const saldoAntes = saldoDespues + Number(abono.monto);
  const requiereMotivo = monto.trim() !== '' && difieren(monto, montoCuota);

  async function guardar() {
    setError('');

    if (monto.trim() === '' || Number.isNaN(Number(monto)) || Number(monto) <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }

    if (requiereMotivo && !motivo.trim()) {
      setError('El motivo es obligatorio cuando el monto es distinto a la cuota del préstamo.');
      return;
    }

    setGuardando(true);

    try {
      const { data } = await api.patch(`/planillas/${planillaId}/detalles/${detalle.id}/abono-prestamo`, {
        monto,
        motivo: requiereMotivo ? motivo.trim() : null,
      });
      setAbono({ ...data.abono, prestamo: data.prestamo });
      setMonto(String(data.abono.monto));
      setMotivo(data.abono.motivo ?? '');
      onDetalleActualizado(data.detalle);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mt-3 border-t-[0.5px] border-[var(--border)] pt-3">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        <span>Préstamo activo</span>
        <span className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Saldo: {formatearMoneda(saldoDespues)}
          </span>
          <IconChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {abierto && (
        <div className="mt-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
          )}

          <dl className="mb-3 grid grid-cols-3 gap-3 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Saldo antes</dt>
              <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(saldoAntes)}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Cuota</dt>
              <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(montoCuota)}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Saldo después</dt>
              <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(saldoDespues)}</dd>
            </div>
          </dl>

          {editable ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`abono_${detalle.id}`}>
                    Abono
                  </label>
                  <NumberInput
                    id={`abono_${detalle.id}`}
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(event) => setMonto(event.target.value)}
                    disabled={guardando}
                    className="px-2 py-1.5"
                  />
                </div>
              </div>

              {requiereMotivo && (
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`motivo_abono_${detalle.id}`}>
                    Motivo <span className="text-red-500">*</span> (el monto difiere de la cuota)
                  </label>
                  <textarea
                    id={`motivo_abono_${detalle.id}`}
                    rows={2}
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    className={INPUT_CLASES}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {guardando ? 'Guardando...' : 'Actualizar abono'}
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Abono aplicado: {formatearMoneda(abono.monto)}
              {abono.motivo && ` · Motivo: ${abono.motivo}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
