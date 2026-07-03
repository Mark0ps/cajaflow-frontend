import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';

/**
 * Confirmación de acciones sensibles (cerrar/eliminar planilla, etc.), mismo
 * patrón que AutoSys: primero valida la contraseña contra /verificar-admin
 * para dar feedback inmediato, y solo si es correcta ejecuta `onConfirmar`
 * (que dispara la acción real, la cual también revalida la contraseña en el
 * backend).
 */
export default function ModalConfirmarPassword({ open, onClose, title, mensaje, confirmLabel = 'Confirmar', peligro = false, onConfirmar }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  function cerrar() {
    if (procesando) return;
    setPassword('');
    setError('');
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setProcesando(true);

    try {
      await api.post('/verificar-admin', { password });
    } catch (err) {
      setError(extraerMensajeError(err));
      setProcesando(false);
      return;
    }

    try {
      await onConfirmar(password);
      setPassword('');
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
        {mensaje && <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{mensaje}</p>}

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}

        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="password_confirmacion">
          Contraseña de administrador
        </label>
        <input
          id="password_confirmacion"
          type="password"
          autoFocus
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-4 w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={procesando || password.trim() === ''}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-50 ${
              peligro
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
            }`}
          >
            {procesando ? 'Verificando...' : confirmLabel}
          </button>
          <button
            type="button"
            onClick={cerrar}
            disabled={procesando}
            className="rounded-lg border-[0.5px] border-[var(--border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
