import { useRef, useState } from 'react';
import api from '../../api/axios';
import { extraerMensajeError } from '../../api/errores';
import ModalMotivo from '../common/ModalMotivo';
import { IconCamara, IconSubir, IconEliminar } from '../icons';

/**
 * Fotos adjuntas al turno (ej. arqueo físico). Dos botones separados de
 * cámara/galería, mismo patrón que Convenciones de trabajo — un solo input
 * con accept mixto le esconde la cámara al navegador móvil.
 */
export default function SeccionFotos({ cierre, editable, requerirMotivo = false, onGuardado }) {
  const fotos = cierre.fotos ?? [];
  const inputCamaraRef = useRef(null);
  const inputArchivoRef = useRef(null);

  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [fotoAEliminar, setFotoAEliminar] = useState(null);
  const [archivoPendiente, setArchivoPendiente] = useState(null);

  async function subirArchivo(file, motivo) {
    setError('');
    setSubiendo(true);

    const formData = new FormData();
    formData.append('foto', file);
    if (motivo) formData.append('motivo', motivo);

    try {
      await api.post(`/cierres-caja/${cierre.id}/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await onGuardado();
    } catch (err) {
      setError(extraerMensajeError(err));
      throw err;
    } finally {
      setSubiendo(false);
    }
  }

  function handleArchivoSeleccionado(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite volver a elegir el mismo archivo después

    if (!file) return;

    if (requerirMotivo) {
      setArchivoPendiente(file);
    } else {
      subirArchivo(file, null);
    }
  }

  async function handleEliminar(foto) {
    if (requerirMotivo) {
      setFotoAEliminar(foto);
      return;
    }

    if (!window.confirm('¿Eliminar esta foto? Esta acción no se puede deshacer.')) {
      return;
    }

    setError('');

    try {
      await api.delete(`/cierres-caja/${cierre.id}/fotos/${foto.id}`);
      await onGuardado();
    } catch (err) {
      setError(extraerMensajeError(err));
    }
  }

  async function confirmarEliminarConMotivo(motivo) {
    await api.delete(`/cierres-caja/${cierre.id}/fotos/${fotoAEliminar.id}`, { data: { motivo } });
    await onGuardado();
  }

  return (
    <section className="rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--surface-2)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Fotos del turno {fotos.length > 0 && <span className="font-normal text-slate-400 dark:text-slate-500">({fotos.length})</span>}
      </h2>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {editable && (
        <>
          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleArchivoSeleccionado}
            className="hidden"
          />
          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/*"
            onChange={handleArchivoSeleccionado}
            className="hidden"
          />

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputCamaraRef.current?.click()}
              disabled={subiendo}
              className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <IconCamara className="h-4 w-4" />
              Tomar foto
            </button>
            <button
              type="button"
              onClick={() => inputArchivoRef.current?.click()}
              disabled={subiendo}
              className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <IconSubir className="h-4 w-4" />
              Subir archivo
            </button>
          </div>

          {subiendo && <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">Subiendo...</p>}
        </>
      )}

      {fotos.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Sin fotos registradas en este turno.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="group relative overflow-hidden rounded-lg border-[0.5px] border-[var(--border)]"
            >
              <a href={foto.url} target="_blank" rel="noreferrer">
                <img src={foto.url} alt={foto.descripcion ?? 'Foto del turno'} className="h-24 w-full object-cover" />
              </a>
              {editable && (
                <button
                  type="button"
                  onClick={() => handleEliminar(foto)}
                  aria-label="Eliminar foto"
                  className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-red-600 hover:bg-white dark:bg-slate-900/80 dark:text-red-400 dark:hover:bg-slate-900"
                >
                  <IconEliminar className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ModalMotivo
        open={Boolean(fotoAEliminar)}
        onClose={() => setFotoAEliminar(null)}
        title="Eliminar foto"
        mensaje="Este cierre ya no está abierto. Indica el motivo para eliminar esta foto."
        onConfirmar={confirmarEliminarConMotivo}
      />

      <ModalMotivo
        open={Boolean(archivoPendiente)}
        onClose={() => setArchivoPendiente(null)}
        title="Subir foto"
        mensaje="Este cierre ya no está abierto. Indica el motivo para agregar esta foto."
        onConfirmar={async (motivo) => {
          await subirArchivo(archivoPendiente, motivo);
          setArchivoPendiente(null);
        }}
      />
    </section>
  );
}
