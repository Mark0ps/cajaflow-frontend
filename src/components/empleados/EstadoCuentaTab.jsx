import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import { IconCamara, IconSubir, IconCheck } from '../icons';
import { formatearMoneda, NOMBRES_MESES } from '../../utils/moneda';

const METODOS = ['efectivo', 'transferencia', 'cheque'];

export default function EstadoCuentaTab({ empleadoId }) {
  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seleccionadas, setSeleccionadas] = useState(new Set());

  const [montoTotal, setMontoTotal] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [metodo, setMetodo] = useState('efectivo');
  const [comprobante, setComprobante] = useState(null);
  const [notas, setNotas] = useState('');
  const [errorPago, setErrorPago] = useState('');
  const [exito, setExito] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const inputCamaraRef = useRef(null);
  const inputArchivoRef = useRef(null);

  // Dos inputs de archivo separados (cámara vs. galería/PDF): cuando el
  // `accept` mezcla imágenes y PDF, los navegadores móviles esconden la
  // opción de cámara y solo dejan elegir de archivos/galería. Ambos botones
  // terminan seteando el mismo estado `comprobante`.
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

  function cargar() {
    setLoading(true);
    setError('');

    api
      .get(`/empleados/${empleadoId}/estado-cuenta`)
      .then(({ data }) => {
        setEstadoCuenta(data);
        setSeleccionadas(new Set());
      })
      .catch(() => setError('No se pudo cargar el estado de cuenta.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [empleadoId]);

  function toggle(id) {
    setSeleccionadas((prev) => {
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
    setErrorPago('');
    setExito('');

    if (seleccionadas.size === 0) {
      setErrorPago('Selecciona al menos una quincena a cubrir.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('monto_total', montoTotal);
    formData.append('fecha_pago', fechaPago);
    formData.append('metodo', metodo);
    if (notas.trim()) formData.append('notas', notas.trim());
    if (comprobante) formData.append('comprobante', comprobante);

    estadoCuenta.quincenas_pendientes
      .filter((quincena) => seleccionadas.has(quincena.id))
      .forEach((quincena) => formData.append('planilla_detalle_ids[]', quincena.id));

    try {
      await api.post(`/empleados/${empleadoId}/pagos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExito('Pago registrado correctamente.');
      setMontoTotal('');
      setFechaPago('');
      setMetodo('efectivo');
      quitarComprobante();
      setNotas('');
      cargar();
    } catch (err) {
      setErrorPago(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  const pendientes = estadoCuenta.quincenas_pendientes ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quincenas pendientes</h2>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Total adeudado: {formatearMoneda(estadoCuenta.total_adeudado)}
          </span>
        </div>

        {pendientes.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">No hay quincenas pendientes.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {pendientes.map((quincena) => (
              <li key={quincena.id}>
                <label className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(quincena.id)}
                      onChange={() => toggle(quincena.id)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                    />
                    {NOMBRES_MESES[quincena.planilla.mes]} {quincena.planilla.anio} — Quincena {quincena.planilla.quincena}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {formatearMoneda(quincena.saldo_pendiente)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Registrar pago</h2>

        {errorPago && (
          <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{errorPago}</p>
        )}
        {exito && (
          <p className="mb-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{exito}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="monto_total_pago">
                Monto total
              </label>
              <NumberInput
                id="monto_total_pago"
                min="0.01"
                step="0.01"
                required
                value={montoTotal}
                onChange={(event) => setMontoTotal(event.target.value)}
                className="px-2 py-1.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="fecha_pago">
                Fecha
              </label>
              <input
                id="fecha_pago"
                type="date"
                required
                value={fechaPago}
                onChange={(event) => setFechaPago(event.target.value)}
                className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="metodo_pago">
              Método
            </label>
            <select
              id="metodo_pago"
              value={metodo}
              onChange={(event) => setMetodo(event.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
            >
              {METODOS.map((valor) => (
                <option key={valor} value={valor} className="capitalize">
                  {valor}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Comprobante (foto o PDF)</label>

            {/* Ocultos: "Tomar foto" fuerza la cámara (capture="environment",
                accept solo imagen); "Subir archivo" abre archivos/galería y
                acepta también PDF. Mezclar accept image+pdf en un solo input
                esconde la cámara en navegadores móviles — por eso van separados. */}
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
                className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <IconCamara className="h-4 w-4" />
                Tomar foto
              </button>
              <button
                type="button"
                onClick={() => inputArchivoRef.current?.click()}
                className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
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

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="notas_pago">
              Notas (opcional)
            </label>
            <textarea
              id="notas_pago"
              rows={2}
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || pendientes.length === 0}
            className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {submitting ? 'Registrando...' : 'Registrar pago'}
          </button>
        </form>
      </section>
    </div>
  );
}
