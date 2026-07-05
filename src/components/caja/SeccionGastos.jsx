import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import FormGasto from './FormGasto';
import Modal from '../Modal';
import ModalMotivo from '../common/ModalMotivo';
import { IconEditar, IconEliminar } from '../icons';
import { formatearMoneda } from '../../utils/moneda';

export default function SeccionGastos({ cierre, editable, requerirMotivo = false, onGuardado }) {
  const gastos = cierre.gastos ?? [];
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [gastoAEliminar, setGastoAEliminar] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState('');

  function abrirNuevo() {
    setGastoEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(gasto) {
    setGastoEditando(gasto);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setGastoEditando(null);
  }

  async function handleEliminar(gasto) {
    if (requerirMotivo) {
      setGastoAEliminar(gasto);
      return;
    }

    if (!window.confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.')) {
      return;
    }

    setError('');
    setEliminandoId(gasto.id);

    try {
      await api.delete(`/cierres-caja/${cierre.id}/gastos/${gasto.id}`);
      await onGuardado();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setEliminandoId(null);
    }
  }

  async function confirmarEliminarConMotivo(motivo) {
    setEliminandoId(gastoAEliminar.id);

    try {
      await api.delete(`/cierres-caja/${cierre.id}/gastos/${gastoAEliminar.id}`, { data: { motivo } });
      await onGuardado();
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <section className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Gastos {gastos.length > 0 && <span className="font-normal text-slate-400 dark:text-slate-500">({gastos.length})</span>}
        </h2>
        {editable && (
          <button
            type="button"
            onClick={abrirNuevo}
            className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            + Agregar
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {gastos.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Sin gastos registrados en este turno.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {gastos.map((gasto) => (
            <li key={gasto.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {gasto.proveedor?.nombre ?? gasto.proveedor_nombre_libre ?? 'N/A'}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {[
                    gasto.descripcion,
                    gasto.numero_factura ? `Factura ${gasto.numero_factura}` : 'Factura pendiente',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {formatearMoneda(gasto.valor)}
                </span>

                {editable && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => abrirEditar(gasto)}
                      aria-label="Editar gasto"
                      className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <IconEditar className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(gasto)}
                      disabled={eliminandoId === gasto.id}
                      aria-label="Eliminar gasto"
                      className="rounded-md bg-slate-100 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      <IconEliminar className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalAbierto} onClose={cerrarModal} title={gastoEditando ? 'Editar gasto' : 'Agregar gasto'}>
        <FormGasto
          cierreId={cierre.id}
          gasto={gastoEditando}
          requerirMotivo={requerirMotivo}
          onGuardado={onGuardado}
          onCancelar={cerrarModal}
        />
      </Modal>

      <ModalMotivo
        open={Boolean(gastoAEliminar)}
        onClose={() => setGastoAEliminar(null)}
        title="Eliminar gasto"
        mensaje="Este cierre ya no está abierto. Indica el motivo para eliminar este gasto."
        onConfirmar={confirmarEliminarConMotivo}
      />
    </section>
  );
}
