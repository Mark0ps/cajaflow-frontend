import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';

/**
 * A diferencia de gastos/vales, el motivo aquí es obligatorio siempre (no
 * solo cuando el cierre ya no está abierto) — así lo exige el backend.
 * En modo edición, ese motivo es una propiedad del movimiento y sigue siendo
 * editable; la justificación de la edición (motivo_edicion) es un campo
 * aparte, obligatorio solo cuando el cierre ya no está abierto
 * (requerirMotivoEdicion), igual que en gastos/vales.
 */
export default function FormMovimientoEfectivo({ cierreId, movimiento = null, requerirMotivoEdicion = false, onGuardado, onCancelar }) {
  const editando = Boolean(movimiento);

  const [tipo, setTipo] = useState(movimiento?.tipo ?? 'entrada');
  const [monto, setMonto] = useState(movimiento ? String(movimiento.monto) : '');
  const [motivo, setMotivo] = useState(movimiento?.motivo ?? '');
  const [motivoEdicion, setMotivoEdicion] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (motivo.trim() === '') {
      setError('El motivo es obligatorio.');
      return;
    }

    if (editando && requerirMotivoEdicion && motivoEdicion.trim() === '') {
      setError('El motivo de la edición es obligatorio: este cierre ya no está abierto.');
      return;
    }

    setSubmitting(true);

    try {
      if (editando) {
        await api.patch(`/cierres-caja/${cierreId}/movimientos/${movimiento.id}`, {
          tipo,
          monto,
          motivo: motivo.trim(),
          ...(requerirMotivoEdicion ? { motivo_edicion: motivoEdicion.trim() } : {}),
        });
      } else {
        await api.post(`/cierres-caja/${cierreId}/movimientos`, {
          tipo,
          monto,
          motivo: motivo.trim(),
        });
      }
      await onGuardado();
      onCancelar?.();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="tipo_movimiento">
          Tipo
        </label>
        <select
          id="tipo_movimiento"
          value={tipo}
          onChange={(event) => setTipo(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        >
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="monto_movimiento">
          Monto
        </label>
        <NumberInput
          id="monto_movimiento"
          step="0.01"
          min="0.01"
          required
          value={monto}
          onChange={(event) => setMonto(event.target.value)}
          className="px-2 py-1.5"
        />
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="motivo_movimiento">
          Motivo
        </label>
        <textarea
          id="motivo_movimiento"
          rows={3}
          required
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        />
      </div>

      {editando && requerirMotivoEdicion && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="motivo_edicion_movimiento">
            Motivo de la edición (obligatorio: el cierre ya no está abierto)
          </label>
          <textarea
            id="motivo_edicion_movimiento"
            rows={2}
            value={motivoEdicion}
            onChange={(event) => setMotivoEdicion(event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar movimiento'}
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={submitting}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
