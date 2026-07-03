import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconCaja } from '../components/icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(usuario, password);
      const destino = location.state?.from ?? (user.role === 'cajero' ? '/mi-caja' : '/dashboard');
      navigate(destino, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('No se pudo conectar al servidor. Verifica tu conexión.');
      } else if (err.response.status === 429) {
        setError('Demasiados intentos. Espera un minuto e intenta de nuevo.');
      } else if (err.response.status === 422) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-1)] px-4">
      <div className="w-full max-w-[360px] rounded-xl border-solid border-[length:0.5px] border-[color:var(--border)] bg-[var(--surface-2)] p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-accent)]">
            <IconCaja className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">CajaFlow</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Inversiones PG Store</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          {error && (
            <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </p>
          )}

          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="usuario">
            Usuario
          </label>
          <input
            id="usuario"
            type="text"
            autoComplete="username"
            required
            value={usuario}
            onChange={(event) => setUsuario(event.target.value)}
            className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
          />

          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mb-6 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-slate-800 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Sistema interno de caja y planillas
        </p>
      </div>
    </div>
  );
}
