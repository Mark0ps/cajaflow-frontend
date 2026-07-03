import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import SeccionCobrosAdicionales from './SeccionCobrosAdicionales';
import { formatearMoneda } from '../../utils/moneda';

function redondear(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

export default function EmpleadoPlanillaCard({ planillaId, detalle, editable, onActualizado }) {
  const [diasLaborados, setDiasLaborados] = useState(String(detalle.dias_laborados));
  const [horasCantidad, setHorasCantidad] = useState(String(detalle.horas_extras_cantidad));
  const [multiplicador, setMultiplicador] = useState('1.5');
  const [valorHoraExtra, setValorHoraExtra] = useState(
    Number(detalle.valor_hora_extra) > 0 ? String(detalle.valor_hora_extra) : ''
  );
  const [bonificaciones, setBonificaciones] = useState(String(detalle.bonificaciones));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const tarifaSugerida = redondear((Number(detalle.sueldo_diario) / 8) * (Number(multiplicador) || 0));

  async function guardarCampo(campo, valorCrudo, valorOriginal) {
    if (valorCrudo.trim() === '') return;

    const valorNumerico = Number(valorCrudo);
    if (Number.isNaN(valorNumerico) || valorNumerico === Number(valorOriginal)) return;

    setError('');
    setGuardando(true);

    try {
      const { data } = await api.patch(`/planillas/${planillaId}/detalles/${detalle.id}`, {
        [campo]: valorNumerico,
      });
      onActualizado(data.detalle);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  function usarTarifaSugerida() {
    const valor = String(tarifaSugerida);
    setValorHoraExtra(valor);
    guardarCampo('valor_hora_extra', valor, detalle.valor_hora_extra);
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
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`dias_${detalle.id}`}>
                Días laborados
              </label>
              <NumberInput
                id={`dias_${detalle.id}`}
                min="0"
                max="31"
                step="1"
                value={diasLaborados}
                onChange={(event) => setDiasLaborados(event.target.value)}
                onBlur={() => guardarCampo('dias_laborados', diasLaborados, detalle.dias_laborados)}
                disabled={guardando}
                className="px-2 py-1.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`horas_${detalle.id}`}>
                Horas extra
              </label>
              <NumberInput
                id={`horas_${detalle.id}`}
                min="0"
                step="0.5"
                value={horasCantidad}
                onChange={(event) => setHorasCantidad(event.target.value)}
                onBlur={() => guardarCampo('horas_extras_cantidad', horasCantidad, detalle.horas_extras_cantidad)}
                disabled={guardando}
                className="px-2 py-1.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`multiplicador_${detalle.id}`}>
                Multiplicador
              </label>
              <NumberInput
                id={`multiplicador_${detalle.id}`}
                min="0"
                step="0.1"
                value={multiplicador}
                onChange={(event) => setMultiplicador(event.target.value)}
                disabled={guardando}
                className="px-2 py-1.5"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`bonif_${detalle.id}`}>
                Bonificaciones
              </label>
              <NumberInput
                id={`bonif_${detalle.id}`}
                min="0"
                step="0.01"
                value={bonificaciones}
                onChange={(event) => setBonificaciones(event.target.value)}
                onBlur={() => guardarCampo('bonificaciones', bonificaciones, detalle.bonificaciones)}
                disabled={guardando}
                className="px-2 py-1.5"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor={`valor_hora_${detalle.id}`}>
                Valor por hora extra
              </label>
              <NumberInput
                id={`valor_hora_${detalle.id}`}
                min="0"
                step="0.01"
                placeholder={String(tarifaSugerida)}
                value={valorHoraExtra}
                onChange={(event) => setValorHoraExtra(event.target.value)}
                onBlur={() => guardarCampo('valor_hora_extra', valorHoraExtra, detalle.valor_hora_extra)}
                disabled={guardando}
                className="px-2 py-1.5"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tarifa sugerida ({multiplicador || 0}×): {' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatearMoneda(tarifaSugerida)}</span>
              {valorHoraExtra === '' && (
                <button
                  type="button"
                  onClick={usarTarifaSugerida}
                  className="ml-2 underline decoration-dotted hover:text-slate-800 dark:hover:text-slate-100"
                >
                  Usar sugerida
                </button>
              )}
            </p>

            <p className="ml-auto text-sm font-semibold text-slate-700 dark:text-slate-200">
              = {formatearMoneda(detalle.horas_extras_valor)}
            </p>
          </div>
        </>
      )}

      <SeccionCobrosAdicionales
        planillaId={planillaId}
        detalle={detalle}
        editable={editable}
        onDetalleActualizado={onActualizado}
      />
    </div>
  );
}
