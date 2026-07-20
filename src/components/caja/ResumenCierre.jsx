import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import { useAuth } from '../../context/AuthContext';
import { formatearMoneda } from '../../utils/moneda';
import ModalCierreExitoso from './ModalCierreExitoso';

function FilaDesglose({ operador, label, valor, resaltado, className = '' }) {
  return (
    <div className={`flex items-baseline justify-between py-1.5 ${className}`}>
      <dt className="flex gap-2">
        <span className="w-3 shrink-0 text-slate-400 dark:text-slate-500">{operador ?? ''}</span>
        <span
          className={
            resaltado
              ? 'font-medium text-slate-700 dark:text-slate-200'
              : 'text-slate-500 dark:text-slate-400'
          }
        >
          {label}
        </span>
      </dt>
      <dd
        className={
          resaltado
            ? 'font-semibold text-slate-800 dark:text-slate-100'
            : 'text-slate-700 dark:text-slate-300'
        }
      >
        {formatearMoneda(valor)}
      </dd>
    </div>
  );
}

export default function ResumenCierre({ cierre, editable, onGuardado }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [cerrando, setCerrando] = useState(false);
  const [cierreCerrado, setCierreCerrado] = useState(null);

  const efectivo = Number(cierre.efectivo ?? 0);
  const totalGastos = Number(cierre.total_gastos ?? 0);
  const totalVales = Number(cierre.total_vales ?? 0);
  const totalSalidas = Number(cierre.total_salidas ?? 0);
  const totalEntradas = Number(cierre.total_entradas ?? 0);
  const tarjeta = Number(cierre.tarjeta_credito ?? 0);
  const transferencia = Number(cierre.transferencia ?? 0);
  const diferencia = Number(cierre.diferencia ?? 0);

  const ventaEfectivoReconstruida = efectivo + totalGastos + totalVales + totalSalidas - totalEntradas;
  const totalVentaSegunCaja = ventaEfectivoReconstruida + tarjeta + transferencia;

  const diferenciaEstilo =
    diferencia === 0
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : diferencia < 0
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300';

  const diferenciaEtiqueta = diferencia === 0 ? '(cuadra)' : diferencia < 0 ? '(faltante)' : '(sobrante)';

  async function handleCerrar() {
    if (!window.confirm('¿Cerrar este turno? Ya no podrás editar ingresos, gastos ni vales.')) {
      return;
    }

    setError('');
    setCerrando(true);

    try {
      await api.post(`/cierres-caja/${cierre.id}/cerrar`);
      const actualizado = await onGuardado();
      setCierreCerrado(actualizado ?? { ...cierre, estado: 'cerrado' });
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setCerrando(false);
    }
  }

  // Solo admin/secretaria tienen acceso a /caja/:id (ver ProtectedRoute) —
  // un cajero ya está viendo el detalle completo en esta misma pantalla
  // (PanelTrabajo queda en modo solo-lectura apenas el cierre se cierra).
  const puedeVerDetalle = user?.role === 'admin' || user?.role === 'secretaria';

  function handleVerDetalle() {
    if (puedeVerDetalle && cierreCerrado) {
      navigate(`/caja/${cierreCerrado.id}`);
    }
    setCierreCerrado(null);
  }

  function handleVolverInicio() {
    setCierreCerrado(null);
    navigate('/');
  }

  return (
    <section className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Resumen del cierre</h2>

      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <dl className="mb-4 text-sm">
        <FilaDesglose label="Efectivo en caja" valor={efectivo} />
        <FilaDesglose operador="+" label="Gastos" valor={totalGastos} />
        <FilaDesglose operador="+" label="Vales" valor={totalVales} />
        <FilaDesglose operador="+" label="Salidas" valor={totalSalidas} />
        <FilaDesglose operador="-" label="Entradas" valor={totalEntradas} />
        <FilaDesglose
          operador="="
          label="Venta efectivo"
          valor={ventaEfectivoReconstruida}
          resaltado
          className="mt-1 border-t border-slate-200 pt-2 dark:border-slate-700"
        />

        <FilaDesglose operador="+" label="Tarjeta" valor={tarjeta} className="mt-2" />
        <FilaDesglose operador="+" label="Transferencia" valor={transferencia} />
        <FilaDesglose
          operador="="
          label="Total según caja"
          valor={totalVentaSegunCaja}
          resaltado
          className="mt-1 border-t border-slate-200 pt-2 dark:border-slate-700"
        />

        <FilaDesglose
          label="Venta según A2 Food"
          valor={cierre.venta_sistema_a2}
          className="mt-2"
        />
      </dl>

      <div className={`mb-4 flex items-center justify-between rounded-lg border px-3 py-2 ${diferenciaEstilo}`}>
        <span className="text-sm font-medium">Diferencia</span>
        <span className="text-base font-bold">
          {formatearMoneda(diferencia)} <span className="font-medium">{diferenciaEtiqueta}</span>
        </span>
      </div>

      {editable ? (
        <button
          type="button"
          onClick={handleCerrar}
          disabled={cerrando}
          className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {cerrando ? 'Cerrando...' : 'Cerrar turno'}
        </button>
      ) : (
        <p className="rounded bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Turno {cierre.estado === 'revisado_secretaria' ? 'revisado' : cierre.estado}
        </p>
      )}

      <ModalCierreExitoso
        open={cierreCerrado !== null}
        cierre={cierreCerrado}
        onVerDetalle={handleVerDetalle}
        onVolverInicio={handleVolverInicio}
        onClose={() => setCierreCerrado(null)}
      />
    </section>
  );
}
