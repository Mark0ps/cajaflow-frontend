import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../../components/Modal';
import NumberInput from '../../components/common/NumberInput';
import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

const TIPOS_PAGO = ['efectivo', 'tarjeta', 'transferencia', 'cheque'];

const INPUT_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400';

function FormGastoExterno({ onGuardado, onCancelar }) {
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  const [descripcion, setDescripcion] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [valor, setValor] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    try {
      const { data } = await api.post('/gastos/externos', {
        ...datosProveedor,
        descripcion,
        numero_factura: numeroFactura || null,
        tipo_pago: tipoPago,
        valor,
      });
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

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="descripcion_externo">
          Descripción
        </label>
        <input
          id="descripcion_externo"
          type="text"
          required
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className={INPUT_CLASES}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="factura_externo">
            N° factura (opcional)
          </label>
          <input
            id="factura_externo"
            type="text"
            value={numeroFactura}
            onChange={(event) => setNumeroFactura(event.target.value)}
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

        <div>
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
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : 'Registrar gasto'}
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
 * Gastos externos del negocio (sin cierre de caja asociado). Si se registran
 * sin N° de factura quedan automáticamente como factura pendiente.
 */
export default function GastosExternos() {
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  function cargar() {
    setLoading(true);
    setError('');

    api
      .get('/gastos', { params: { es_externo: 1, page: pagina } })
      .then(({ data }) => setRespuesta(data))
      .catch(() => setError('No se pudieron cargar los gastos externos.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [pagina]);

  function handleGuardado() {
    setModalAbierto(false);
    if (pagina === 1) {
      cargar();
    } else {
      setPagina(1);
    }
  }

  const gastos = respuesta?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Gastos externos</h1>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Registrar gasto externo
        </button>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : error ? (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : gastos.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay gastos externos registrados.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)]">
            <table className="w-full text-sm">
              <thead className="border-b-[0.5px] border-[var(--border)] text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 font-medium">Proveedor</th>
                  <th className="px-4 py-2.5 font-medium">Descripción</th>
                  <th className="px-4 py-2.5 font-medium">Factura</th>
                  <th className="px-4 py-2.5 font-medium">Pago</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y-[0.5px] divide-[var(--border)]">
                {gastos.map((gasto) => (
                  <tr key={gasto.id}>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {formatearFechaLarga(gasto.created_at)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                      {gasto.proveedor?.nombre ?? gasto.proveedor_nombre_libre ?? 'Sin registrar'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{gasto.descripcion || '—'}</td>
                    <td className="px-4 py-2.5">
                      {gasto.factura_pendiente ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Pendiente
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300">{gasto.numero_factura}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-slate-600 dark:text-slate-300">{gasto.tipo_pago}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                      {formatearMoneda(gasto.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {respuesta.last_page > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>
                Página {respuesta.current_page} de {respuesta.last_page} · {respuesta.total} gastos
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={respuesta.current_page <= 1}
                  onClick={() => setPagina((prev) => prev - 1)}
                  className="rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={respuesta.current_page >= respuesta.last_page}
                  onClick={() => setPagina((prev) => prev + 1)}
                  className="rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="Registrar gasto externo" maxWidth="max-w-xl">
        <FormGastoExterno onGuardado={handleGuardado} onCancelar={() => setModalAbierto(false)} />
      </Modal>
    </div>
  );
}
