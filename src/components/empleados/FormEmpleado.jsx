import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import NumberInput from '../common/NumberInput';
import { fechaLocalHoy } from '../../utils/moneda';

const CARGOS = ['gerente', 'administrador', 'cajero_barista', 'cocinero', 'secretaria', 'seguridad', 'otro'];

const INPUT_CLASES =
  'w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400';

/** Mismo formulario para crear un empleado o editar uno existente (pasar `empleado`). */
export default function FormEmpleado({ empleado, onGuardado, onCancelar }) {
  const editando = Boolean(empleado);

  const [nombre, setNombre] = useState(empleado?.nombre ?? '');
  const [apellido, setApellido] = useState(empleado?.apellido ?? '');
  const [identidad, setIdentidad] = useState(empleado?.identidad ?? '');
  const [cargo, setCargo] = useState(empleado?.cargo ?? 'cocinero');
  const [fechaIngreso, setFechaIngreso] = useState(
    empleado?.fecha_ingreso ? String(empleado.fecha_ingreso).slice(0, 10) : fechaLocalHoy()
  );
  const [sueldoQuincenal, setSueldoQuincenal] = useState(empleado ? String(empleado.sueldo_quincenal) : '');
  const [telefono, setTelefono] = useState(empleado?.telefono ?? '');
  const [direccion, setDireccion] = useState(empleado?.direccion ?? '');
  const [activo, setActivo] = useState(empleado?.activo ?? true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      nombre,
      apellido,
      identidad: identidad.trim() || null,
      cargo,
      fecha_ingreso: fechaIngreso,
      sueldo_quincenal: sueldoQuincenal,
      telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      ...(editando ? { activo } : {}),
    };

    try {
      const { data } = editando
        ? await api.patch(`/empleados/${empleado.id}`, payload)
        : await api.post('/empleados', payload);

      onGuardado(data);
    } catch (err) {
      setError(extraerMensajeError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="nombre_empleado">
            Nombre
          </label>
          <input
            id="nombre_empleado"
            type="text"
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="apellido_empleado">
            Apellido
          </label>
          <input
            id="apellido_empleado"
            type="text"
            required
            value={apellido}
            onChange={(event) => setApellido(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="identidad_empleado">
            Identidad (opcional)
          </label>
          <input
            id="identidad_empleado"
            type="text"
            value={identidad}
            onChange={(event) => setIdentidad(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="cargo_empleado">
            Cargo
          </label>
          <select id="cargo_empleado" value={cargo} onChange={(event) => setCargo(event.target.value)} className={INPUT_CLASES}>
            {CARGOS.map((valor) => (
              <option key={valor} value={valor} className="capitalize">
                {valor.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="fecha_ingreso_empleado">
            Fecha de ingreso
          </label>
          <input
            id="fecha_ingreso_empleado"
            type="date"
            required
            value={fechaIngreso}
            onChange={(event) => setFechaIngreso(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="sueldo_quincenal_empleado">
            Sueldo quincenal
          </label>
          <NumberInput
            id="sueldo_quincenal_empleado"
            min="0.01"
            step="0.01"
            required
            value={sueldoQuincenal}
            onChange={(event) => setSueldoQuincenal(event.target.value)}
            className="px-2 py-1.5"
          />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="telefono_empleado">
            Teléfono (opcional)
          </label>
          <input
            id="telefono_empleado"
            type="text"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="direccion_empleado">
            Dirección (opcional)
          </label>
          <input
            id="direccion_empleado"
            type="text"
            value={direccion}
            onChange={(event) => setDireccion(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>
      </div>

      {editando && (
        <label className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={activo}
            onChange={(event) => setActivo(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
          />
          Activo
        </label>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-800 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear empleado'}
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={submitting}
            className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
