import { useEffect } from 'react';

// Mismo umbral que Sidebar.jsx para distinguir desktop/móvil.
const ANCHO_MINIMO_DESKTOP = 768;

function esDesktop() {
  return typeof window !== 'undefined' && window.innerWidth >= ANCHO_MINIMO_DESKTOP;
}

/**
 * Pegar una imagen desde el portapapeles (Ctrl+V), solo en desktop — el
 * soporte de "pegar imagen" en navegadores móviles es inconsistente
 * (especialmente Safari iOS). `onImagenPegada(file)` recibe un File listo
 * para pasar por el mismo pipeline de compresión/subida que ya usa el botón
 * "Subir archivo".
 */
export default function usePegarImagen({ habilitado = true, onImagenPegada }) {
  useEffect(() => {
    if (!habilitado) return;

    function handlePaste(event) {
      if (!esDesktop()) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      const item = Array.from(items).find((item) => item.type.startsWith('image/'));
      if (!item) return;

      const file = item.getAsFile();
      if (!file) return;

      event.preventDefault();
      onImagenPegada(file);
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [habilitado, onImagenPegada]);
}
