import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';

const METODOS_COBRO = ['quincenal', 'mensual'];

/** Mismo formulario para otorgar un préstamo nuevo o editar uno sin abonos aún (pasar `prestamo`). */
export default function FormPrestamo({ empleadoId, prestamo, onGuardado, onCancelar }) {
  const editando = Boolean(prestamo);
  // Sufijo para que los ids no choquen con el formulario de "Otorgar nuevo
  // préstamo" cuando este mismo componente se abre en modo edición dentro
  // de un modal sobre la misma página (dos instancias montadas a la vez).
  const sufijo = editando ? `editar_${prestamo.id}` : 'nuevo';

  const [montoOriginal, setMontoOriginal] = useState(prestamo ? String(prestamo.monto_original) : '');
  const [fechaOtorgado, setFechaOtorgado] = useState(prestamo ? String(prestamo.fecha_otorgado).slice(0, 10) : '');
  const [motivo, setMotivo] = useState(prestamo?.motivo ?? '');
  const [metodoCobro, setMetodoCobro] = useState(prestamo?.metodo_cobro ?? 'quincenal');
  const [montoCuota, setMontoCuota] = useState(prestamo ? String(prestamo.monto_cuota) : '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      monto_original: montoOriginal,
      fecha_otorgado: fechaOtorgado,
      motivo: motivo.trim() || null,
      metodo_cobro: metodoCobro,
      monto_cuota: montoCuota,
    };

    try {
      const { data } = editando
        ? await api.patch(`/prestamos/${prestamo.id}`, payload)
        : await api.post('/prestamos', { ...payload, empleado_id: empleadoId });

      if (!editando) {
        setMontoOriginal('');
        setFechaOtorgado('');
        setMotivo('');
        setMetodoCobro('quincenal');
        setMontoCuota('');
      }
      onGuardado(data);
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

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`monto_original_${sufijo}`}>
            Monto del préstamo
          </label>
          <NumberInput
            id={`monto_original_${sufijo}`}
            min="0.01"
            step="0.01"
            required
            value={montoOriginal}
            onChange={(event) => setMontoOriginal(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`fecha_otorgado_${sufijo}`}>
            Fecha otorgado
          </label>
          <input
            id={`fecha_otorgado_${sufijo}`}
            type="date"
            required
            value={fechaOtorgado}
            onChange={(event) => setFechaOtorgado(event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`motivo_prestamo_${sufijo}`}>
          Motivo (opcional)
        </label>
        <input
          id={`motivo_prestamo_${sufijo}`}
          type="text"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`metodo_cobro_${sufijo}`}>
            Método de cobro
          </label>
          <select
            id={`metodo_cobro_${sufijo}`}
            value={metodoCobro}
            onChange={(event) => setMetodoCobro(event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
          >
            {METODOS_COBRO.map((valor) => (
              <option key={valor} value={valor} className="capitalize">
                {valor}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`monto_cuota_${sufijo}`}>
            Cuota
          </label>
          <NumberInput
            id={`monto_cuota_${sufijo}`}
            min="0.01"
            step="0.01"
            required
            value={montoCuota}
            onChange={(event) => setMontoCuota(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Otorgar préstamo'}
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
