import { useEffect, useState } from 'react';
import api from '../../api/axios';
import SeccionIngresos from './SeccionIngresos';
import SeccionGastos from './SeccionGastos';
import SeccionVales from './SeccionVales';
import ResumenCierre from './ResumenCierre';
import ModalEmpleados from './ModalEmpleados';
import { IconUsuarios } from '../icons';
import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

const TURNOS = {
  matutino: 'matutino',
  tarde: 'tarde',
  nocturno: 'nocturno',
};

export default function PanelTrabajo({ cierre, onGuardado, onReiniciar }) {
  const [empleados, setEmpleados] = useState([]);
  const [modalEmpleadosAbierto, setModalEmpleadosAbierto] = useState(false);

  useEffect(() => {
    api
      .get('/empleados', { params: { cargo: 'cajero_barista,cocinero' } })
      .then(({ data }) => setEmpleados(data))
      .catch(() => setEmpleados([]));
  }, []);

  const editable = cierre.estado === 'abierto';
  const empleadosEnTurno = cierre.empleados_turno ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Mi caja — {formatearFechaLarga(cierre.fecha)}
            </h1>
            <span
              className={
                editable
                  ? 'rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }
            >
              {editable ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Turno {TURNOS[cierre.turno] ?? cierre.turno} · {cierre.cajero?.name} · Monto de apertura:{' '}
            {formatearMoneda(cierre.monto_inicial)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalEmpleadosAbierto(true)}
            className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <IconUsuarios className="h-4 w-4" />
            Empleados en turno ({empleadosEnTurno.length})
          </button>

          {!editable && (
            <button
              type="button"
              onClick={onReiniciar}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Abrir nuevo turno
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-4">
          <SeccionIngresos cierre={cierre} editable={editable} onGuardado={onGuardado} />
          <SeccionGastos cierre={cierre} editable={editable} onGuardado={onGuardado} />
          <SeccionVales cierre={cierre} empleados={empleados} editable={editable} onGuardado={onGuardado} />
        </div>

        <div className="lg:sticky lg:top-4">
          <ResumenCierre cierre={cierre} editable={editable} onGuardado={onGuardado} />
        </div>
      </div>

      <ModalEmpleados
        open={modalEmpleadosAbierto}
        onClose={() => setModalEmpleadosAbierto(false)}
        cierre={cierre}
        empleados={empleados}
        editable={editable}
        onGuardado={onGuardado}
      />
    </div>
  );
}
