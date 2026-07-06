import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Modal from '../../components/Modal';
import StatTile from '../../components/common/StatTile';
import { ESTADO_CIERRE_ESTILOS, ESTADO_CIERRE_ETIQUETAS } from '../caja/CierresCajaListado';
import { formatearFechaLarga, formatearMoneda, NOMBRES_MESES } from '../../utils/moneda';

const HOY = new Date();
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function claseDiferencia(valor) {
  if (valor === 0) return 'text-emerald-600 dark:text-emerald-400';
  return valor < 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';
}

function ModalDia({ fecha, onClose }) {
  const navigate = useNavigate();
  const [cierres, setCierres] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fecha) return;

    setCierres(null);
    setError('');

    api
      .get('/dashboard/dia', { params: { fecha } })
      .then(({ data }) => setCierres(data))
      .catch(() => setError('No se pudo cargar el detalle del día.'));
  }, [fecha]);

  return (
    <Modal open={Boolean(fecha)} onClose={onClose} title={fecha ? formatearFechaLarga(fecha) : ''} maxWidth="max-w-2xl">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : !cierres ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : cierres.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">No hay cierres registrados este día.</p>
      ) : (
        <div className="space-y-3">
          {cierres.map((cierre) => (
            <button
              key={cierre.id}
              type="button"
              onClick={() => navigate(`/caja/${cierre.id}`)}
              className="w-full rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-1)] p-3 text-left transition hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                  Turno {cierre.turno} · <span className="font-normal">{cierre.cajero?.name}</span>
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CIERRE_ESTILOS[cierre.estado] ?? ''}`}
                >
                  {ESTADO_CIERRE_ETIQUETAS[cierre.estado] ?? cierre.estado}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Ingresos</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(cierre.total_ingreso)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Venta total</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(cierre.total_venta)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Gastos ({cierre.gastos?.length ?? 0})</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(cierre.total_gastos)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Vales ({cierre.vales?.length ?? 0})</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(cierre.total_vales)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Diferencia</dt>
                  <dd className={`font-semibold ${claseDiferencia(Number(cierre.diferencia))}`}>
                    {formatearMoneda(cierre.diferencia)}
                  </dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function Dashboard() {
  const [anio, setAnio] = useState(HOY.getFullYear());
  const [mes, setMes] = useState(HOY.getMonth() + 1);
  const [dias, setDias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');

    api
      .get('/dashboard/resumen-mensual', { params: { anio, mes } })
      .then(({ data }) => setDias(data))
      .catch(() => setError('No se pudo cargar el resumen del mes.'))
      .finally(() => setLoading(false));
  }, [anio, mes]);

  function cambiarMes(delta) {
    const fecha = new Date(anio, mes - 1 + delta, 1);
    setAnio(fecha.getFullYear());
    setMes(fecha.getMonth() + 1);
  }

  const totalIngresos = dias.reduce((acumulado, dia) => acumulado + dia.total_ingreso, 0);
  const totalGastos = dias.reduce((acumulado, dia) => acumulado + dia.total_gastos, 0);
  const totalDiferencia = Math.round(dias.reduce((acumulado, dia) => acumulado + dia.diferencia, 0) * 100) / 100;
  const diasConCierres = dias.filter((dia) => dia.tiene_cierres).length;

  // Desfase del primer día del mes para una semana que arranca en lunes.
  const offset = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
            className="rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ‹
          </button>
          <span className="min-w-36 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
            {NOMBRES_MESES[mes]} {anio}
          </span>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
            className="rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ›
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Ingresos del mes" valor={formatearMoneda(totalIngresos)} />
        <StatTile label="Gastos de caja" valor={formatearMoneda(totalGastos)} />
        <StatTile
          label="Diferencia acumulada"
          valor={formatearMoneda(totalDiferencia)}
          detalle={totalDiferencia === 0 ? 'Todo cuadra' : totalDiferencia < 0 ? 'Faltante' : 'Sobrante'}
          className={claseDiferencia(totalDiferencia)}
        />
        <StatTile label="Días con actividad" valor={diasConCierres} detalle={`de ${dias.length} días`} />
      </div>

      <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-3">
        {loading ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : (
          <>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map((dia) => (
                <p key={dia} className="px-1 py-1 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  {dia}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, indice) => (
                <div key={`vacio-${indice}`} />
              ))}

              {dias.map((dia) => {
                const numero = Number(dia.fecha.slice(8, 10));

                return (
                  <button
                    key={dia.fecha}
                    type="button"
                    onClick={() => setDiaSeleccionado(dia.fecha)}
                    disabled={!dia.tiene_cierres}
                    className={`flex min-h-16 flex-col rounded-lg border-[0.5px] p-1.5 text-left transition sm:min-h-20 ${
                      dia.tiene_cierres
                        ? 'border-[var(--border)] bg-[var(--surface-1)] hover:shadow-md'
                        : 'border-transparent'
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        dia.tiene_cierres
                          ? 'font-semibold text-slate-700 dark:text-slate-200'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {numero}
                    </span>

                    {dia.tiene_cierres && (
                      <span className="mt-auto space-y-0.5">
                        <span className="block truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100 sm:text-xs">
                          {formatearMoneda(dia.total_ingreso)}
                        </span>
                        <span className="hidden truncate text-[11px] text-slate-500 sm:block dark:text-slate-400">
                          Venta {formatearMoneda(dia.total_venta)}
                        </span>
                        {dia.total_gastos > 0 && (
                          <span className="hidden truncate text-[11px] text-slate-500 sm:block dark:text-slate-400">
                            Gastos {formatearMoneda(dia.total_gastos)}
                          </span>
                        )}
                        {dia.diferencia !== 0 && (
                          <span className={`block truncate text-[11px] font-medium ${claseDiferencia(dia.diferencia)}`}>
                            {dia.diferencia < 0 ? 'Faltante' : 'Sobrante'} {formatearMoneda(Math.abs(dia.diferencia))}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ModalDia fecha={diaSeleccionado} onClose={() => setDiaSeleccionado(null)} />
    </div>
  );
}
