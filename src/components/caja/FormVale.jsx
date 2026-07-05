import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';

export default function FormVale({ cierreId, empleados, vale = null, requerirMotivo = false, onGuardado, onCancelar }) {
  const editando = Boolean(vale);

  const [empleadoId, setEmpleadoId] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!vale) return;

    setEmpleadoId(String(vale.empleado_id ?? vale.empleado?.id ?? ''));
    setMonto(String(vale.monto ?? ''));
    setDescripcion(vale.descripcion ?? '');
    // Solo se precarga al entrar en modo edición de este vale en particular.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vale?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!empleadoId) {
      setError('Selecciona un empleado.');
      return;
    }

    if (requerirMotivo && motivo.trim() === '') {
      setError('El motivo es obligatorio: este cierre ya no está abierto.');
      return;
    }

    setSubmitting(true);

    try {
      if (editando) {
        await api.patch(`/cierres-caja/${cierreId}/vales/${vale.id}`, {
          empleado_id: empleadoId,
          monto,
          descripcion: descripcion || null,
          ...(requerirMotivo ? { motivo: motivo.trim() } : {}),
        });
      } else {
        await api.post(`/cierres-caja/${cierreId}/vales`, {
          empleado_id: empleadoId,
          monto,
          descripcion: descripcion || null,
          ...(requerirMotivo ? { motivo: motivo.trim() } : {}),
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
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="empleado_vale">
          Empleado
        </label>
        <select
          id="empleado_vale"
          required
          value={empleadoId}
          onChange={(event) => setEmpleadoId(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        >
          <option value="">Selecciona...</option>
          {empleados.map((empleado) => (
            <option key={empleado.id} value={empleado.id}>
              {empleado.nombre} {empleado.apellido}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="monto_vale">
            Monto
          </label>
          <NumberInput
            id="monto_vale"
            step="0.01"
            min="0.01"
            required
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="descripcion_vale">
            Descripción (opcional)
          </label>
          <input
            id="descripcion_vale"
            type="text"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
          />
        </div>
      </div>

      {requerirMotivo && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="motivo_vale">
            Motivo (obligatorio: el cierre ya no está abierto)
          </label>
          <textarea
            id="motivo_vale"
            rows={2}
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
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
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar vale'}
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
