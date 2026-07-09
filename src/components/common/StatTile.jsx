// `compacto`: versión reducida para cuando van 4 tiles en una sola fila
// dentro de un modal (ej. detalle del día del Dashboard).
export default function StatTile({ label, valor, detalle, className = '', compacto = false }) {
  return (
    <div className={`rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] ${compacto ? 'p-2.5' : 'p-4'}`}>
      <p className={`font-medium text-slate-500 dark:text-slate-400 ${compacto ? 'text-[11px]' : 'text-xs'}`}>{label}</p>
      <p className={`mt-1 font-bold text-slate-800 dark:text-slate-100 ${compacto ? 'text-sm' : 'text-xl'} ${className}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{detalle}</p>}
    </div>
  );
}
