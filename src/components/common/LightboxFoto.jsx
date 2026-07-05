import { useEffect } from 'react';

/**
 * Overlay a pantalla completa para ver una foto ya subida en tamaño real.
 * Mismo patrón de cierre que Modal.jsx (click afuera, X, Escape), pero sin
 * card blanca ni título — el fondo oscuro y la imagen son el contenido.
 */
export default function LightboxFoto({ src, alt, onClose }) {
  useEffect(() => {
    if (!src) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 dark:bg-black/90"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        ✕
      </button>

      <img
        src={src}
        alt={alt ?? 'Foto'}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
