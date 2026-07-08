import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../../components/Modal';
import FormGastoExterno from '../../components/gastos/FormGastoExterno';
import { IconEditar, IconEliminar, IconFiltro } from '../../components/icons';
import { NOMBRES_MESES, difierenPorDia, formatearFechaCorta, formatearMoneda } from '../../utils/moneda';

const CAMPO_CLASES =
  'w-full rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

/** Últimos `cantidad` meses (incluyendo el actual), más recientes primero. */
function generarOpcionesMes(cantidad = 12) {
  const ahora = new Date();
  const opciones = [];

  for (let i = 0; i < cantidad; i += 1) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    opciones.push({ value: `${anio}-${String(mes).padStart(2, '0')}`, label: `${NOMBRES_MESES[mes]} ${anio}` });
  }

  return opciones;
}

function GastoExternoCard({ gasto, onEditar, onEliminar }) {
  const emitidoDistintoDeRegistrado = difierenPorDia(gasto.fecha_emision, gasto.created_at);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
            {gasto.proveedor?.nombre ?? gasto.proveedor_nombre_libre ?? 'Sin registrar'}
          </p>
          {gasto.categoria === 'pago_tarjeta_credito' && (
            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              Tarjeta de crédito
            </span>
          )}
        </div>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          Emitido: {formatearFechaCorta(gasto.fecha_emision)}
          {emitidoDistintoDeRegistrado ? ` · Registrado: ${formatearFechaCorta(gasto.created_at)}` : ''}
          {gasto.descripcion ? ` · ${gasto.descripcion}` : ''}
          {' · '}
          <span className="capitalize">{gasto.tipo_pago}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {gasto.factura_pendiente ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Factura pendiente
          </span>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">Fact# {gasto.numero_factura}</span>
        )}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{formatearMoneda(gasto.valor)}</span>
        <button
          type="button"
          onClick={() => onEditar(gasto)}
          aria-label="Editar gasto"
          className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <IconEditar className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onEliminar(gasto)}
          aria-label="Eliminar gasto"
          className="rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
        >
          <IconEliminar className="h-4 w-4" />
        </button>
      </div>
    </div>
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
  const [modalCrear, setModalCrear] = useState(false);
  const [gastoEditar, setGastoEditar] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFactura, setFiltroFactura] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  // '' = todos los meses, 'custom' = rango personalizado (Desde/Hasta), o "YYYY-MM".
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroTipoPago, setFiltroTipoPago] = useState('');
  const [filtroAgregadoPorRol, setFiltroAgregadoPorRol] = useState('');
  const [proveedores, setProveedores] = useState([]);

  const opcionesMes = useMemo(() => generarOpcionesMes(), []);
  const esRangoPersonalizado = filtroFecha === 'custom';

  useEffect(() => {
    api
      .get('/proveedores')
      .then(({ data }) => setProveedores(data))
      .catch(() => setProveedores([]));
  }, []);

  function handleFiltroFechaChange(value) {
    setFiltroFecha(value);
    if (value !== 'custom') {
      setFechaDesde('');
      setFechaHasta('');
    }
  }

  const filtrosActivos =
    (filtroCategoria ? 1 : 0) +
    (filtroFactura ? 1 : 0) +
    (esRangoPersonalizado ? (fechaDesde || fechaHasta ? 1 : 0) : filtroFecha ? 1 : 0) +
    (filtroProveedor ? 1 : 0) +
    (filtroTipoPago ? 1 : 0) +
    (filtroAgregadoPorRol ? 1 : 0);

  function cargar() {
    setLoading(true);
    setError('');

    const [anio, mes] = !esRangoPersonalizado && filtroFecha ? filtroFecha.split('-') : [undefined, undefined];

    api
      .get('/gastos', {
        params: {
          es_externo: 1,
          page: pagina,
          q: busqueda.trim() || undefined,
          categoria: filtroCategoria || undefined,
          factura_pendiente: filtroFactura ? (filtroFactura === 'pendiente' ? 1 : 0) : undefined,
          fecha_desde: esRangoPersonalizado ? fechaDesde || undefined : undefined,
          fecha_hasta: esRangoPersonalizado ? fechaHasta || undefined : undefined,
          anio,
          mes,
          proveedor_id: filtroProveedor || undefined,
          tipo_pago: filtroTipoPago || undefined,
          agregado_por_rol: filtroAgregadoPorRol || undefined,
        },
      })
      .then(({ data }) => setRespuesta(data))
      .catch(() => setError('No se pudieron cargar los gastos externos.'))
      .finally(() => setLoading(false));
  }

  const dependenciasFiltro = [
    busqueda,
    filtroCategoria,
    filtroFactura,
    fechaDesde,
    fechaHasta,
    filtroFecha,
    filtroProveedor,
    filtroTipoPago,
    filtroAgregadoPorRol,
  ];

  // Cualquier cambio en búsqueda/filtros reinicia a la página 1.
  useEffect(() => {
    setPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependenciasFiltro);

  useEffect(() => {
    const timeout = setTimeout(cargar, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, ...dependenciasFiltro]);

  function handleCreado() {
    setModalCrear(false);
    if (pagina === 1) {
      cargar();
    } else {
      setPagina(1);
    }
  }

  function handleEditado() {
    setGastoEditar(null);
    cargar();
  }

  async function eliminar(gasto) {
    const nombre = gasto.proveedor?.nombre ?? gasto.proveedor_nombre_libre ?? 'este gasto';

    if (!window.confirm(`¿Eliminar el gasto de ${nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/gastos/${gasto.id}`);
      cargar();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  function limpiarFiltros() {
    setFiltroCategoria('');
    setFiltroFactura('');
    setFechaDesde('');
    setFechaHasta('');
    setFiltroFecha('');
    setFiltroProveedor('');
    setFiltroTipoPago('');
    setFiltroAgregadoPorRol('');
  }

  const gastos = respuesta?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Gastos externos</h1>
        <button
          type="button"
          onClick={() => setModalCrear(true)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          + Registrar gasto externo
        </button>
      </div>

      <div className="mb-4 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por proveedor, referencia o N° de factura..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className={CAMPO_CLASES}
          />
          <button
            type="button"
            onClick={() => setFiltrosAbiertos((prev) => !prev)}
            className={`flex shrink-0 items-center gap-2 rounded-lg border-[0.5px] px-3 py-1.5 text-sm font-medium transition ${
              filtrosAbiertos
                ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-600 dark:bg-slate-700'
                : 'border-[var(--border)] text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <IconFiltro className="h-4 w-4" />
            Filtros{filtrosActivos > 0 ? ` (${filtrosActivos})` : ''}
          </button>
        </div>

        {filtrosAbiertos && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t-[0.5px] border-[var(--border)] pt-3">
            <select
              value={filtroFecha}
              onChange={(event) => handleFiltroFechaChange(event.target.value)}
              className={`max-w-44 ${CAMPO_CLASES}`}
            >
              <option value="">Todos los meses</option>
              {opcionesMes.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
              <option value="custom">Rango personalizado</option>
            </select>

            <select
              value={filtroProveedor}
              onChange={(event) => setFiltroProveedor(event.target.value)}
              className={`max-w-56 ${CAMPO_CLASES}`}
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroTipoPago}
              onChange={(event) => setFiltroTipoPago(event.target.value)}
              className={`max-w-44 ${CAMPO_CLASES}`}
            >
              <option value="">Todos los tipos de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
            </select>

            <select
              value={filtroAgregadoPorRol}
              onChange={(event) => setFiltroAgregadoPorRol(event.target.value)}
              className={`max-w-44 ${CAMPO_CLASES}`}
            >
              <option value="">Registrado por cualquiera</option>
              <option value="admin">Solo Admin</option>
              <option value="secretaria">Solo Secretaria</option>
            </select>

            <select
              value={filtroCategoria}
              onChange={(event) => setFiltroCategoria(event.target.value)}
              className={`max-w-56 ${CAMPO_CLASES}`}
            >
              <option value="">Todas las categorías</option>
              <option value="gasto_operativo">Gasto operativo</option>
              <option value="pago_tarjeta_credito">Pago de tarjeta de crédito</option>
            </select>

            <select
              value={filtroFactura}
              onChange={(event) => setFiltroFactura(event.target.value)}
              className={`max-w-60 ${CAMPO_CLASES}`}
            >
              <option value="">Con y sin factura pendiente</option>
              <option value="pendiente">Factura pendiente</option>
              <option value="completa">Factura completa</option>
            </select>

            {esRangoPersonalizado && (
              <>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="fecha_desde_externo">
                    Desde
                  </label>
                  <input
                    id="fecha_desde_externo"
                    type="date"
                    value={fechaDesde}
                    onChange={(event) => setFechaDesde(event.target.value)}
                    className={`max-w-40 ${CAMPO_CLASES}`}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500 dark:text-slate-400" htmlFor="fecha_hasta_externo">
                    Hasta
                  </label>
                  <input
                    id="fecha_hasta_externo"
                    type="date"
                    value={fechaHasta}
                    onChange={(event) => setFechaHasta(event.target.value)}
                    className={`max-w-40 ${CAMPO_CLASES}`}
                  />
                </div>
              </>
            )}

            {filtrosActivos > 0 && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {loading ? (
        <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : gastos.length === 0 ? (
        <p className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-slate-400 dark:text-slate-500">
          No hay gastos externos que coincidan con la búsqueda.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {gastos.map((gasto) => (
              <GastoExternoCard key={gasto.id} gasto={gasto} onEditar={setGastoEditar} onEliminar={eliminar} />
            ))}
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

      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Registrar gasto externo" maxWidth="max-w-xl">
        <FormGastoExterno onGuardado={handleCreado} onCancelar={() => setModalCrear(false)} />
      </Modal>

      <Modal open={Boolean(gastoEditar)} onClose={() => setGastoEditar(null)} title="Editar gasto externo" maxWidth="max-w-xl">
        {gastoEditar && (
          <FormGastoExterno gasto={gastoEditar} onGuardado={handleEditado} onCancelar={() => setGastoEditar(null)} />
        )}
      </Modal>
    </div>
  );
}
