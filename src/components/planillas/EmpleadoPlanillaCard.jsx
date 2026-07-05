import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import SeccionComprasTienda from './SeccionComprasTienda';
import SeccionLlegadasTarde from './SeccionLlegadasTarde';
import SeccionPrestamo from './SeccionPrestamo';
import ModalComprobante from './ModalComprobante';
import { IconEngranaje, IconImprimir } from '../icons';
import { formatearMoneda } from '../../utils/moneda';

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

export default function EmpleadoPlanillaCard({ planilla, detalle, editable, onActualizado }) {
  const [diasLaborados, setDiasLaborados] = useState(String(detalle.dias_laborados));
  const [horasCantidad, setHorasCantidad] = useState(String(detalle.horas_extras_cantidad));
  const [bonificaciones, setBonificaciones] = useState(String(detalle.bonificaciones));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [modalMultiplicador, setModalMultiplicador] = useState(false);
  const [modalComprobante, setModalComprobante] = useState(false);

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

  return (
    <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {detalle.empleado?.nombre} {detalle.empleado?.apellido}
        </h3>
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

      <SeccionComprasTienda
        planillaId={planilla.id}
        detalle={detalle}
        editable={editable}
        onDetalleActualizado={onActualizado}
        tipo="compra_credito"
        titulo="Compras a crédito"
        requiereMotivo={false}
        textoVacio="Sin compras a crédito registradas."
      />

      <SeccionComprasTienda
        planillaId={planilla.id}
        detalle={detalle}
        editable={editable}
        onDetalleActualizado={onActualizado}
        tipo="cobro_adicional"
        titulo="Cobros adicionales"
        requiereMotivo
        textoVacio="Sin cobros adicionales registrados."
      />

      <SeccionLlegadasTarde
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

      <div className="mt-3 border-t-[0.5px] border-[var(--border)] pt-3">
        <button
          type="button"
          onClick={() => setModalComprobante(true)}
          className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <IconImprimir className="h-3.5 w-3.5" />
          Ver / imprimir comprobante
        </button>
      </div>

      <ModalComprobante
        open={modalComprobante}
        onClose={() => setModalComprobante(false)}
        planilla={planilla}
        detalle={detalle}
      />
    </div>
  );
}
