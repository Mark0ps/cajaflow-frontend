import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import { IconCamara, IconCheck, IconSubir } from '../icons';
import { fechaLocalHoy, formatearFechaLarga, formatearMoneda } from '../../utils/moneda';
import { comprimirImagen } from '../../utils/comprimirImagen';
import usePegarImagen from '../../hooks/usePegarImagen';

const TIPOS_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'cheque'];
const CATEGORIAS = [
  { value: 'gasto_operativo', label: 'Gasto operativo' },
  { value: 'pago_tarjeta_credito', label: 'Pago de tarjeta de crédito' },
  { value: 'servicios_publicos', label: 'Servicios públicos / Gastos fijos' },
];

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400';

/** Mismo formulario para crear un gasto externo o editar uno existente (pasar `gasto`). */
export default function FormGastoExterno({ gasto = null, onGuardado, onCancelar }) {
  const editando = Boolean(gasto);

  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  const [fechaEmision, setFechaEmision] = useState(fechaLocalHoy());
  const [descripcion, setDescripcion] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [categoria, setCategoria] = useState('gasto_operativo');
  const [valor, setValor] = useState('');
  const [facturaSimilar, setFacturaSimilar] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [comprobanteExistente, setComprobanteExistente] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inputCamaraRef = useRef(null);
  const inputArchivoRef = useRef(null);

  async function procesarArchivo(original) {
    setComprobante(original ? await comprimirImagen(original) : null);
  }

  async function handleArchivoSeleccionado(event) {
    await procesarArchivo(event.target.files?.[0] ?? null);
  }

  // Tercera opción silenciosa junto a cámara/galería, solo en desktop.
  usePegarImagen({ onImagenPegada: procesarArchivo });

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

  useEffect(() => {
    if (!gasto) return;

    if (gasto.proveedor) {
      setProveedor({ id: gasto.proveedor.id, nombre: gasto.proveedor.nombre });
      setBusqueda(gasto.proveedor.nombre);
    } else if (gasto.proveedor_nombre_libre) {
      setProveedor({ id: null, nombre: gasto.proveedor_nombre_libre });
      setBusqueda(gasto.proveedor_nombre_libre);
    }

    setFechaEmision(String(gasto.fecha_emision ?? '').slice(0, 10) || fechaLocalHoy());
    setDescripcion(gasto.descripcion ?? '');
    setNumeroFactura(gasto.numero_factura ?? '');
    setTipoPago(gasto.tipo_pago ?? 'efectivo');
    setCategoria(gasto.categoria ?? 'gasto_operativo');
    setValor(String(gasto.valor ?? ''));
    setComprobanteExistente(gasto.comprobante_url ?? null);
    // Solo se precarga una vez, al entrar en modo edición de este gasto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasto?.id]);

  useEffect(() => {
    if (proveedor || busqueda.trim() === '') {
      setSugerencias([]);
      return;
    }

    const timeout = setTimeout(() => {
      api
        .get('/proveedores', { params: { q: busqueda.trim() } })
        .then(({ data }) => setSugerencias(data))
        .catch(() => setSugerencias([]));
    }, 300);

    return () => clearTimeout(timeout);
  }, [busqueda, proveedor]);

  function seleccionarProveedor(item) {
    setProveedor(item);
    setBusqueda(item.nombre);
    setSugerencias([]);
    setFacturaSimilar(null);
  }

  async function verificarFacturaSimilar() {
    if (!proveedor?.id || numeroFactura.trim() === '') {
      setFacturaSimilar(null);
      return;
    }

    try {
      const { data } = await api.get(`/proveedores/${proveedor.id}/facturas-similares`, {
        params: {
          numero: numeroFactura.trim(),
          ...(editando ? { excluir_id: gasto.id } : {}),
        },
      });
      setFacturaSimilar(data[0] ?? null);
    } catch {
      // Advertencia no bloqueante: si falla la verificación, simplemente no se muestra.
      setFacturaSimilar(null);
    }
  }

  async function crearProveedor() {
    setError('');
    setCreandoProveedor(true);

    try {
      const { data } = await api.post('/proveedores', { nombre: busqueda.trim() });
      seleccionarProveedor(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCreandoProveedor(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!proveedor) {
      setError('Selecciona un proveedor del catálogo o crea uno nuevo.');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    if (proveedor.id) formData.append('proveedor_id', proveedor.id);
    else formData.append('proveedor_nombre_libre', proveedor.nombre);
    formData.append('fecha_emision', fechaEmision);
    if (descripcion) formData.append('descripcion', descripcion);
    if (numeroFactura) formData.append('numero_factura', numeroFactura);
    formData.append('tipo_pago', tipoPago);
    formData.append('categoria', categoria);
    formData.append('valor', valor);
    if (comprobante) formData.append('comprobante', comprobante);
    // El navegador no puede enviar PATCH con multipart/form-data (PHP no
    // parsea $_FILES fuera de POST) — se manda POST con el override que
    // Laravel ya reconoce, misma solución documentada para subir archivos.
    if (editando) formData.append('_method', 'PATCH');

    try {
      const { data } = editando
        ? await api.post(`/gastos/${gasto.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/gastos/externos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      onGuardado(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const hayCoincidenciaExacta = sugerencias.some(
    (item) => item.nombre.toLowerCase() === busqueda.trim().toLowerCase()
  );

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="relative mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="proveedor_externo">
          Proveedor
        </label>
        <input
          id="proveedor_externo"
          type="text"
          autoComplete="off"
          value={busqueda}
          onChange={(event) => {
            setProveedor(null);
            setBusqueda(event.target.value);
            setFacturaSimilar(null);
          }}
          placeholder="Buscar proveedor..."
          className={INPUT_CLASES}
        />

        {!proveedor && busqueda.trim() !== '' && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] shadow-sm">
            {sugerencias.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => seleccionarProveedor(item)}
                className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {item.nombre}
              </button>
            ))}

            {!hayCoincidenciaExacta && (
              <button
                type="button"
                onClick={crearProveedor}
                disabled={creandoProveedor}
                className="block w-full px-3 py-1.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {creandoProveedor ? 'Creando...' : `+ Crear proveedor "${busqueda.trim()}"`}
              </button>
            )}
          </div>
        )}

        {proveedor && (
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Proveedor seleccionado: {proveedor.nombre}</p>
        )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="fecha_emision_externo">
            Fecha de emisión
          </label>
          <input
            id="fecha_emision_externo"
            type="date"
            required
            value={fechaEmision}
            onChange={(event) => setFechaEmision(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="categoria_externo">
            Categoría
          </label>
          <select
            id="categoria_externo"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            className={INPUT_CLASES}
          >
            {CATEGORIAS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="descripcion_externo">
          Referencia (opcional)
        </label>
        <input
          id="descripcion_externo"
          type="text"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          placeholder="Numero de referencia #, Transferencia a Personal..."
          className={INPUT_CLASES}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="factura_externo">
            N° factura (opcional)
          </label>
          <input
            id="factura_externo"
            type="text"
            value={numeroFactura}
            onChange={(event) => {
              setNumeroFactura(event.target.value);
              setFacturaSimilar(null);
            }}
            onBlur={verificarFacturaSimilar}
            placeholder="000-00-00000000 (ultimos 6 digitos)"
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="tipo_pago_externo">
            Tipo de pago
          </label>
          <select id="tipo_pago_externo" value={tipoPago} onChange={(event) => setTipoPago(event.target.value)} className={INPUT_CLASES}>
            {TIPOS_PAGO.map((tipo) => (
              <option key={tipo} value={tipo} className="capitalize">
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="valor_externo">
          Valor
        </label>
        <NumberInput
          id="valor_externo"
          min="0.01"
          step="0.01"
          required
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          className="px-2 py-1.5"
        />
      </div>

      {facturaSimilar && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          ⚠ Ya existe un gasto con un N° de factura similar para este proveedor — registrado el{' '}
          {formatearFechaLarga(facturaSimilar.fecha)}, {formatearMoneda(facturaSimilar.valor)}.
        </p>
      )}

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Comprobante (opcional)</label>

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

        {!comprobante && comprobanteExistente && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Ya tiene un comprobante —{' '}
            <a href={comprobanteExistente} target="_blank" rel="noreferrer" className="text-slate-700 underline dark:text-slate-200">
              verlo
            </a>
            . Sube uno nuevo para reemplazarlo.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar gasto'}
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
