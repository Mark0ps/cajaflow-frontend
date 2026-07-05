import { useState } from 'react';
import api from '../../api/axios';
import Modal from '../Modal';
import ModalMotivo from '../common/ModalMotivo';
import FormMovimientoEfectivo from './FormMovimientoEfectivo';
import { IconChevronDown, IconEliminar } from '../icons';
import { formatearMoneda } from '../../utils/moneda';

const TIPO_ETIQUETAS = { entrada: 'Entrada', salida: 'Salida' };

/**
 * Widget colapsable: retiros/ingresos de efectivo ajenos a la venta de A2
 * Food durante el turno (exceso retirado, fondo adicional, venta de aceite
 * quemado, etc). El motivo es obligatorio siempre en el backend, así que la
 * eliminación siempre pasa por ModalMotivo, sin importar si el cierre sigue
 * abierto.
 */
export default function SeccionMovimientosEfectivo({ cierre, editable, onGuardado }) {
  const movimientos = cierre.movimientos_efectivo ?? [];
  const [abierto, setAbierto] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const neto = movimientos.reduce(
    (acumulado, movimiento) =>
      acumulado + (movimiento.tipo === 'entrada' ? Number(movimiento.monto) : -Number(movimiento.monto)),
    0
  );

  async function confirmarEliminarConMotivo(motivo) {
    setEliminandoId(movimientoAEliminar.id);

    try {
      await api.delete(`/cierres-caja/${cierre.id}/movimientos/${movimientoAEliminar.id}`, { data: { motivo } });
      await onGuardado();
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <section className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Movimientos de efectivo{' '}
          {movimientos.length > 0 && (
            <span className="font-normal text-slate-400 dark:text-slate-500">({movimientos.length})</span>
          )}
        </h2>
        <span className="flex items-center gap-2">
          {movimientos.length > 0 && (
            <span
              className={`text-sm font-semibold ${
                neto < 0
                  ? 'text-red-600 dark:text-red-400'
                  : neto > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {formatearMoneda(neto)} neto
            </span>
          )}
          <IconChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {abierto && (
        <div className="mt-3">
          {movimientos.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Sin movimientos de efectivo en este turno.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {movimientos.map((movimiento) => (
                <li key={movimiento.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p
                      className={`truncate font-medium ${
                        movimiento.tipo === 'entrada'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {TIPO_ETIQUETAS[movimiento.tipo] ?? movimiento.tipo}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {movimiento.motivo}
                      {movimiento.registrado_por?.name && ` · ${movimiento.registrado_por.name}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formatearMoneda(movimiento.monto)}
                    </span>

                    {editable && (
                      <button
                        type="button"
                        onClick={() => setMovimientoAEliminar(movimiento)}
                        disabled={eliminandoId === movimiento.id}
                        aria-label="Eliminar movimiento"
                        className="rounded-md bg-slate-100 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <IconEliminar className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {editable && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="mt-3 rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              + Agregar movimiento
            </button>
          )}
        </div>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Agregar movimiento de efectivo">
        <FormMovimientoEfectivo
          cierreId={cierre.id}
          onGuardado={onGuardado}
          onCancelar={() => setModalAbierto(false)}
        />
      </Modal>

      <ModalMotivo
        open={Boolean(movimientoAEliminar)}
        onClose={() => setMovimientoAEliminar(null)}
        title="Eliminar movimiento de efectivo"
        mensaje="Indica el motivo para eliminar este movimiento de efectivo."
        onConfirmar={confirmarEliminarConMotivo}
      />
    </section>
  );
}
