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
import StatTile from '../../components/common/StatTile';
import { Skeleton } from '../../components/common/Skeleton';
import { formatearMoneda } from '../../utils/moneda';

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
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

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
