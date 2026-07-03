const CLASES_BASE =
  'w-full rounded border border-slate-300 bg-white text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400';

export default function NumberInput({ className = '', ...props }) {
  return (
    <input
      type="number"
      onWheel={(event) => event.target.blur()}
      className={`${CLASES_BASE} ${className}`.trim()}
      {...props}
    />
  );
}
