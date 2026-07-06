import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import SeccionDeducciones from './SeccionDeducciones';
import SeccionPrestamo from './SeccionPrestamo';
import ModalComprobante from './ModalComprobante';
import ModalRegistrarPago from './ModalRegistrarPago';
import { IconEngranaje, IconImprimir, IconActualizar, IconMoneda, IconMasOpciones } from '../icons';
import { formatearMoneda } from '../../utils/moneda';

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

function iniciales(nombre, apellido) {
  return `${nombre?.charAt(0) ?? ''}${apellido?.charAt(0) ?? ''}`.toUpperCase();
}

export const ESTADO_PAGO_ESTILOS = {
  pendiente: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  parcial: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  pagado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export const ESTADO_PAGO_ETIQUETAS = { pendiente: 'Pendiente', parcial: 'Parcial', pagado: 'Pagado' };

export default function EmpleadoPlanillaCard({ planilla, detalle, editable, onActualizado }) {
  const [diasLaborados, setDiasLaborados] = useState(String(detalle.dias_laborados));
  const [horasCantidad, setHorasCantidad] = useState(String(detalle.horas_extras_cantidad));
  const [bonificaciones, setBonificaciones] = useState(String(detalle.bonificaciones));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [modalMultiplicador, setModalMultiplicador] = useState(false);
  const [modalComprobante, setModalComprobante] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [actualizandoDeducciones, setActualizandoDeducciones] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickFuera(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const tarifaBase = Number(detalle.sueldo_diario) / 8;
  const [multiplicador, setMultiplicador] = useState(() => {
    if (tarifaBase > 0 && Number(detalle.valor_hora_extra) > 0) {
      return String(redondear(Number(detalle.valor_hora_extra) / tarifaBase));
    }
    return '1.5';
  });

  const tarifaSugerida = redondear(tarifaBase * (Number(multiplicador) || 0));

  async function guardarCampo(payload) {
    setError('');
    setGuardando(true);

    try {
      const { data } = await api.patch(`/planillas/${planilla.id}/detalles/${detalle.id}`, payload);
      onActualizado(data.detalle);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  function guardarDias() {
    const valorNumerico = Number(diasLaborados);
    if (diasLaborados.trim() === '' || Number.isNaN(valorNumerico) || valorNumerico === Number(detalle.dias_laborados)) return;
    guardarCampo({ dias_laborados: valorNumerico });
  }

  function guardarBonificaciones() {
    const valorNumerico = Number(bonificaciones);
    if (bonificaciones.trim() === '' || Number.isNaN(valorNumerico) || valorNumerico === Number(detalle.bonificaciones)) return;
    guardarCampo({ bonificaciones: valorNumerico });
  }

  function guardarHorasExtra(cantidadCruda) {
    const cantidad = Number(cantidadCruda);
    if (cantidadCruda.trim() === '' || Number.isNaN(cantidad)) return;

    const valorHoraExtra = tarifaSugerida;
    const horasExtrasValor = redondear(cantidad * valorHoraExtra);

    if (
      cantidad === Number(detalle.horas_extras_cantidad) &&
      valorHoraExtra === Number(detalle.valor_hora_extra) &&
      horasExtrasValor === Number(detalle.horas_extras_valor)
    ) {
      return;
    }

    guardarCampo({
      horas_extras_cantidad: cantidad,
      valor_hora_extra: valorHoraExtra,
      horas_extras_valor: horasExtrasValor,
    });
  }

  async function actualizarDeducciones() {
    setMenuAbierto(false);
    setError('');
    setActualizandoDeducciones(true);

    try {
      const { data } = await api.post(`/planillas/${planilla.id}/detalles/${detalle.id}/actualizar-deducciones`);
      onActualizado(data.detalle);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setActualizandoDeducciones(false);
    }
  }

  return (
    <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-accent)] text-xs font-bold text-white">
            {iniciales(detalle.empleado?.nombre, detalle.empleado?.apellido)}
          </div>
          <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {detalle.empleado?.nombre} {detalle.empleado?.apellido}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_PAGO_ESTILOS[detalle.estado_pago] ?? ''}`}
        >
          {ESTADO_PAGO_ETIQUETAS[detalle.estado_pago] ?? detalle.estado_pago}
        </span>
      </div>

      <div className="mb-3 flex items-baseline justify-between gap-3 pl-10">
        {detalle.estado_pago !== 'pagado' ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Saldo: {formatearMoneda(detalle.saldo_pendiente)}
          </p>
        ) : (
          <span />
        )}
        <span className="text-base font-bold text-slate-800 dark:text-slate-100">
          {formatearMoneda(detalle.total_a_pagar)}
        </span>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {!editable ? (
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Días laborados</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">{detalle.dias_laborados}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Horas extra</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">
              {detalle.horas_extras_cantidad} hrs · {formatearMoneda(detalle.horas_extras_valor)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Bonificaciones</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(detalle.bonificaciones)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-slate-400">Deducciones</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(detalle.total_deducciones)}</dd>
          </div>
        </dl>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`dias_${detalle.id}`}>
              Días
            </label>
            <NumberInput
              id={`dias_${detalle.id}`}
              min="0"
              max="31"
              step="1"
              value={diasLaborados}
              onChange={(event) => setDiasLaborados(event.target.value)}
              onBlur={guardarDias}
              disabled={guardando}
              className="px-2 py-1.5"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`horas_${detalle.id}`}>
                Horas extra
              </label>
              <button
                type="button"
                onClick={() => setModalMultiplicador((prev) => !prev)}
                aria-label="Editar multiplicador de hora extra"
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <IconEngranaje className="h-3.5 w-3.5" />
              </button>
            </div>
            <NumberInput
              id={`horas_${detalle.id}`}
              min="0"
              step="0.5"
              value={horasCantidad}
              onChange={(event) => setHorasCantidad(event.target.value)}
              onBlur={() => guardarHorasExtra(horasCantidad)}
              disabled={guardando}
              className="px-2 py-1.5"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {multiplicador || 0}× = {formatearMoneda(detalle.horas_extras_valor)}
            </p>

            {modalMultiplicador && (
              <div className="mt-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                <label
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                  htmlFor={`multiplicador_${detalle.id}`}
                >
                  Multiplicador
                </label>
                <NumberInput
                  id={`multiplicador_${detalle.id}`}
                  min="0"
                  step="0.1"
                  value={multiplicador}
                  onChange={(event) => setMultiplicador(event.target.value)}
                  onBlur={() => guardarHorasExtra(horasCantidad)}
                  disabled={guardando}
                  className="px-2 py-1.5"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Tarifa: {formatearMoneda(tarifaSugerida)} /hora
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`bonif_${detalle.id}`}>
              Bonificación
            </label>
            <NumberInput
              id={`bonif_${detalle.id}`}
              min="0"
              step="0.01"
              value={bonificaciones}
              onChange={(event) => setBonificaciones(event.target.value)}
              onBlur={guardarBonificaciones}
              disabled={guardando}
              className="px-2 py-1.5"
            />
          </div>
        </div>
      )}

      <SeccionDeducciones
        planillaId={planilla.id}
        detalle={detalle}
        editable={editable}
        onDetalleActualizado={onActualizado}
      />

      <SeccionPrestamo
        planillaId={planilla.id}
        detalle={detalle}
        editable={editable}
        onDetalleActualizado={onActualizado}
      />

      <div className="mt-3 flex items-center gap-2 border-t-[0.5px] border-[var(--border)] pt-3">
        {detalle.estado_pago !== 'pagado' && (
          <button
            type="button"
            onClick={() => setModalPago(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
          >
            <IconMoneda className="h-3.5 w-3.5" />
            Registrar pago
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Más opciones"
            className="flex items-center rounded-lg border-[0.5px] border-[var(--border)] px-2 py-1.5 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <IconMasOpciones className="h-4 w-4" />
          </button>

          {menuAbierto && (
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--surface-1)] py-1 shadow-lg">
              {editable && (
                <button
                  type="button"
                  onClick={actualizarDeducciones}
                  disabled={actualizandoDeducciones}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <IconActualizar className={`h-3.5 w-3.5 ${actualizandoDeducciones ? 'animate-spin' : ''}`} />
                  {actualizandoDeducciones ? 'Actualizando...' : 'Actualizar deducciones'}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  setModalComprobante(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <IconImprimir className="h-3.5 w-3.5" />
                Ver / imprimir comprobante
              </button>
            </div>
          )}
        </div>
      </div>

      <ModalComprobante
        open={modalComprobante}
        onClose={() => setModalComprobante(false)}
        planilla={planilla}
        detalle={detalle}
      />

      <ModalRegistrarPago
        open={modalPago}
        onClose={() => setModalPago(false)}
        detalle={detalle}
        onRegistrado={onActualizado}
      />
    </div>
  );
}
