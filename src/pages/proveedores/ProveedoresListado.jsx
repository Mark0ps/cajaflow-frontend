import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../../components/Modal';
import FormProveedor from '../../components/proveedores/FormProveedor';
import { IconEditar, IconEliminar, IconFiltro } from '../../components/icons';

const CAMPO_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

function ProveedorCard({ proveedor, onEditar, onEliminar }) {
  const activo = proveedor.activo;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border-[0.5px] border-[var(--border)] px-4 py-3 ${
        activo ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface-1)] opacity-60'
      }`}
    >
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${activo ? 'text-slate-700 dark:text-slate-200' : 'text-[var(--text-muted)]'}`}>
          {proveedor.nombre}
        </p>
        <p className={`truncate text-xs ${activo ? 'text-slate-500 dark:text-slate-400' : 'text-[var(--text-muted)]'}`}>
          {[proveedor.contacto_nombre, proveedor.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            proveedor.factura_nominal
              ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {proveedor.factura_nominal ? 'Con factura' : 'Sin factura'}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            activo
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {activo ? 'Activo' : 'Inactivo'}
        </span>
        <button
          type="button"
          onClick={() => onEditar(proveedor)}
          aria-label="Editar proveedor"
          className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <IconEditar className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEliminar(proveedor)}
          aria-label="Eliminar proveedor"
          className="rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          <IconEliminar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function ProveedoresListado() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtroFactura, setFiltroFactura] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  function cargar() {
    setLoading(true);
    api
      .get('/proveedores?todos=1')
      .then(({ data }) => setProveedores(data))
      .catch(() => setError('No se pudieron cargar los proveedores.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  function handleCreado() {
    setModalCrear(false);
    cargar();
  }

  function handleEditado() {
    setProveedorEditar(null);
    cargar();
  }

  async function eliminar(proveedor) {
    if (!window.confirm(`¿Eliminar a ${proveedor.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/proveedores/${proveedor.id}`);
      cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  const filtrosActivos = (filtroFactura ? 1 : 0) + (filtroEstado ? 1 : 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return proveedores.filter((proveedor) => {
      const coincideBusqueda =
        !q ||
        proveedor.nombre?.toLowerCase().includes(q) ||
        proveedor.contacto_nombre?.toLowerCase().includes(q) ||
        proveedor.telefono?.toLowerCase().includes(q) ||
        proveedor.descripcion?.toLowerCase().includes(q);
      const coincideFactura =
        !filtroFactura || (filtroFactura === 'con' ? proveedor.factura_nominal : !proveedor.factura_nominal);

      return coincideBusqueda && coincideFactura;
    });
  }, [proveedores, busqueda, filtroFactura]);

  const activos = filtroEstado === 'inactivo' ? [] : filtrados.filter((proveedor) => proveedor.activo);
  const inactivos = filtroEstado === 'activo' ? [] : filtrados.filter((proveedor) => !proveedor.activo);

  function limpiarFiltros() {
    setFiltroFactura('');
    setFiltroEstado('');
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Proveedores</h1>
        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Nuevo proveedor
        </button>
      </div>

      <div className="mb-4 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre, contacto o teléfono..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className={CAMPO_CLASES}
          />
          <button
            type="button"
            onClick={() => setFiltrosAbiertos((prev) => !prev)}
            className={`flex shrink-0 items-center gap-2 rounded-lg border-[0.5px] px-3 py-1.5 text-sm font-medium transition ${
              filtrosAbiertos
                ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-600 dark:bg-slate-700'
                : 'border-[var(--border)] text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <IconFiltro className="h-4 w-4" />
            Filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ''}
          </button>
        </div>

        {filtrosAbiertos && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t-[0.5px] border-[var(--border)] pt-3">
            <select
              value={filtroFactura}
              onChange={(event) => setFiltroFactura(event.target.value)}
              className={`max-w-48 ${CAMPO_CLASES}`}
            >
              <option value="">Con y sin factura</option>
              <option value="con">Con factura nominal</option>
              <option value="sin">Sin factura nominal</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
              className={`max-w-40 ${CAMPO_CLASES}`}
            >
              <option value="">Activos e inactivos</option>
              <option value="activo">Solo activos</option>
              <option value="inactivo">Solo inactivos</option>
            </select>

            {filtrosActivos > 0 && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {loading ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : activos.length === 0 && inactivos.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay proveedores que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {activos.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Activos ({activos.length})
              </h2>
              <div className="flex flex-col gap-2">
                {activos.map((proveedor) => (
                  <ProveedorCard key={proveedor.id} proveedor={proveedor} onEditar={setProveedorEditar} onEliminar={eliminar} />
                ))}
              </div>
            </div>
          )}

          {inactivos.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Inactivos ({inactivos.length})
              </h2>
              <div className="flex flex-col gap-2">
                {inactivos.map((proveedor) => (
                  <ProveedorCard key={proveedor.id} proveedor={proveedor} onEditar={setProveedorEditar} onEliminar={eliminar} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo proveedor" maxWidth="max-w-xl">
        <FormProveedor onGuardado={handleCreado} onCancelar={() => setModalCrear(false)} />
      </Modal>

      <Modal open={Boolean(proveedorEditar)} onClose={() => setProveedorEditar(null)} title="Editar proveedor" maxWidth="max-w-xl">
        {proveedorEditar && (
          <FormProveedor proveedor={proveedorEditar} onGuardado={handleEditado} onCancelar={() => setProveedorEditar(null)} />
        )}
      </Modal>
    </div>
  );
}
