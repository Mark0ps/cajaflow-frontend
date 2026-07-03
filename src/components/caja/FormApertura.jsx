import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import { fechaLocalHoy } from '../../utils/moneda';
import NumberInput from '../common/NumberInput';

const TURNOS = [
  { value: 'matutino', label: 'Matutino' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'nocturno', label: 'Nocturno' },
];

export default function FormApertura({ onAbierto }) {
  const [fecha, setFecha] = useState(fechaLocalHoy());
  const [turno, setTurno] = useState('matutino');
  const [montoInicial, setMontoInicial] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/cierres-caja', {
        fecha,
        turno,
        monto_inicial: montoInicial,
      });
      onAbierto(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">Abrir turno de caja</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">No tienes un turno abierto. Abre uno para empezar.</p>

        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}

        <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="fecha">
          Fecha
        </label>
        <input
          id="fecha"
          type="date"
          required
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          className="mb-4 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="turno">
          Turno
        </label>
        <select
          id="turno"
          value={turno}
          onChange={(event) => setTurno(event.target.value)}
          className="mb-4 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        >
          {TURNOS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="monto_inicial">
          Monto inicial
        </label>
        <NumberInput
          id="monto_inicial"
          step="0.01"
          min="0"
          required
          value={montoInicial}
          onChange={(event) => setMontoInicial(event.target.value)}
          className="mb-6 px-3 py-2"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-slate-800 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Abriendo...' : 'Abrir turno'}
        </button>
      </form>
    </div>
  );
}
