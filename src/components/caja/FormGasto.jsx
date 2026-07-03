import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';

export default function FormGasto({ cierreId, gasto = null, onGuardado, onCancelar }) {
  const editando = Boolean(gasto);

  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [creandoProveedor, setCreandoProveedor] = useState(false);

  const [descripcion, setDescripcion] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [valor, setValor] = useState('');

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

    setDescripcion(gasto.descripcion ?? '');
    setNumeroFactura(gasto.numero_factura ?? '');
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
      if (editando) {
        await api.patch(`/cierres-caja/${cierreId}/gastos/${gasto.id}`, {
          ...datosProveedor,
          descripcion: descripcion || null,
          numero_factura: numeroFactura || null,
          valor,
        });
      } else {
        await api.post(`/cierres-caja/${cierreId}/gastos`, {
          ...datosProveedor,
          descripcion: descripcion || null,
          numero_factura: numeroFactura || null,
          valor,
        });
      }
      await onGuardado();
      onCancelar?.();
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
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="relative mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="proveedor">
          Proveedor
        </label>
        <input
          id="proveedor"
          type="text"
          autoComplete="off"
          value={busqueda}
          onChange={(event) => {
            setProveedor(null);
            setBusqueda(event.target.value);
          }}
          placeholder="Buscar proveedor..."
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400"
        />

        {!proveedor && busqueda.trim() !== '' && (
          <div className="absolute z-10 mt-1 w-full rounded border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
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
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="descripcion_gasto">
          Descripción (opcional)
        </label>
        <input
          id="descripcion_gasto"
          type="text"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="numero_factura">
            N° factura
          </label>
          <input
            id="numero_factura"
            type="text"
            value={numeroFactura}
            onChange={(event) => setNumeroFactura(event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="valor_gasto">
            Valor
          </label>
          <NumberInput
            id="valor_gasto"
            step="0.01"
            min="0.01"
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
          className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar gasto'}
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={submitting}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
