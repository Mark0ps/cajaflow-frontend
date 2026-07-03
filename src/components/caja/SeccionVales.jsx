import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import FormVale from './FormVale';
import Modal from '../Modal';
import { IconEditar, IconEliminar } from '../icons';
import { formatearMoneda } from '../../utils/moneda';

export default function SeccionVales({ cierre, empleados, editable, onGuardado }) {
  const vales = cierre.vales ?? [];
  const [modalAbierto, setModalAbierto] = useState(false);
  const [valeEditando, setValeEditando] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState('');

  function abrirNuevo() {
    setValeEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(vale) {
    setValeEditando(vale);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setValeEditando(null);
  }

  async function handleEliminar(vale) {
    if (!window.confirm('¿Eliminar este vale? Esta acción no se puede deshacer.')) {
      return;
    }

    setError('');
    setEliminandoId(vale.id);

    try {
      await api.delete(`/cierres-caja/${cierre.id}/vales/${vale.id}`);
      await onGuardado();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Vales {vales.length > 0 && <span className="font-normal text-slate-400 dark:text-slate-500">({vales.length})</span>}
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

      {vales.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Sin vales registrados en este turno.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {vales.map((vale) => (
            <li key={vale.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700 dark:text-slate-200">
                  {vale.empleado?.nombre} {vale.empleado?.apellido}
                </p>
                {vale.descripcion && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{vale.descripcion}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {formatearMoneda(vale.monto)}
                </span>

                {editable && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => abrirEditar(vale)}
                      aria-label="Editar vale"
                      className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <IconEditar className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(vale)}
                      disabled={eliminandoId === vale.id}
                      aria-label="Eliminar vale"
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

      <Modal open={modalAbierto} onClose={cerrarModal} title={valeEditando ? 'Editar vale' : 'Agregar vale'}>
        <FormVale
          cierreId={cierre.id}
          empleados={empleados}
          vale={valeEditando}
          onGuardado={onGuardado}
          onCancelar={cerrarModal}
        />
      </Modal>
    </section>
  );
}
