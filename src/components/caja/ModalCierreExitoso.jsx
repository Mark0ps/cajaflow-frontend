import { useEffect } from 'react';
import BotonDescargarResumen from './BotonDescargarResumen';
import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

const TURNO_ETIQUETAS = { matutino: 'Matutino', tarde: 'Tarde', nocturno: 'Nocturno' };

/**
 * Confirmación prominente al cerrar un turno (reemplaza el toast anterior,
 * fácil de pasar por alto). Pantalla completa en móvil, modal centrado en
 * desktop — ver CLAUDE.md "confirmación prominente al cerrar un turno".
 */
export default function ModalCierreExitoso({ open, cierre, onVerDetalle, onVolverInicio, onClose }) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !cierre) return null;

  const diferencia = Number(cierre.diferencia ?? 0);
  const diferenciaEstilo =
    diferencia === 0
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : diferencia < 0
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300';
  const diferenciaEtiqueta = diferencia === 0 ? '(cuadra)' : diferencia < 0 ? '(faltante)' : '(sobrante)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cierre-exitoso-titulo"
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full flex-col justify-center overflow-y-auto bg-[var(--surface-2)] p-6 [animation:cierre-modal-in_250ms_ease-out_both] sm:h-auto sm:max-h-[90vh] sm:max-w-sm sm:rounded-xl sm:border-[0.5px] sm:border-[var(--border)] sm:p-8 sm:shadow-lg"
      >
        <div className="relative mx-auto mb-5 h-16 w-16 shrink-0">
          <div className="absolute inset-0 rounded-full bg-emerald-500 [animation:cierre-check-pop_300ms_ease-out_both]" />
          <svg
            viewBox="0 0 24 24"
            className="absolute inset-0 h-full w-full p-[18px]"
            fill="none"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M5 13l4 4L19 7"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
              className="[animation:cierre-check-draw_250ms_ease-out_150ms_both]"
            />
          </svg>
        </div>

        <div className="mb-5 text-center">
          <h2 id="cierre-exitoso-titulo" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Turno cerrado
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            · Turno {TURNO_ETIQUETAS[cierre.turno] ?? cierre.turno} · {formatearFechaLarga(cierre.fecha)} ·{' '}
            
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {cierre.cajero?.name}
          </p>
        </div>

        <div className={`mb-6 flex items-center justify-between rounded-lg border px-3 py-2.5 ${diferenciaEstilo}`}>
          <span className="text-sm font-medium">Diferencia</span>
          <span className="text-base font-bold">
            {formatearMoneda(diferencia)} <span className="font-medium">{diferenciaEtiqueta}</span>
          </span>
        </div>

        <div className="space-y-2">
          <BotonDescargarResumen
            cierre={cierre}
            label="Descargar / compartir resumen"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          />

          <button
            type="button"
            onClick={onVerDetalle}
            className="w-full rounded-lg border-[0.5px] border-[var(--border)] px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Ver detalle del cierre
          </button>

          <button
            type="button"
            onClick={onVolverInicio}
            className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
