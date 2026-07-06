import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import Modal from '../../components/Modal';
import FormEmpleado from '../../components/empleados/FormEmpleado';
import EstadoCuentaTab from '../../components/empleados/EstadoCuentaTab';
import PrestamosTab from '../../components/empleados/PrestamosTab';
import ValesTab from '../../components/empleados/ValesTab';
import { formatearMoneda } from '../../utils/moneda';

const TABS = [
  { id: 'estado-cuenta', label: 'Estado de cuenta' },
  { id: 'prestamos', label: 'Préstamos' },
  { id: 'vales', label: 'Vales' },
];

export default function EmpleadoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('estado-cuenta');
  const [modalEditar, setModalEditar] = useState(false);

  useEffect(() => {
    api
      .get(`/empleados/${id}`)
      .then(({ data }) => setEmpleado(data))
      .catch(() => setError('No se pudo cargar el empleado.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function eliminar() {
    if (!window.confirm(`¿Eliminar a ${empleado.nombre} ${empleado.apellido}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/empleados/${id}`);
      navigate('/empleados', { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</p>;
  }

  if (error || !empleado) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {empleado.nombre} {empleado.apellido}
              </h1>
              {!empleado.activo && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Inactivo
                </span>
              )}
            </div>
            <p className="text-sm capitalize text-slate-500 dark:text-slate-400">
              {empleado.cargo?.replaceAll('_', ' ')} · Sueldo quincenal: {formatearMoneda(empleado.sueldo_quincenal)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalEditar(true)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={eliminar}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Eliminar
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
        )}
      </div>

      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar empleado" maxWidth="max-w-xl">
        <FormEmpleado
          empleado={empleado}
          onGuardado={(actualizado) => {
            setEmpleado(actualizado);
            setModalEditar(false);
          }}
          onCancelar={() => setModalEditar(false)}
        />
      </Modal>

      <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'border-slate-800 text-slate-900 dark:border-slate-300 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'estado-cuenta' && <EstadoCuentaTab empleadoId={empleado.id} />}
      {tab === 'prestamos' && <PrestamosTab empleadoId={empleado.id} />}
      {tab === 'vales' && <ValesTab empleadoId={empleado.id} />}
    </div>
  );
}
