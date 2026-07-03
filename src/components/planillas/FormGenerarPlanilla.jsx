import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import ChecklistEmpleados from './ChecklistEmpleados';
import { NOMBRES_MESES } from '../../utils/moneda';

const HOY = new Date();

const SELECT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

export default function FormGenerarPlanilla({ onGenerada, onCancelar }) {
  const [anio, setAnio] = useState(String(HOY.getFullYear()));
  const [mes, setMes] = useState(String(HOY.getMonth() + 1));
  const [quincena, setQuincena] = useState(String(HOY.getDate() <= 15 ? 1 : 2));
  const [empleados, setEmpleados] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/empleados')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setEmpleados([]));
  }, []);

  function toggle(id) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (seleccionados.size === 0) {
      setError('Selecciona al menos un empleado para la planilla.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post('/planillas', {
        anio: Number(anio),
        mes: Number(mes),
        quincena: Number(quincena),
        empleado_ids: [...seleccionados],
      });
      onGenerada(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="anio_planilla">
            Año
          </label>
          <NumberInput
            id="anio_planilla"
            min="2020"
            max="2100"
            step="1"
            required
            value={anio}
            onChange={(event) => setAnio(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="mes_planilla">
            Mes
          </label>
          <select id="mes_planilla" value={mes} onChange={(event) => setMes(event.target.value)} className={SELECT_CLASES}>
            {NOMBRES_MESES.slice(1).map((nombre, indice) => (
              <option key={nombre} value={indice + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="quincena_planilla">
            Quincena
          </label>
          <select id="quincena_planilla" value={quincena} onChange={(event) => setQuincena(event.target.value)} className={SELECT_CLASES}>
            <option value="1">Quincena 1</option>
            <option value="2">Quincena 2</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          Empleados a incluir ({seleccionados.size} seleccionados)
        </p>
        <ChecklistEmpleados empleados={empleados} seleccionados={seleccionados} onToggle={toggle} />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Generando...' : 'Generar planilla'}
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={submitting}
            className="rounded-lg border-[0.5px] border-[var(--border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
