// Bloques de carga (skeletons) reutilizables — reemplazan los textos
// "Cargando...". Mismo patrón que AutoSys, adaptado a los tokens de
// superficie/borde de CajaFlow (claro + oscuro automático).

const CARD_CLASES = 'rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)]';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700/60 ${className}`} />;
}

/** Líneas de texto sueltas — para tabs/secciones pequeñas dentro de una card. */
export function SkeletonLineas({ lineas = 3 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lineas }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-2/3'}`} />
      ))}
    </div>
  );
}

/** Filas tipo card de listado (Caja diaria, Empleados, Proveedores, Gastos externos). */
export function SkeletonListado({ filas = 6 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className={`flex items-center justify-between gap-3 px-4 py-3 ${CARD_CLASES}`}>
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Grid de cards (Planillas, detalle de planilla). */
export function SkeletonCardGrid({ cantidad = 4 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] gap-3.5">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className={`space-y-3 p-4 ${CARD_CLASES}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Tabla (Usuarios, Facturas pendientes). */
export function SkeletonTabla({ filas = 5 }) {
  return (
    <div className={`overflow-hidden ${CARD_CLASES}`}>
      <div className="h-10 bg-slate-100 dark:bg-slate-800" />
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {Array.from({ length: filas }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 flex-1 md:block" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Fila de KPIs (Dashboard, Reportes, Préstamos). */
export function SkeletonKpis({ cantidad = 4, columnas = 'grid-cols-2 lg:grid-cols-4' }) {
  return (
    <div className={`grid gap-3 ${columnas}`}>
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className={`space-y-2 p-4 ${CARD_CLASES}`}>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Página de detalle (header con acciones + bloques de contenido). */
export function SkeletonDetalle() {
  return (
    <div className="space-y-4">
      <div className={`space-y-3 p-4 ${CARD_CLASES}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
      <div className={`space-y-3 p-4 ${CARD_CLASES}`}>
        <Skeleton className="h-4 w-1/4" />
        <SkeletonLineas lineas={3} />
      </div>
      <div className={`space-y-3 p-4 ${CARD_CLASES}`}>
        <Skeleton className="h-4 w-1/3" />
        <SkeletonLineas lineas={2} />
      </div>
    </div>
  );
}

/** Calendario del Dashboard (va dentro de la card que ya lo envuelve). */
export function SkeletonCalendario() {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>
      {Array.from({ length: 5 }, (_, fila) => (
        <div key={fila} className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
