import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../../components/Modal';
import ModalConfirmarPassword from '../../components/common/ModalConfirmarPassword';
import ChecklistEmpleados from '../../components/planillas/ChecklistEmpleados';
import EmpleadoPlanillaCard from '../../components/planillas/EmpleadoPlanillaCard';
import { IconCandado, IconDesbloquear, IconEliminar, IconUsuarios } from '../../components/icons';
import { formatearMoneda, NOMBRES_MESES } from '../../utils/moneda';

function ModalEditarEmpleados({ open, onClose, planilla, onActualizada }) {
  const [empleados, setEmpleados] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setError('');
    setSeleccionados(new Set(planilla.detalles.map((detalle) => detalle.empleado_id)));

    api
      .get('/empleados')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setEmpleados([]));
  }, [open, planilla]);

  function toggle(id) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (seleccionados.size === 0) {
      setError('La planilla debe tener al menos un empleado.');
      return;
    }

    setSubmitting(true);

    try {
      await api.patch(`/planillas/${planilla.id}`, { empleado_ids: [...seleccionados] });
      onActualizada();
      onClose();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar empleados de la planilla" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}

        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Al quitar un empleado se revierten sus deducciones automáticas (vales, cobros, llegadas tarde y abono de
          préstamo). No se puede quitar a alguien que ya tiene pagos registrados contra esta planilla.
        </p>

        <div className="mb-4">
          <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Empleados incluidos ({seleccionados.size} seleccionados)
          </p>
          <ChecklistEmpleados empleados={empleados} seleccionados={seleccionados} onToggle={toggle} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border-[0.5px] border-[var(--border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function PlanillaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planilla, setPlanilla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalEmpleados, setModalEmpleados] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalReabrir, setModalReabrir] = useState(false);

  function cargar() {
    setError('');

    api
      .get(`/planillas/${id}`)
      .then(({ data }) => setPlanilla(data))
      .catch(() => setError('No se pudo cargar la planilla.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    cargar();
  }, [id]);

  // El backend no re-carga la relación "empleado" al guardar un campo;
  // se hace merge para no perderla (compras_tienda/prestamo_abonos sí vienen frescos).
  function handleActualizado(detalleNuevo) {
    setPlanilla((prev) => ({
      ...prev,
      detalles: prev.detalles.map((detalle) =>
        detalle.id === detalleNuevo.id ? { ...detalle, ...detalleNuevo } : detalle
      ),
    }));
  }

  async function confirmarCerrar(password) {
    const { data } = await api.post(`/planillas/${id}/cerrar`, { password });
    setPlanilla((prev) => ({ ...prev, estado: data.estado, cerrada_en: data.cerrada_en }));
  }

  async function confirmarEliminar(password) {
    await api.delete(`/planillas/${id}`, { data: { password } });
    navigate('/planillas', { replace: true });
  }

  async function confirmarReabrir(password, motivo) {
    const { data } = await api.post(`/planillas/${id}/reabrir`, { password, motivo });
    setPlanilla((prev) => ({ ...prev, estado: data.estado, cerrada_en: data.cerrada_en }));
  }

  if (loading) {
    return <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  if (error && !planilla) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!planilla) return null;

  const editable = planilla.estado === 'borrador';
  const sinPagos = planilla.detalles.every((detalle) => detalle.estado_pago === 'pendiente');
  const puedeReabrir = planilla.estado === 'cerrada' && sinPagos;
  const totalGeneral = planilla.detalles.reduce((acumulado, detalle) => acumulado + Number(detalle.total_a_pagar), 0);
  const totalDeducciones = planilla.detalles.reduce(
    (acumulado, detalle) => acumulado + Number(detalle.total_deducciones),
    0
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="sticky top-0 z-10 -mx-1 mb-4 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Planilla {NOMBRES_MESES[planilla.mes]} {planilla.anio} — Quincena {planilla.quincena}
              </h1>
              <span
                className={
                  editable
                    ? 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium capitalize text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }
              >
                {planilla.estado}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {planilla.detalles.length} empleados · Deducciones: {formatearMoneda(totalDeducciones)} · Total a pagar:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatearMoneda(totalGeneral)}</span>
            </p>
          </div>

          {editable && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalEmpleados(true)}
                className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <IconUsuarios className="h-4 w-4" />
                Editar empleados
              </button>
              <button
                type="button"
                onClick={() => setModalCerrar(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                <IconCandado className="h-4 w-4" />
                Cerrar planilla
              </button>
              <button
                type="button"
                onClick={() => setModalEliminar(true)}
                aria-label="Eliminar planilla"
                className="rounded-lg border-[0.5px] border-[var(--border)] p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <IconEliminar className="h-4 w-4" />
              </button>
            </div>
          )}

          {puedeReabrir && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalReabrir(true)}
                className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <IconDesbloquear className="h-4 w-4" />
                Reabrir
              </button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-3.5">
        {planilla.detalles.map((detalle) => (
          <EmpleadoPlanillaCard
            key={detalle.id}
            planilla={planilla}
            detalle={detalle}
            editable={editable}
            onActualizado={handleActualizado}
          />
        ))}
      </div>

      <ModalEditarEmpleados
        open={modalEmpleados}
        onClose={() => setModalEmpleados(false)}
        planilla={planilla}
        onActualizada={cargar}
      />

      <ModalConfirmarPassword
        open={modalCerrar}
        onClose={() => setModalCerrar(false)}
        title="Cerrar planilla"
        mensaje="Al cerrar la planilla ya no se podrán editar días, horas extra, bonificaciones ni cobros adicionales. Confirma con tu contraseña de administrador."
        confirmLabel="Cerrar planilla"
        onConfirmar={confirmarCerrar}
      />

      <ModalConfirmarPassword
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="Eliminar planilla"
        mensaje="Se eliminará la planilla completa y se revertirán todas las deducciones automáticas aplicadas (vales, cobros adicionales, llegadas tarde y abonos de préstamo). Esta acción no se puede deshacer."
        confirmLabel="Eliminar planilla"
        peligro
        onConfirmar={confirmarEliminar}
      />

      <ModalConfirmarPassword
        open={modalReabrir}
        onClose={() => setModalReabrir(false)}
        title="Reabrir planilla"
        mensaje="La planilla volverá a estado borrador y podrá editarse o eliminarse de nuevo. Indica el motivo para dejar rastro en el historial."
        confirmLabel="Reabrir planilla"
        requiereMotivo
        motivoLabel="Motivo de la reapertura"
        onConfirmar={confirmarReabrir}
      />
    </div>
  );
}
