import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';
import NumberInput from '../common/NumberInput';
import { IconEditar, IconEliminar, IconChevronDown } from '../icons';
import { formatearMoneda, fechaLocalHoy } from '../../utils/moneda';

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

function FormCompra({ planillaId, detalleId, tipo, requiereMotivo, compra, onGuardado, onCancelar }) {
  const editando = Boolean(compra);
  const [fecha, setFecha] = useState(compra?.fecha ? String(compra.fecha).slice(0, 10) : fechaLocalHoy());
  const [descripcion, setDescripcion] = useState(compra?.descripcion ?? '');
  const [valor, setValor] = useState(compra ? String(compra.valor) : '');
  const [motivo, setMotivo] = useState(compra?.motivo ?? '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (requiereMotivo && !motivo.trim()) {
      setError('El motivo es obligatorio para un cobro adicional.');
      return;
    }

    setSubmitting(true);

    const payload = {
      tipo,
      fecha,
      descripcion: descripcion.trim() || null,
      motivo: requiereMotivo ? motivo.trim() : null,
      valor,
    };

    try {
      const { data } = editando
        ? await api.patch(`/planillas/${planillaId}/detalles/${detalleId}/compras-tienda/${compra.id}`, payload)
        : await api.post(`/planillas/${planillaId}/detalles/${detalleId}/compras-tienda`, payload);
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

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="fecha_compra">
            Fecha
          </label>
          <input
            id="fecha_compra"
            type="date"
            required
            value={fecha}
            onChange={(event) => setFecha(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="valor_compra">
            Valor
          </label>
          <NumberInput
            id="valor_compra"
            min="0.01"
            step="0.01"
            required
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="descripcion_compra">
          Descripción {requiereMotivo ? '(opcional)' : ''}
        </label>
        <input
          id="descripcion_compra"
          type="text"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className={INPUT_CLASES}
        />
      </div>

      {requiereMotivo && (
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="motivo_compra">
            Motivo <span className="text-red-500">*</span>
          </label>
          <textarea
            id="motivo_compra"
            required
            rows={2}
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>
      )}

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
 * Widget colapsable de CRUD contra compras_tienda, parametrizado por tipo
 * ("compra_credito" o "cobro_adicional"). Ambos widgets comparten la misma
 * tabla y suman al mismo total_compras_tienda del detalle, pero se muestran
 * como secciones separadas porque representan cosas distintas para el
 * negocio (dato recurrente sin motivo vs. incidente puntual con motivo
 * obligatorio).
 */
export default function SeccionComprasTienda({
  planillaId,
  detalle,
  editable,
  onDetalleActualizado,
  tipo,
  titulo,
  requiereMotivo,
  textoVacio,
}) {
  const [abierto, setAbierto] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState('');

  const compras = (detalle.compras_tienda ?? []).filter((compra) => compra.tipo === tipo);

  function abrirNuevo() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(compra) {
    setEditando(compra);
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

  async function handleEliminar(compra) {
    const etiqueta = requiereMotivo ? 'este cobro adicional' : 'esta compra a crédito';
    if (!window.confirm(`¿Eliminar ${etiqueta}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError('');
    setEliminandoId(compra.id);

    try {
      const { data } = await api.delete(`/planillas/${planillaId}/detalles/${detalle.id}/compras-tienda/${compra.id}`);
      onDetalleActualizado(data.detalle);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setEliminandoId(null);
    }
  }

  const total = compras.reduce((acumulado, compra) => acumulado + Number(compra.valor), 0);

  return (
    <div className="mt-3 border-t-[0.5px] border-[var(--border)] pt-3">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        <span>{titulo} {compras.length > 0 && `(${compras.length})`}</span>
        <span className="flex items-center gap-2">
          {compras.length > 0 && (
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

          {compras.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">{textoVacio}</p>
          ) : (
            <ul className="divide-y-[0.5px] divide-[var(--border)]">
              {compras.map((compra) => (
                <li key={compra.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate text-slate-600 dark:text-slate-300">{compra.descripcion || 'Sin descripción'}</p>
                    {requiereMotivo && compra.motivo && (
                      <p className="truncate text-slate-400 dark:text-slate-500">Motivo: {compra.motivo}</p>
                    )}
                    <p className="text-slate-400 dark:text-slate-500">{String(compra.fecha).slice(0, 10)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatearMoneda(compra.valor)}</span>

                    {editable && (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirEditar(compra)}
                          aria-label="Editar"
                          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <IconEditar className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(compra)}
                          disabled={eliminandoId === compra.id}
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

      <Modal open={modalAbierto} onClose={cerrarModal} title={editando ? `Editar ${titulo.toLowerCase()}` : `Agregar ${titulo.toLowerCase()}`}>
        <FormCompra
          planillaId={planillaId}
          detalleId={detalle.id}
          tipo={tipo}
          requiereMotivo={requiereMotivo}
          compra={editando}
          onGuardado={handleGuardado}
          onCancelar={cerrarModal}
        />
      </Modal>
    </div>
  );
}
