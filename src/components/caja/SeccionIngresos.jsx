import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';

const CAMPOS = [
  {
    name: 'efectivo',
    label: 'Efectivo en caja',
    tooltip: 'Lo que queda físico en caja al cierre, ya sin gastos/vales.',
  },
  { name: 'tarjeta_credito', label: 'Tarjeta de crédito' },
  { name: 'transferencia', label: 'Transferencia' },
  { name: 'venta_sistema_a2', label: 'Venta sistema A2 Food' },
];

export default function SeccionIngresos({ cierre, editable, onGuardado }) {
  const [valores, setValores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValores({
      efectivo: cierre.efectivo ?? '0',
      tarjeta_credito: cierre.tarjeta_credito ?? '0',
      transferencia: cierre.transferencia ?? '0',
      venta_sistema_a2: cierre.venta_sistema_a2 ?? '',
    });
  }, [cierre]);

  function handleChange(name, value) {
    setValores((actual) => ({ ...actual, [name]: value }));
  }

  async function guardar() {
    setError('');
    setGuardando(true);

    try {
      await api.patch(`/cierres-caja/${cierre.id}/ingresos`, {
        efectivo: valores.efectivo || 0,
        tarjeta_credito: valores.tarjeta_credito || 0,
        transferencia: valores.transferencia || 0,
        venta_sistema_a2: valores.venta_sistema_a2 === '' ? null : valores.venta_sistema_a2,
      });
      await onGuardado();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Ingresos del turno</h2>

      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CAMPOS.map((campo) => (
          <div key={campo.name}>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={campo.name}>
              {campo.label}
              {campo.tooltip && (
                <span
                  title={campo.tooltip}
                  aria-label={campo.tooltip}
                  className="cursor-help text-slate-400 dark:text-slate-500"
                >
                  ⓘ
                </span>
              )}
            </label>
            <NumberInput
              id={campo.name}
              step="0.01"
              min="0"
              disabled={!editable}
              value={valores[campo.name] ?? ''}
              onChange={(event) => handleChange(campo.name, event.target.value)}
              onBlur={guardar}
              className="px-2 py-1.5 disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            />
          </div>
        ))}
      </div>

      {guardando && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Guardando...</p>}
    </section>
  );
}
