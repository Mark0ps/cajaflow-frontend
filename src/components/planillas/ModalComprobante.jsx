import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Modal from '../Modal';
import ComprobanteImpresion from './ComprobanteImpresion';
import { IconImprimir } from '../icons';

const FORMATOS = [
  // "auto" no es un valor válido combinado con un largo fijo en @page size
  // (Chrome lo ignora y cae a Letter por defecto) — se usa un largo fijo
  // generoso; si el contenido es más largo, simplemente pagina a una
  // segunda hoja de 80mm, en vez de romper el ancho de la boleta.
  { valor: 'ticket', label: 'Ticket', pagina: 'size: 80mm 297mm; margin: 3mm;' },
  // Página carta completa (no media hoja): el comprobante se empuja a la
  // mitad inferior con un spacer de flujo normal (ver ComprobanteImpresion.jsx),
  // dejando la mitad superior en blanco. Un tamaño de página "8.5in 5.5in"
  // no es confiable en impresoras/bandejas reales, que siempre alimentan carta completa.
  { valor: 'media', label: 'Media carta', pagina: 'size: letter; margin: 0;' },
  { valor: 'carta', label: 'Carta completa', pagina: 'size: letter; margin: 0.75in;' },
];

/** Inserta/actualiza el @page del documento según el formato elegido, solo mientras el modal está abierto. */
function useEstiloPagina(open, formato) {
  useEffect(() => {
    if (!open) return;

    const regla = FORMATOS.find((f) => f.valor === formato)?.pagina ?? '';
    const style = document.createElement('style');
    style.id = 'comprobante-page-style';
    style.textContent = `@page { ${regla} }`;
    document.head.appendChild(style);

    return () => {
      document.getElementById('comprobante-page-style')?.remove();
    };
  }, [open, formato]);
}

/**
 * Nodo fijo en <body>, hermano de #root (no descendiente), donde se porta
 * la copia imprimible del comprobante. Al imprimir solo se oculta #root
 * por completo (ver index.css) — así el motor de impresión de Chrome solo
 * ve una hoja de contenido corto y real, sin el resto de la app (oculto
 * pero todavía ocupando alto de documento) inflando la paginación.
 */
function useNodoImpresion() {
  const [nodo] = useState(() => {
    let el = document.getElementById('comprobante-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'comprobante-portal';
      document.body.appendChild(el);
    }
    return el;
  });

  return nodo;
}

export default function ModalComprobante({ open, onClose, planilla, detalle }) {
  const [formato, setFormato] = useState('ticket');
  const [mostrarDetalleHoras, setMostrarDetalleHoras] = useState(false);
  const nodoImpresion = useNodoImpresion();

  useEstiloPagina(open, formato);

  return (
    // max-w-5xl (no max-w-3xl): el preview ahora es WYSIWYG a tamaño físico
    // real (una hoja carta ronda los 8.5in ≈ 816px de ancho), más grande que
    // el modal genérico — necesita más aire alrededor.
    <Modal open={open} onClose={onClose} title="Comprobante de pago" maxWidth="max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            {FORMATOS.map((f) => (
              <label key={f.valor} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="radio"
                  name="formato_comprobante"
                  value={f.valor}
                  checked={formato === f.valor}
                  onChange={() => setFormato(f.valor)}
                />
                {f.label}
              </label>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={mostrarDetalleHoras}
              onChange={(event) => setMostrarDetalleHoras(event.target.checked)}
            />
            Mostrar detalle de cálculo de horas extra
          </label>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          <IconImprimir className="h-4 w-4" />
          Imprimir
        </button>
      </div>

      {/* overflow-x-auto: en pantallas angostas (o con "carta"/"media" a su
          tamaño físico real de ~8.5in) el contenido puede ser más ancho que
          el modal — que scrollee horizontalmente en vez de desbordarse. */}
      <div className="overflow-x-auto rounded-lg border-[0.5px] border-[var(--border)] bg-slate-100 p-4 dark:bg-slate-950">
        <ComprobanteImpresion
          formato={formato}
          planilla={planilla}
          detalle={detalle}
          mostrarDetalleHoras={mostrarDetalleHoras}
          modo="preview"
        />
      </div>

      {open &&
        createPortal(
          <div id="comprobante-print-area" className="hidden print:block">
            <ComprobanteImpresion
              formato={formato}
              planilla={planilla}
              detalle={detalle}
              mostrarDetalleHoras={mostrarDetalleHoras}
              modo="impresion"
            />
          </div>,
          nodoImpresion
        )}
    </Modal>
  );
}
