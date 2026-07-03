export default function Proximamente({ titulo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{titulo}</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Próximamente</p>
    </div>
  );
}
