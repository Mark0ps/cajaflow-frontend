import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../../components/common/NumberInput';
import { IconCamara, IconCheck, IconEliminar, IconSubir } from '../../components/icons';
import { fechaLocalHoy, formatearMoneda } from '../../utils/moneda';

const SELECT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

export default function AsignarVale() {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEmision, setFechaEmision] = useState(fechaLocalHoy());
  const [comprobante, setComprobante] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [valesCreados, setValesCreados] = useState([]);

  const inputCamaraRef = useRef(null);
  const inputArchivoRef = useRef(null);

  useEffect(() => {
    api
      .get('/empleados')
      .then(({ data }) => setEmpleados(data))
      .catch(() => setEmpleados([]));
  }, []);

  // Dos inputs separados (cámara vs. galería): mezclar accept imagen+PDF en
  // un solo input esconde la opción de cámara en navegadores móviles.
  function handleArchivoSeleccionado(event) {
    setComprobante(event.target.files?.[0] ?? null);
  }

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
    setExito('');

    if (!empleadoId) {
      setError('Selecciona un empleado.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('empleado_id', empleadoId);
    formData.append('monto', monto);
    formData.append('fecha_emision', fechaEmision);
    if (descripcion.trim()) formData.append('descripcion', descripcion.trim());
    if (comprobante) formData.append('comprobante', comprobante);

    try {
      const { data } = await api.post('/vales', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExito('Vale asignado correctamente.');
      setValesCreados((prev) => [data, ...prev]);
      setMonto('');
      setDescripcion('');
      setFechaEmision(fechaLocalHoy());
      quitarComprobante();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function eliminarValeCreado(vale) {
    try {
      await api.delete(`/vales/${vale.id}`);
      setValesCreados((prev) => prev.filter((v) => v.id !== vale.id));
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Asignar vale</h1>

      <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}
        {exito && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {exito}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="empleado_vale">
              Empleado
            </label>
            <select
              id="empleado_vale"
              required
              value={empleadoId}
              onChange={(event) => setEmpleadoId(event.target.value)}
              className={SELECT_CLASES}
            >
              <option value="">Selecciona un empleado</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre} {empleado.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="monto_vale">
                Monto
              </label>
              <NumberInput
                id="monto_vale"
                min="0.01"
                step="0.01"
                required
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                className="px-2 py-1.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="fecha_emision_vale">
                Fecha de emisión
              </label>
              <input
                id="fecha_emision_vale"
                type="date"
                required
                max={fechaLocalHoy()}
                value={fechaEmision}
                onChange={(event) => setFechaEmision(event.target.value)}
                className={INPUT_CLASES}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="descripcion_vale">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion_vale"
              rows={2}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              className={INPUT_CLASES}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Foto de comprobante (opcional)
            </label>

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
                className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <IconCamara className="h-4 w-4" />
                Tomar foto
              </button>
              <button
                type="button"
                onClick={() => inputArchivoRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <IconSubir className="h-4 w-4" />
                Subir archivo
              </button>
            </div>

            {comprobante && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Vista previa del comprobante"
                    className="h-12 w-12 rounded border border-slate-200 object-cover dark:border-slate-700"
                  />
                ) : (
                  <span className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    PDF
                  </span>
                )}
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <IconCheck className="h-4 w-4" />
                  Comprobante listo para subir
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

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {submitting ? 'Asignando...' : 'Asignar vale'}
          </button>
        </form>
      </div>

      {valesCreados.length > 0 && (
        <div className="mt-4 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Vales asignados en esta sesión</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {valesCreados.map((vale) => (
              <li key={vale.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-slate-700 dark:text-slate-200">
                  {vale.empleado?.nombre} {vale.empleado?.apellido} · {formatearMoneda(vale.monto)} ·{' '}
                  {String(vale.fecha_emision).slice(0, 10)}
                </span>
                <button
                  type="button"
                  onClick={() => eliminarValeCreado(vale)}
                  aria-label="Eliminar vale"
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <IconEliminar className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
