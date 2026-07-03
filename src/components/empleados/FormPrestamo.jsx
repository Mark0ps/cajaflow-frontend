import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';

const METODOS_COBRO = ['quincenal', 'mensual'];

export default function FormPrestamo({ empleadoId, onCreado }) {
  const [montoOriginal, setMontoOriginal] = useState('');
  const [fechaOtorgado, setFechaOtorgado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [metodoCobro, setMetodoCobro] = useState('quincenal');
  const [montoCuota, setMontoCuota] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/prestamos', {
        empleado_id: empleadoId,
        monto_original: montoOriginal,
        fecha_otorgado: fechaOtorgado,
        motivo: motivo.trim() || null,
        metodo_cobro: metodoCobro,
        monto_cuota: montoCuota,
      });
      setMontoOriginal('');
      setFechaOtorgado('');
      setMotivo('');
      setMetodoCobro('quincenal');
      setMontoCuota('');
      onCreado(data);
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
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="monto_original">
            Monto del préstamo
          </label>
          <NumberInput
            id="monto_original"
            min="0.01"
            step="0.01"
            required
            value={montoOriginal}
            onChange={(event) => setMontoOriginal(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="fecha_otorgado">
            Fecha otorgado
          </label>
          <input
            id="fecha_otorgado"
            type="date"
            required
            value={fechaOtorgado}
            onChange={(event) => setFechaOtorgado(event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="motivo_prestamo">
          Motivo (opcional)
        </label>
        <input
          id="motivo_prestamo"
          type="text"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="metodo_cobro">
            Método de cobro
          </label>
          <select
            id="metodo_cobro"
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
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="monto_cuota">
            Cuota
          </label>
          <NumberInput
            id="monto_cuota"
            min="0.01"
            step="0.01"
            required
            value={montoCuota}
            onChange={(event) => setMontoCuota(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        {submitting ? 'Guardando...' : 'Otorgar préstamo'}
      </button>
    </form>
  );
}
