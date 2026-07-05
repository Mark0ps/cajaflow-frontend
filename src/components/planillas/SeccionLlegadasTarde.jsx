import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';
import NumberInput from '../common/NumberInput';
import { IconEditar, IconEliminar, IconChevronDown } from '../icons';
import { formatearMoneda, fechaLocalHoy } from '../../utils/moneda';

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function formatearDuracion(minutosTotal) {
  const minutos = Number(minutosTotal) || 0;
  const horas = Math.floor(minutos / 60);
  const restoMinutos = minutos % 60;

  if (horas > 0 && restoMinutos > 0) return `${horas}h ${restoMinutos}min`;
  if (horas > 0) return `${horas}h`;
  return `${restoMinutos}min`;
}

function FormLlegada({ planillaId, detalleId, sueldoDiario, llegada, onGuardado, onCancelar }) {
  const editando = Boolean(llegada);
  const minutosIniciales = llegada ? Number(llegada.minutos_tarde) : 0;
  const [fecha, setFecha] = useState(llegada?.fecha ? String(llegada.fecha).slice(0, 10) : fechaLocalHoy());
  const [horasTarde, setHorasTarde] = useState(llegada ? String(Math.floor(minutosIniciales / 60)) : '');
  const [minutosTarde, setMinutosTarde] = useState(llegada ? String(minutosIniciales % 60) : '');
  const [valorDeduccion, setValorDeduccion] = useState(llegada ? String(llegada.valor_deduccion) : '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tarifaHora = Number(sueldoDiario) / 8;

  function recalcularSugerido(horasCrudas, minutosCrudos) {
    const horas = Number(horasCrudas) || 0;
    const minutos = Number(minutosCrudos) || 0;
    setValorDeduccion(String(redondear((horas + minutos / 60) * tarifaHora)));
  }

  function handleHorasChange(event) {
    const valor = event.target.value;
    setHorasTarde(valor);
    recalcularSugerido(valor, minutosTarde);
  }

  function handleMinutosChange(event) {
    const valor = event.target.value;
    setMinutosTarde(valor);
    recalcularSugerido(horasTarde, valor);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const minutosTotal = (Number(horasTarde) || 0) * 60 + (Number(minutosTarde) || 0);
    if (minutosTotal <= 0) {
      setError('Debe indicar horas y/o minutos tarde, mayor a cero.');
      return;
    }

    setSubmitting(true);

    const payload = {
      fecha,
      minutos_tarde: minutosTotal,
      valor_deduccion: valorDeduccion,
    };

    try {
      const { data } = editando
        ? await api.patch(`/planillas/${planillaId}/detalles/${detalleId}/llegadas-tarde/${llegada.id}`, payload)
        : await api.post(`/planillas/${planillaId}/detalles/${detalleId}/llegadas-tarde`, payload);
      onGuardado(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="fecha_llegada">
            Fecha
          </label>
          <input
            id="fecha_llegada"
            type="date"
            required
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="horas_llegada">
            Horas tarde
          </label>
          <NumberInput
            id="horas_llegada"
            min="0"
            step="1"
            value={horasTarde}
            onChange={handleHorasChange}
            className="px-2 py-1.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="minutos_llegada">
            Minutos tarde
          </label>
          <NumberInput
            id="minutos_llegada"
            min="0"
            max="59"
            step="1"
            value={minutosTarde}
            onChange={handleMinutosChange}
            className="px-2 py-1.5"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="valor_llegada">
            Valor a deducir
          </label>
          <NumberInput
            id="valor_llegada"
            min="0"
            step="0.01"
            required
            value={valorDeduccion}
            onChange={(event) => setValorDeduccion(event.target.value)}
            className="px-2 py-1.5"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Sugerido según sueldo diario: {formatearMoneda(redondear(((Number(horasTarde) || 0) + (Number(minutosTarde) || 0) / 60) * tarifaHora))}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={submitting}
          className="rounded-lg border-[0.5px] border-[var(--border)] px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * Widget colapsable de CRUD contra llegadas_tarde, mismo patrón que
 * SeccionComprasTienda. Sin tipo/motivo: solo registra el hecho (fecha,
 * horas+minutos tarde, monto a deducir), sin justificación obligatoria.
 * El formulario captura horas y minutos por separado (más fácil de teclear
 * que un solo campo de minutos) y los combina a minutos_tarde antes de
 * enviar al backend, que sigue guardando un único campo sin cambios de
 * esquema. El valor a deducir se sugiere como
 * (horas + minutos/60) × (sueldo_diario / 8) —sin multiplicador, a
 * diferencia de horas extra— pero el campo queda editable directo.
 */
export default function SeccionLlegadasTarde({ planillaId, detalle, editable, onDetalleActualizado }) {
  const [abierto, setAbierto] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState('');

  const llegadas = detalle.llegadas_tarde ?? [];

  function abrirNuevo() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(llegada) {
    setEditando(llegada);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
  }

  function handleGuardado({ detalle: detalleNuevo }) {
    onDetalleActualizado(detalleNuevo);
    cerrarModal();
  }

  async function handleEliminar(llegada) {
    if (!window.confirm('¿Eliminar esta llegada tarde? Esta acción no se puede deshacer.')) {
      return;
    }

    setError('');
    setEliminandoId(llegada.id);

    try {
      const { data } = await api.delete(`/planillas/${planillaId}/detalles/${detalle.id}/llegadas-tarde/${llegada.id}`);
      onDetalleActualizado(data.detalle);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setEliminandoId(null);
    }
  }

  const total = llegadas.reduce((acumulado, llegada) => acumulado + Number(llegada.valor_deduccion), 0);

  return (
    <div className="mt-3 border-t-[0.5px] border-[var(--border)] pt-3">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        <span>Llegadas tarde {llegadas.length > 0 && `(${llegadas.length})`}</span>
        <span className="flex items-center gap-2">
          {llegadas.length > 0 && (
            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatearMoneda(total)}</span>
          )}
          <IconChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {abierto && (
        <div className="mt-2">
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
          )}

          {llegadas.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Sin llegadas tarde registradas.</p>
          ) : (
            <ul className="divide-y-[0.5px] divide-[var(--border)]">
              {llegadas.map((llegada) => (
                <li key={llegada.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate text-slate-600 dark:text-slate-300">{formatearDuracion(llegada.minutos_tarde)} tarde</p>
                    <p className="text-slate-400 dark:text-slate-500">{String(llegada.fecha).slice(0, 10)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatearMoneda(llegada.valor_deduccion)}
                    </span>

                    {editable && (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirEditar(llegada)}
                          aria-label="Editar"
                          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <IconEditar className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(llegada)}
                          disabled={eliminandoId === llegada.id}
                          aria-label="Eliminar"
                          className="rounded-md p-1 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
                        >
                          <IconEliminar className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {editable && (
            <button
              type="button"
              onClick={abrirNuevo}
              className="mt-2 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              + Agregar
            </button>
          )}
        </div>
      )}

      <Modal open={modalAbierto} onClose={cerrarModal} title={editando ? 'Editar llegada tarde' : 'Agregar llegada tarde'}>
        <FormLlegada
          planillaId={planillaId}
          detalleId={detalle.id}
          sueldoDiario={detalle.sueldo_diario}
          llegada={editando}
          onGuardado={handleGuardado}
          onCancelar={cerrarModal}
        />
      </Modal>
    </div>
  );
}
