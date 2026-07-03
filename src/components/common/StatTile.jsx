export default function StatTile({ label, valor, detalle, className = '' }) {
  return (
    <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold text-slate-800 dark:text-slate-100 ${className}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{detalle}</p>}
    </div>
  );
}
