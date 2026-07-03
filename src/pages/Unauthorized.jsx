import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-800">No autorizado</h1>
      <p className="text-sm text-slate-500">Tu usuario no tiene permiso para ver esta página.</p>
      <Link to="/" className="text-sm font-medium text-slate-700 underline">
        Volver al inicio
      </Link>
    </div>
  );
}
