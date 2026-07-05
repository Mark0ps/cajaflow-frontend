import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ResumenImprimible from './ResumenImprimible';
import { IconDescargar } from '../icons';

/**
 * Genera el PNG del resumen (Corte X/Z) 100% en el cliente y lo descarga —
 * o lo comparte directo por Web Share API si el navegador lo soporta
 * (típicamente móvil). No incluye las fotos del turno, son cosas separadas.
 */
export default function BotonDescargarResumen({ cierre }) {
  const contenedorRef = useRef(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');

  async function descargar() {
    setError('');
    setGenerando(true);

    try {
      const canvas = await html2canvas(contenedorRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

      if (!blob) {
        throw new Error('No se pudo generar la imagen.');
      }

      const nombreArchivo = `cierre-${cierre.fecha}-${cierre.turno}.png`;
      const archivo = new File([blob], nombreArchivo, { type: 'image/png' });

      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: 'Resumen de cierre — CajaFlow' });
        return;
      }

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // AbortError: el usuario canceló el share sheet — no es un error real.
      if (err?.name !== 'AbortError') {
        setError('No se pudo generar la imagen del resumen.');
      }
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="inline-block">
      {/* Fuera de pantalla pero renderizado (html2canvas necesita el layout
          real, no puede capturar algo con display:none). */}
      <div style={{ position: 'fixed', top: 0, left: -10000, pointerEvents: 'none' }} aria-hidden="true">
        <div ref={contenedorRef}>
          <ResumenImprimible cierre={cierre} />
        </div>
      </div>

      <button
        type="button"
        onClick={descargar}
        disabled={generando}
        className="flex items-center gap-1.5 rounded-lg border-[0.5px] border-[var(--border)] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <IconDescargar className="h-4 w-4" />
        {generando ? 'Generando...' : 'Descargar resumen'}
      </button>

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
