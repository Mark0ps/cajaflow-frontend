import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import FormEmpleado, { CARGOS } from '../../components/empleados/FormEmpleado';
import { IconEditar, IconFiltro } from '../../components/icons';
import { formatearMoneda } from '../../utils/moneda';
import { SkeletonListado } from '../../components/common/Skeleton';

const CAMPO_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

function iniciales(nombre, apellido) {
  return `${nombre?.charAt(0) ?? ''}${apellido?.charAt(0) ?? ''}`.toUpperCase();
}

function EmpleadoCard({ empleado, onEditar, onNavegar }) {
  const activo = empleado.activo;

  return (
    <div
      onClick={() => onNavegar(empleado.id)}
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-[0.5px] border-[var(--border)] px-4 py-3 transition ${
        activo ? 'bg-[var(--surface-2)] hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'bg-[var(--surface-1)] opacity-60'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-accent)] text-xs font-bold text-white">
          {iniciales(empleado.nombre, empleado.apellido)}
        </div>
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-medium ${
              activo ? 'text-slate-700 dark:text-slate-200' : 'text-[var(--text-muted)]'
            }`}
          >
            {empleado.nombre} {empleado.apellido}
          </p>
          <p className={`truncate text-xs capitalize ${activo ? 'text-slate-500 dark:text-slate-400' : 'text-[var(--text-muted)]'}`}>
            {empleado.cargo?.replaceAll('_', ' ')} · {formatearMoneda(empleado.sueldo_quincenal)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
          onClick={(event) => {
            event.stopPropagation();
            onEditar(empleado);
          }}
          aria-label="Editar empleado"
          className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <IconEditar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function EmpleadosListado() {
  const navigate = useNavigate();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [empleadoEditar, setEmpleadoEditar] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  function cargar() {
    setLoading(true);
    api
      .get('/empleados?todos=1')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setError('No se pudieron cargar los empleados.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, []);

  function handleCreado() {
    setModalCrear(false);
    cargar();
  }

  function handleEditado() {
    setEmpleadoEditar(null);
    cargar();
  }

  async function abrirEdicion(empleado) {
    // El listado (`todos=1`) solo trae campos mínimos para la card — se
    // recarga la ficha completa antes de editar para no pisar
    // telefono/direccion/fecha_ingreso con valores vacíos al guardar.
    try {
      const { data } = await api.get(`/empleados/${empleado.id}`);
      setEmpleadoEditar(data);
    } catch (err) {
      setError('No se pudo cargar el empleado para editar.');
    }
  }

  const filtrosActivos = (filtroCargo ? 1 : 0) + (filtroEstado ? 1 : 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return empleados.filter((empleado) => {
      const coincideBusqueda =
        !q ||
        `${empleado.nombre} ${empleado.apellido}`.toLowerCase().includes(q) ||
        empleado.identidad?.toLowerCase().includes(q) ||
        empleado.cargo?.replaceAll('_', ' ').toLowerCase().includes(q);
      const coincideCargo = !filtroCargo || empleado.cargo === filtroCargo;

      return coincideBusqueda && coincideCargo;
    });
  }, [empleados, busqueda, filtroCargo]);

  const activos = filtroEstado === 'inactivo' ? [] : filtrados.filter((empleado) => empleado.activo);
  const inactivos = filtroEstado === 'activo' ? [] : filtrados.filter((empleado) => !empleado.activo);

  function limpiarFiltros() {
    setFiltroCargo('');
    setFiltroEstado('');
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Empleados</h1>
        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Nuevo empleado
        </button>
      </div>

      <div className="mb-4 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre, identidad o cargo..."
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
              value={filtroCargo}
              onChange={(event) => setFiltroCargo(event.target.value)}
              className={`max-w-48 ${CAMPO_CLASES}`}
            >
              <option value="">Todos los cargos</option>
              {CARGOS.map((valor) => (
                <option key={valor} value={valor} className="capitalize">
                  {valor.replaceAll('_', ' ')}
                </option>
              ))}
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

      {loading ? (
        <SkeletonListado />
      ) : error ? (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : activos.length === 0 && inactivos.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay empleados que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {activos.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Activos ({activos.length})
              </h2>
              <div className="flex flex-col gap-2">
                {activos.map((empleado) => (
                  <EmpleadoCard
                    key={empleado.id}
                    empleado={empleado}
                    onEditar={abrirEdicion}
                    onNavegar={(id) => navigate(`/empleados/${id}`)}
                  />
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
                {inactivos.map((empleado) => (
                  <EmpleadoCard
                    key={empleado.id}
                    empleado={empleado}
                    onEditar={abrirEdicion}
                    onNavegar={(id) => navigate(`/empleados/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo empleado" maxWidth="max-w-xl">
        <FormEmpleado onGuardado={handleCreado} onCancelar={() => setModalCrear(false)} />
      </Modal>

      <Modal open={Boolean(empleadoEditar)} onClose={() => setEmpleadoEditar(null)} title="Editar empleado" maxWidth="max-w-xl">
        {empleadoEditar && (
          <FormEmpleado empleado={empleadoEditar} onGuardado={handleEditado} onCancelar={() => setEmpleadoEditar(null)} />
        )}
      </Modal>
    </div>
  );
}
