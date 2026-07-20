import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';
import NumberInput from '../common/NumberInput';
import { IconCamara, IconSubir, IconCheck } from '../icons';
import { fechaLocalHoy } from '../../utils/moneda';
import { comprimirImagen } from '../../utils/comprimirImagen';
import usePegarImagen from '../../hooks/usePegarImagen';

const METODOS = ['efectivo', 'transferencia', 'cheque'];

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

/** Registra un pago contra una sola quincena (este detalle), desde la propia card de planilla. */
export default function ModalRegistrarPago({ open, onClose, detalle, onRegistrado }) {
  const [monto, setMonto] = useState(String(detalle.saldo_pendiente));
  const [fechaPago, setFechaPago] = useState(fechaLocalHoy());
  const [metodo, setMetodo] = useState('efectivo');
  const [comprobante, setComprobante] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inputCamaraRef = useRef(null);
  const inputArchivoRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setMonto(String(detalle.saldo_pendiente));
    setFechaPago(fechaLocalHoy());
    setMetodo('efectivo');
    setComprobante(null);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detalle.id]);

  async function procesarArchivo(original) {
    setComprobante(original ? await comprimirImagen(original) : null);
  }

  async function handleArchivoSeleccionado(event) {
    await procesarArchivo(event.target.files?.[0] ?? null);
  }

  // Tercera opción silenciosa junto a cámara/galería, solo en desktop.
  usePegarImagen({ habilitado: open, onImagenPegada: procesarArchivo });

  function quitarComprobante() {
    setComprobante(null);
    if (inputCamaraRef.current) inputCamaraRef.current.value = '';
    if (inputArchivoRef.current) inputArchivoRef.current.value = '';
  }

  useEffect(() => {
    if (!comprobante || !comprobante.type?.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(comprobante);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [comprobante]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('monto_total', monto);
    formData.append('fecha_pago', fechaPago);
    formData.append('metodo', metodo);
    formData.append('planilla_detalle_ids[]', detalle.id);
    if (comprobante) formData.append('comprobante', comprobante);

    try {
      const { data } = await api.post(`/empleados/${detalle.empleado_id}/pagos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const detalleActualizado = data.planilla_detalles?.find((d) => d.id === detalle.id);
      if (detalleActualizado) onRegistrado(detalleActualizado);
      onClose();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago" maxWidth="max-w-md">
      <form onSubmit={handleSubmit}>
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`monto_pago_${detalle.id}`}>
              Monto
            </label>
            <NumberInput
              id={`monto_pago_${detalle.id}`}
              min="0.01"
              step="0.01"
              required
              value={monto}
              onChange={(event) => setMonto(event.target.value)}
              className="px-2 py-1.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`fecha_pago_${detalle.id}`}>
              Fecha
            </label>
            <input
              id={`fecha_pago_${detalle.id}`}
              type="date"
              required
              value={fechaPago}
              onChange={(event) => setFechaPago(event.target.value)}
              className={INPUT_CLASES}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`metodo_pago_${detalle.id}`}>
            Método
          </label>
          <select
            id={`metodo_pago_${detalle.id}`}
            value={metodo}
            onChange={(event) => setMetodo(event.target.value)}
            className={INPUT_CLASES}
          >
            {METODOS.map((valor) => (
              <option key={valor} value={valor} className="capitalize">
                {valor}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Comprobante (foto o PDF)</label>

          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleArchivoSeleccionado}
            className="hidden"
          />
          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleArchivoSeleccionado}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputCamaraRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <IconCamara className="h-4 w-4" />
              Tomar foto
            </button>
            <button
              type="button"
              onClick={() => inputArchivoRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <IconSubir className="h-4 w-4" />
              Subir archivo
            </button>
          </div>

          <p className="mt-1.5 hidden text-xs text-slate-400 md:block dark:text-slate-500">
            También puedes pegar una imagen con Ctrl+V.
          </p>

          {comprobante && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Vista previa del comprobante"
                  className="h-12 w-12 rounded border-[0.5px] border-[var(--border)] object-cover"
                />
              ) : (
                <span className="rounded border-[0.5px] border-[var(--border)] px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  PDF
                </span>
              )}
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <IconCheck className="h-4 w-4" />
                Listo para subir
              </span>
              <button
                type="button"
                onClick={quitarComprobante}
                className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {submitting ? 'Registrando...' : 'Registrar pago'}
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
