import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import { fechaLocalHoy, formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

const TIPOS_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'cheque'];
const CATEGORIAS = [
  { value: 'gasto_operativo', label: 'Gasto operativo' },
  { value: 'pago_tarjeta_credito', label: 'Pago de tarjeta de crédito' },
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

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    const datosProveedor = proveedor.id
      ? { proveedor_id: proveedor.id }
      : { proveedor_nombre_libre: proveedor.nombre };

    const payload = {
      ...datosProveedor,
      fecha_emision: fechaEmision,
      descripcion: descripcion || null,
      numero_factura: numeroFactura || null,
      tipo_pago: tipoPago,
      categoria,
      valor,
    };

    try {
      const { data } = editando
        ? await api.patch(`/gastos/${gasto.id}`, payload)
        : await api.post('/gastos/externos', payload);

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
