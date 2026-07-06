import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';

const INPUT_CLASES =
  'w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400';

function generarPasswordTemporal() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let resultado = '';
  for (let i = 0; i < 10; i++) {
    resultado += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return resultado;
}

export default function ModalResetPassword({ open, onClose, usuario }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword(generarPasswordTemporal());
    setError('');
    setExito(false);
  }, [open]);

  if (!usuario) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post(`/usuarios/${usuario.id}/reset-password`, { password });
      setExito(true);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Restablecer contraseña — ${usuario.username}`} maxWidth="max-w-sm">
      {exito ? (
        <div>
          <p className="mb-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Contraseña restablecida. Comunícale al usuario la nueva contraseña:
          </p>
          <p className="mb-4 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-center font-mono text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            {password}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="password_reset">
              Nueva contraseña
            </label>
            <div className="flex gap-2">
              <input
                id="password_reset"
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT_CLASES}
              />
              <button
                type="button"
                onClick={() => setPassword(generarPasswordTemporal())}
                className="whitespace-nowrap rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Generar otra
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {submitting ? 'Guardando...' : 'Restablecer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
