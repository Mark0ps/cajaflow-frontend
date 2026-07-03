export default function ChecklistEmpleados({ empleados, seleccionados, onToggle }) {
  if (empleados.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">No hay empleados activos.</p>;
  }

  return (
    <ul className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-2 sm:grid-cols-2">
      {empleados.map((empleado) => (
        <li key={empleado.id}>
          <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={seleccionados.has(empleado.id)}
              onChange={() => onToggle(empleado.id)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
            />
            <span className="truncate">
              {empleado.nombre} {empleado.apellido}
              <span className="ml-1 text-xs capitalize text-slate-400 dark:text-slate-500">
                ({empleado.cargo?.replaceAll('_', ' ')})
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
