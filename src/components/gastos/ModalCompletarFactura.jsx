import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';
import { formatearMoneda } from '../../utils/moneda';

/**
 * Completa el N° de factura de un gasto que quedó pendiente
 * (`PATCH /gastos/{id}/factura`). Lo usan el detalle de cierre y la
 * pantalla de Facturas pendientes de Secretaria.
 */
export default function ModalCompletarFactura({ open, onClose, gasto, onGuardado }) {
  const [numeroFactura, setNumeroFactura] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function cerrar() {
    if (submitting) return;
    setNumeroFactura('');
    setError('');
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await api.patch(`/gastos/${gasto.id}/factura`, { numero_factura: numeroFactura.trim() });
      onGuardado(data);
      setNumeroFactura('');
      onClose();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!gasto) return null;

  return (
    <Modal open={open} onClose={cerrar} title="Completar N° de factura">
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          {gasto.proveedor?.nombre ?? gasto.proveedor_nombre_libre ?? 'Proveedor sin registrar'} ·{' '}
          {gasto.descripcion || 'Sin descripción'} ·{' '}
          <span className="font-semibold">{formatearMoneda(gasto.valor)}</span>
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}

        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="numero_factura_pendiente">
          N° de factura
        </label>
        <input
          id="numero_factura_pendiente"
          type="text"
          autoFocus
          required
          value={numeroFactura}
          onChange={(event) => setNumeroFactura(event.target.value)}
          className="mb-4 w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting || numeroFactura.trim() === ''}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {submitting ? 'Guardando...' : 'Guardar factura'}
          </button>
          <button
            type="button"
            onClick={cerrar}
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
