import { useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';

const INPUT_CLASES =
  'w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-400';

/** Mismo formulario para crear un proveedor o editar uno existente (pasar `proveedor`). */
export default function FormProveedor({ proveedor, onGuardado, onCancelar }) {
  const editando = Boolean(proveedor);

  const [nombre, setNombre] = useState(proveedor?.nombre ?? '');
  const [contactoNombre, setContactoNombre] = useState(proveedor?.contacto_nombre ?? '');
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? '');
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? '');
  const [descripcion, setDescripcion] = useState(proveedor?.descripcion ?? '');
  const [facturaNominal, setFacturaNominal] = useState(proveedor?.factura_nominal ?? true);
  const [activo, setActivo] = useState(proveedor?.activo ?? true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      nombre,
      contacto_nombre: contactoNombre.trim() || null,
      telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      descripcion: descripcion.trim() || null,
      factura_nominal: facturaNominal,
      ...(editando ? { activo } : {}),
    };

    try {
      const { data } = editando
        ? await api.put(`/proveedores/${proveedor.id}`, payload)
        : await api.post('/proveedores', payload);

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

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="nombre_proveedor">
          Nombre / razón social
        </label>
        <input
          id="nombre_proveedor"
          type="text"
          required
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className={INPUT_CLASES}
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="contacto_nombre_proveedor">
            Contacto (opcional)
          </label>
          <input
            id="contacto_nombre_proveedor"
            type="text"
            value={contactoNombre}
            onChange={(event) => setContactoNombre(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="telefono_proveedor">
            Teléfono (opcional)
          </label>
          <input
            id="telefono_proveedor"
            type="text"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            className={INPUT_CLASES}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="direccion_proveedor">
          Dirección (opcional)
        </label>
        <input
          id="direccion_proveedor"
          type="text"
          value={direccion}
          onChange={(event) => setDireccion(event.target.value)}
          className={INPUT_CLASES}
        />
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="descripcion_proveedor">
          Descripción detallada (opcional)
        </label>
        <textarea
          id="descripcion_proveedor"
          rows={3}
          placeholder="Ej. qué compran ahí, horarios, condiciones especiales..."
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          className={INPUT_CLASES}
        />
      </div>

      <label className="mb-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={facturaNominal}
          onChange={(event) => setFacturaNominal(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600"
        />
        <span>
          Factura nominal
          <span className="block text-xs text-slate-400 dark:text-slate-500">
            Si se desmarca (proveedor informal), el N° de factura de sus gastos se fuerza siempre a "N/A".
          </span>
        </span>
      </label>

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
          {submitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear proveedor'}
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
