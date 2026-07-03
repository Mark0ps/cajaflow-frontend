import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layout minimal: el cajero solo ve su propio cierre de caja activo.
export default function CajeroLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-900">
        <span className="font-semibold text-slate-800 dark:text-slate-100">CajaFlow</span>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">{user?.name}</span>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
