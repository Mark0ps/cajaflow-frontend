import { useState } from 'react';
import Modal from '../Modal';
import { extraerMensajeError } from '../../api/errores';

/**
 * Pide un motivo obligatorio antes de confirmar una acción — se usa cuando
 * Admin edita/elimina algo de un cierre de caja que ya no está abierto
 * (CierreCajaService lo exige y lo guarda en `historial`).
 */
export default function ModalMotivo({ open, onClose, title = 'Motivo del cambio', mensaje, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  function cerrar() {
    if (procesando) return;
    setMotivo('');
    setError('');
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (motivo.trim() === '') {
      setError('El motivo es obligatorio.');
      return;
    }

    setError('');
    setProcesando(true);

    try {
      await onConfirmar(motivo.trim());
      setMotivo('');
      onClose();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal open={open} onClose={cerrar} title={title}>
      <form onSubmit={handleSubmit}>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          {mensaje ?? 'Este cierre ya no está abierto. Indica el motivo de la corrección para dejar rastro en el historial.'}
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}

        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="motivo_cambio">
          Motivo
        </label>
        <textarea
          id="motivo_cambio"
          rows={3}
          autoFocus
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          className="mb-4 w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400"
        />

        <button
          type="submit"
          disabled={procesando || motivo.trim() === ''}
          className="mb-2 w-full rounded-lg bg-slate-800 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {procesando ? 'Guardando...' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={cerrar}
          disabled={procesando}
          className="w-full rounded-lg border-[0.5px] border-[var(--border)] py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </form>
    </Modal>
  );
}
