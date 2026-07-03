import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../Modal';

export default function ModalEmpleados({ open, onClose, cierre, empleados, editable, onGuardado }) {
  const [pendiente, setPendiente] = useState(null);
  const [error, setError] = useState('');

  const idsEnTurno = new Set((cierre.empleados_turno ?? []).map((e) => e.id));

  async function toggle(empleado) {
    setError('');
    setPendiente(empleado.id);

    try {
      if (idsEnTurno.has(empleado.id)) {
        await api.delete(`/cierres-caja/${cierre.id}/empleados/${empleado.id}`);
      } else {
        await api.post(`/cierres-caja/${cierre.id}/empleados`, { empleado_id: empleado.id });
      }
      await onGuardado();
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setPendiente(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Empleados en turno">
      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {empleados.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">No hay empleados activos.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {empleados.map((empleado) => (
            <li key={empleado.id}>
              <label className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                <input
                  type="checkbox"
                  disabled={!editable || pendiente === empleado.id}
                  checked={idsEnTurno.has(empleado.id)}
                  onChange={() => toggle(empleado)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                />
                {empleado.nombre} {empleado.apellido}
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
