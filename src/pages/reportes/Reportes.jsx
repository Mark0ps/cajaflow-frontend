import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../../components/Modal';
import StatTile from '../../components/common/StatTile';
import { Skeleton } from '../../components/common/Skeleton';
import { IconDescargar } from '../../components/icons';
import { formatearMoneda } from '../../utils/moneda';

const CATEGORIAS_PDF = [
  { value: 'gasto_operativo', label: 'Gasto operativo' },
  { value: 'pago_tarjeta_credito', label: 'Pago de tarjeta de crédito' },
  { value: 'servicios_publicos', label: 'Servicios públicos / Gastos fijos' },
];

const FACTURA_NOMINAL_PDF = [
  { value: 'con', label: 'Con factura nominal' },
  { value: 'sin', label: 'Sin factura nominal' },
];

const HOY = new Date();

const INPUT_CLASES =
  'rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:text-slate-100 dark:focus:border-slate-400';

// Paleta categórica validada (CVD y contraste) — definida en index.css,
// con su variante de dark mode. Orden fijo: nunca ciclar.
const SERIE_1 = 'var(--chart-1)';
const SERIE_2 = 'var(--chart-2)';
const SERIE_3 = 'var(--chart-3)';
const COLORES_METODO = [SERIE_1, SERIE_2, SERIE_3];

function primerDiaDelMes() {
  return `${HOY.getFullYear()}-${String(HOY.getMonth() + 1).padStart(2, '0')}-01`;
}

function hoyIso() {
  const offsetMs = HOY.getTimezoneOffset() * 60000;
  return new Date(HOY - offsetMs).toISOString().slice(0, 10);
}

function abreviarMonto(valor) {
  if (Math.abs(valor) >= 1000) return `${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}k`;
  return String(valor);
}

function TooltipCaja({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
          {item.name}: <span className="font-semibold">{formatearMoneda(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Grafico({ titulo, cargando, sinDatos, children }) {
  return (
    <section className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{titulo}</h2>
      {cargando ? (
        <div className="py-4">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : sinDatos ? (
        <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Sin datos en el período seleccionado.</p>
      ) : (
        children
      )}
    </section>
  );
}

const EJE = { fontSize: 11, fill: 'var(--chart-ink)' };

export default function Reportes() {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoyIso());
  const [agrupacion, setAgrupacion] = useState('diario');
  const [facturaNominal, setFacturaNominal] = useState('');
  const [categoria, setCategoria] = useState('');

  const [periodo, setPeriodo] = useState([]);
  const [metodoPago, setMetodoPago] = useState(null);
  const [balance, setBalance] = useState(null);
  const [vales, setVales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categoriasPdf, setCategoriasPdf] = useState(CATEGORIAS_PDF.map((item) => item.value));
  const [facturaNominalPdf, setFacturaNominalPdf] = useState(FACTURA_NOMINAL_PDF.map((item) => item.value));
  const [exportando, setExportando] = useState(false);
  const [errorPdf, setErrorPdf] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfNombre, setPreviewPdfNombre] = useState('');

  function alternarCategoriaPdf(valor) {
    setCategoriasPdf((prev) => (prev.includes(valor) ? prev.filter((item) => item !== valor) : [...prev, valor]));
  }

  function alternarFacturaNominalPdf(valor) {
    setFacturaNominalPdf((prev) => (prev.includes(valor) ? prev.filter((item) => item !== valor) : [...prev, valor]));
  }

  async function exportarPdf() {
    setErrorPdf('');

    if (categoriasPdf.length === 0) {
      setErrorPdf('Selecciona al menos una categoría para exportar.');
      return;
    }

    setExportando(true);

    try {
      const { data } = await api.get('/reportes/gastos-externos/pdf', {
        params: { desde, hasta, categoria: categoriasPdf, factura_nominal: facturaNominalPdf },
        responseType: 'blob',
      });

      // Solo se genera la vista previa aquí — la descarga real queda a
      // decisión del usuario desde el modal, no automática.
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
      setPreviewPdfNombre(`reporte-gastos-externos-${desde}-a-${hasta}.pdf`);
    } catch (err) {
      // La respuesta de error también llega como blob por el responseType;
      // hay que leerla como texto/JSON antes de poder mostrar el mensaje.
      if (err.response?.data instanceof Blob) {
        try {
          const texto = await err.response.data.text();
          err.response.data = JSON.parse(texto);
        } catch {
          // deja el blob tal cual si no se pudo parsear
        }
      }
      setErrorPdf(extraerMensajeError(err));
    } finally {
      setExportando(false);
    }
  }

  function cerrarPreviewPdf() {
    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    setPreviewPdfUrl(null);
    setPreviewPdfNombre('');
  }

  function descargarPreviewPdf() {
    if (!previewPdfUrl) return;
    const enlace = document.createElement('a');
    enlace.href = previewPdfUrl;
    enlace.download = previewPdfNombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  }

  useEffect(() => {
    return () => {
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    };
    // Solo se limpia al desmontar el componente, no en cada cambio de previewPdfUrl.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!desde || !hasta || desde > hasta) return;

    setLoading(true);
    setError('');

    const params = { desde, hasta };

    Promise.all([
      api.get('/reportes/periodo', { params: { ...params, agrupacion } }),
      api.get('/reportes/metodo-pago', { params }),
      api.get('/reportes/gastos-vs-ingresos', {
        params: {
          ...params,
          ...(facturaNominal ? { factura_nominal: facturaNominal } : {}),
          ...(categoria ? { categoria } : {}),
        },
      }),
      api.get('/reportes/vales-por-empleado', { params }),
    ])
      .then(([resPeriodo, resMetodo, resBalance, resVales]) => {
        setPeriodo(resPeriodo.data);
        setMetodoPago(resMetodo.data);
        setBalance(resBalance.data);
        setVales(resVales.data);
      })
      .catch(() => setError('No se pudieron cargar los reportes.'))
      .finally(() => setLoading(false));
  }, [desde, hasta, agrupacion, facturaNominal, categoria]);

  const datosMetodo = metodoPago
    ? [
        { metodo: 'Efectivo', valor: metodoPago.efectivo },
        { metodo: 'Tarjeta', valor: metodoPago.tarjeta },
        { metodo: 'Transferencia', valor: metodoPago.transferencia },
      ]
    : [];
  const metodoVacio = datosMetodo.every((item) => item.valor === 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reportes</h1>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="reporte_desde">
              Desde
            </label>
            <input
              id="reporte_desde"
              type="date"
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
              className={INPUT_CLASES}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="reporte_hasta">
              Hasta
            </label>
            <input
              id="reporte_hasta"
              type="date"
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
              className={INPUT_CLASES}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="reporte_agrupacion">
              Agrupación
            </label>
            <select
              id="reporte_agrupacion"
              value={agrupacion}
              onChange={(event) => setAgrupacion(event.target.value)}
              className={INPUT_CLASES}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="reporte_factura_nominal">
              Gastos con proveedor
            </label>
            <select
              id="reporte_factura_nominal"
              value={facturaNominal}
              onChange={(event) => setFacturaNominal(event.target.value)}
              className={INPUT_CLASES}
            >
              <option value="">Todos</option>
              <option value="con">Con factura nominal</option>
              <option value="sin">Sin factura nominal</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="reporte_categoria">
              Categoría de gasto
            </label>
            <select
              id="reporte_categoria"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className={INPUT_CLASES}
            >
              <option value="">Todas</option>
              <option value="gasto_operativo">Gasto operativo</option>
              <option value="pago_tarjeta_credito">Pago de tarjeta de crédito</option>
              <option value="servicios_publicos">Servicios públicos / Gastos fijos</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="mb-4 rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Exportar reporte de gastos externos a PDF</h2>

        <div className="flex flex-wrap items-start gap-6">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Categoría</p>
            <div className="flex flex-col gap-1">
              {CATEGORIAS_PDF.map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={categoriasPdf.includes(item.value)}
                    onChange={() => alternarCategoriaPdf(item.value)}
                    className="h-3.5 w-3.5 rounded border-[var(--border)]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">Factura nominal</p>
            <div className="flex flex-col gap-1">
              {FACTURA_NOMINAL_PDF.map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={facturaNominalPdf.includes(item.value)}
                    onChange={() => alternarFacturaNominalPdf(item.value)}
                    className="h-3.5 w-3.5 rounded border-[var(--border)]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="ml-auto self-end">
            <button
              type="button"
              onClick={exportarPdf}
              disabled={exportando}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <IconDescargar className="h-4 w-4" />
              {exportando ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>

        {errorPdf && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">{errorPdf}</p>
        )}
      </div>

      <Modal open={!!previewPdfUrl} onClose={cerrarPreviewPdf} title="Vista previa del reporte" maxWidth="max-w-4xl">
        <div className="mb-4 h-[75vh] overflow-hidden rounded-lg border-[0.5px] border-[var(--border)]">
          {previewPdfUrl && (
            <iframe src={previewPdfUrl} title="Vista previa del PDF" className="h-full w-full" />
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cerrarPreviewPdf}
            className="rounded-lg border-[0.5px] border-[var(--border)] px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={descargarPreviewPdf}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <IconDescargar className="h-4 w-4" />
            Descargar
          </button>
        </div>
      </Modal>



      {/*Tarjetas con info*/}    
      {balance && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Ingresos del período" valor={formatearMoneda(balance.total_ingresos)} />
          <StatTile
            label="Gastos de caja"
            valor={formatearMoneda(balance.total_gastos_caja)}
            detalle={`+ ${formatearMoneda(balance.total_gastos_externos)} externos`}
          />
          <StatTile label="Gastos totales" valor={formatearMoneda(balance.total_gastos)} />
          <StatTile
            label="Balance"
            valor={formatearMoneda(balance.balance)}
            className={
              balance.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }
          />
          <StatTile label="Pagado en tarjetas de crédito" valor={formatearMoneda(balance.total_pago_tarjeta_credito)} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <Grafico titulo="Ingresos y gastos por período" cargando={loading} sinDatos={periodo.length === 0}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodo} barGap={2} maxBarSize={32}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="periodo" tick={EJE} tickLine={false} axisLine={{ stroke: 'var(--chart-grid)' }} />
                <YAxis tick={EJE} tickLine={false} axisLine={false} tickFormatter={abreviarMonto} width={44} />
                <Tooltip content={<TooltipCaja />} cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.35 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(valor) => <span className="text-xs text-slate-600 dark:text-slate-300">{valor}</span>}
                />
                <Bar dataKey="total_ingreso" name="Ingresos" fill={SERIE_1} radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_gastos" name="Gastos" fill={SERIE_2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Grafico>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Grafico titulo="Venta por método de pago" cargando={loading} sinDatos={metodoVacio}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosMetodo} layout="vertical" barSize={24} margin={{ right: 64 }}>
                  <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                  <XAxis type="number" tick={EJE} tickLine={false} axisLine={false} tickFormatter={abreviarMonto} />
                  <YAxis type="category" dataKey="metodo" tick={EJE} tickLine={false} axisLine={false} width={92} />
                  <Tooltip content={<TooltipCaja />} cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.35 }} />
                  <Bar dataKey="valor" name="Venta" radius={[0, 4, 4, 0]}>
                    {datosMetodo.map((item, indice) => (
                      <Cell key={item.metodo} fill={COLORES_METODO[indice]} />
                    ))}
                    <LabelList
                      dataKey="valor"
                      position="right"
                      formatter={(valor) => formatearMoneda(valor)}
                      fill="var(--chart-ink)"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Grafico>

          <Grafico titulo="Vales por empleado" cargando={loading} sinDatos={vales.length === 0}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vales} layout="vertical" barSize={20} margin={{ right: 64 }}>
                  <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
                  <XAxis type="number" tick={EJE} tickLine={false} axisLine={false} tickFormatter={abreviarMonto} />
                  <YAxis type="category" dataKey="empleado" tick={EJE} tickLine={false} axisLine={false} width={130} />
                  <Tooltip content={<TooltipCaja />} cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.35 }} />
                  <Bar dataKey="total_vales" name="Vales" fill={SERIE_1} radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="total_vales"
                      position="right"
                      formatter={(valor) => formatearMoneda(valor)}
                      fill="var(--chart-ink)"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Grafico>
        </div>
      </div>
    </div>
  );
}
