import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import ModalMotivo from '../common/ModalMotivo';

export default function SeccionObservaciones({ cierre, editable, requerirMotivo = false, onGuardado }) {
  const [valor, setValor] = useState(cierre.observaciones ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [modalMotivoAbierto, setModalMotivoAbierto] = useState(false);

  useEffect(() => {
    setValor(cierre.observaciones ?? '');
  }, [cierre.observaciones]);

  async function guardar(motivo) {
    if (!motivo && valor === (cierre.observaciones ?? '')) return;

    setError('');
    setGuardando(true);

    try {
      await api.patch(`/cierres-caja/${cierre.id}/ingresos`, {
        observaciones: valor || null,
        ...(motivo ? { motivo } : {}),
      });
      await onGuardado();
    } catch (err) {
      setError(extraerMensajeError(err));
      throw err;
    } finally {
      setGuardando(false);
    }
  }

  function handleBlur() {
    // Con motivo obligatorio, se guarda solo con el botón explícito de abajo.
    if (requerirMotivo) return;
    guardar();
  }

  return (
    <section className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Observaciones</h2>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <textarea
        rows={3}
        disabled={!editable}
        value={valor}
        onChange={(event) => setValor(event.target.value)}
        onBlur={handleBlur}
        placeholder="Notas del turno (diferencias explicadas, incidentes, etc.)"
        className="w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none disabled:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400 dark:disabled:text-slate-500"
      />

      {requerirMotivo && (
        <button
          type="button"
          onClick={() => setModalMotivoAbierto(true)}
          disabled={guardando}
          className="mt-3 rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          Guardar cambios (requiere motivo)
        </button>
      )}

      {guardando && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Guardando...</p>}

      <ModalMotivo
        open={modalMotivoAbierto}
        onClose={() => setModalMotivoAbierto(false)}
        title="Editar observaciones"
        mensaje="Este cierre ya no está abierto. Indica el motivo de la corrección."
        onConfirmar={(motivo) => guardar(motivo)}
      />
    </section>
  );
}
