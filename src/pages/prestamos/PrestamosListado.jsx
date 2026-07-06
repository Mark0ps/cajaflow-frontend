import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import StatTile from '../../components/common/StatTile';
import FormPrestamo from '../../components/empleados/FormPrestamo';
import { formatearMoneda } from '../../utils/moneda';

const ESTADO_PRESTAMO_ESTILOS = {
  activo: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  pagado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

const SELECT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

function ModalNuevoPrestamo({ open, onClose, empleados, onGuardado }) {
  const [empleadoId, setEmpleadoId] = useState('');

  useEffect(() => {
    if (open) setEmpleadoId('');
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Nuevo préstamo" maxWidth="max-w-lg">
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="empleado_nuevo_prestamo">
          Empleado
        </label>
        <select
          id="empleado_nuevo_prestamo"
          value={empleadoId}
          onChange={(event) => setEmpleadoId(event.target.value)}
          className={SELECT_CLASES}
        >
          <option value="">Selecciona un empleado...</option>
          {empleados.map((empleado) => (
            <option key={empleado.id} value={empleado.id}>
              {empleado.nombre} {empleado.apellido}
            </option>
          ))}
        </select>
      </div>

      {empleadoId && <FormPrestamo empleadoId={Number(empleadoId)} onGuardado={onGuardado} onCancelar={onClose} />}
    </Modal>
  );
}

export default function PrestamosListado() {
  const [prestamos, setPrestamos] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);

  function cargar() {
    setLoading(true);
    setError('');

    const params = {};
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroEmpleado) params.empleado_id = filtroEmpleado;

    api
      .get('/prestamos', { params })
      .then(({ data }) => {
        setPrestamos(data.data ?? []);
        setKpis(data.kpis ?? null);
      })
      .catch(() => setError('No se pudieron cargar los préstamos.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [filtroEstado, filtroEmpleado]);

  useEffect(() => {
    api
      .get('/empleados')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setEmpleados([]));
  }, []);

  function handleGuardado() {
    setModalNuevo(false);
    cargar();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Préstamos</h1>
        <button
          type="button"
          onClick={() => setModalNuevo(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Nuevo préstamo
        </button>
      </div>

      {kpis && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total prestado activo" valor={formatearMoneda(kpis.total_prestado_activo)} />
          <StatTile label="Pendiente de cobro" valor={formatearMoneda(kpis.total_pendiente_cobro)} />
          <StatTile label="Préstamos activos" valor={kpis.cantidad_activos} />
          <StatTile label="Pagados / liquidados" valor={kpis.cantidad_pagados} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={filtroEstado}
          onChange={(event) => setFiltroEstado(event.target.value)}
          className={`max-w-40 ${SELECT_CLASES}`}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="pagado">Pagado</option>
        </select>

        <select
          value={filtroEmpleado}
          onChange={(event) => setFiltroEmpleado(event.target.value)}
          className={`max-w-60 ${SELECT_CLASES}`}
        >
          <option value="">Todos los empleados</option>
          {empleados.map((empleado) => (
            <option key={empleado.id} value={empleado.id}>
              {empleado.nombre} {empleado.apellido}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)]">
        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : prestamos.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 dark:text-slate-500">No hay préstamos que coincidan con los filtros.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-[0.5px] border-[var(--border)] text-xs text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2 font-medium">Empleado</th>
                <th className="px-4 py-2 font-medium">Monto original</th>
                <th className="px-4 py-2 font-medium">Saldo</th>
                <th className="px-4 py-2 font-medium">Cuota</th>
                <th className="px-4 py-2 font-medium">Método</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Fecha otorgado</th>
              </tr>
            </thead>
            <tbody className="divide-y-[0.5px] divide-[var(--border)]">
              {prestamos.map((prestamo) => (
                <tr key={prestamo.id}>
                  <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200">
                    {prestamo.empleado?.nombre} {prestamo.empleado?.apellido}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatearMoneda(prestamo.monto_original)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatearMoneda(prestamo.saldo_pendiente)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatearMoneda(prestamo.monto_cuota)}</td>
                  <td className="px-4 py-2 capitalize text-slate-600 dark:text-slate-300">{prestamo.metodo_cobro}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ESTADO_PRESTAMO_ESTILOS[prestamo.estado] ?? ''}`}
                    >
                      {prestamo.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                    {String(prestamo.fecha_otorgado).slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ModalNuevoPrestamo
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        empleados={empleados}
        onGuardado={handleGuardado}
      />
    </div>
  );
}
