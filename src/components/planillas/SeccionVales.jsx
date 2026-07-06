import { useState } from 'react';
import { IconChevronDown } from '../icons';
import { formatearMoneda } from '../../utils/moneda';

/**
 * Widget colapsable de solo lectura: vales absorbidos automáticamente al
 * generar la planilla (ya suman a total_vales, pero antes no se veían en
 * ningún lado). Editar/eliminar un vale se sigue haciendo desde el módulo de
 * Vales, no desde aquí.
 */
export default function SeccionVales({ detalle, encabezado = true }) {
  const [abierto, setAbierto] = useState(false);
  const mostrarContenido = encabezado ? abierto : true;
  const vales = detalle.vales ?? [];
  const total = vales.reduce((acumulado, vale) => acumulado + Number(vale.monto), 0);

  return (
    <div className={encabezado ? 'mt-3 border-t-[0.5px] border-[var(--border)] pt-3' : ''}>
      {encabezado && (
        <button
          type="button"
          onClick={() => setAbierto((prev) => !prev)}
          className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          <span>Vales {vales.length > 0 && `(${vales.length})`}</span>
          <span className="flex items-center gap-2">
            {vales.length > 0 && (
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatearMoneda(total)}</span>
            )}
            <IconChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
          </span>
        </button>
      )}

      {mostrarContenido && (
        <div className={encabezado ? 'mt-2' : ''}>
          {vales.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Sin vales aplicados a esta quincena.</p>
          ) : (
            <ul className="divide-y-[0.5px] divide-[var(--border)]">
              {vales.map((vale) => (
                <li key={vale.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate text-slate-600 dark:text-slate-300">{vale.descripcion || 'Sin descripción'}</p>
                    <p className="text-slate-400 dark:text-slate-500">
                      {String(vale.fecha_emision).slice(0, 10)} · {vale.registrado_por?.name ?? '—'}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">
                    {formatearMoneda(vale.monto)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
