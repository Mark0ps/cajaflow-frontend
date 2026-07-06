import { useState } from 'react';
import { IconChevronDown } from '../icons';
import { formatearMoneda } from '../../utils/moneda';
import SeccionComprasTienda from './SeccionComprasTienda';
import SeccionLlegadasTarde from './SeccionLlegadasTarde';
import SeccionVales from './SeccionVales';

function contarYSumar(detalle, categoriaId) {
  if (categoriaId === 'compra_credito' || categoriaId === 'cobro_adicional') {
    const items = (detalle.compras_tienda ?? []).filter((compra) => compra.tipo === categoriaId);
    return { cantidad: items.length, total: items.reduce((acc, compra) => acc + Number(compra.valor), 0) };
  }
  if (categoriaId === 'llegadas_tarde') {
    const items = detalle.llegadas_tarde ?? [];
    return { cantidad: items.length, total: items.reduce((acc, llegada) => acc + Number(llegada.valor_deduccion), 0) };
  }
  const items = detalle.vales ?? [];
  return { cantidad: items.length, total: items.reduce((acc, vale) => acc + Number(vale.monto), 0) };
}

const CATEGORIAS = [
  { id: 'compra_credito', titulo: 'Compras a crédito' },
  { id: 'cobro_adicional', titulo: 'Cobros adicionales' },
  { id: 'llegadas_tarde', titulo: 'Llegadas tarde' },
  { id: 'vales', titulo: 'Vales' },
];

/**
 * Consolida Compras a crédito, Cobros adicionales, Llegadas tarde y Vales en
 * un solo punto de entrada colapsable. Colapsado muestra el total y cantidad
 * de partidas combinadas; expandido muestra el resumen por categoría, y
 * click en una categoría abre el widget ya existente de esa categoría (mismo
 * componente, mismo comportamiento de agregar/editar/eliminar de siempre).
 */
export default function SeccionDeducciones({ planillaId, detalle, editable, onDetalleActualizado }) {
  const [abierto, setAbierto] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const resumen = CATEGORIAS.map((categoria) => ({ ...categoria, ...contarYSumar(detalle, categoria.id) }));
  const cantidadTotal = resumen.reduce((acc, categoria) => acc + categoria.cantidad, 0);
  const totalGeneral = resumen.reduce((acc, categoria) => acc + categoria.total, 0);

  function alternarCategoria(id) {
    setCategoriaActiva((prev) => (prev === id ? null : id));
  }

  return (
    <div className="mt-3 border-t-[0.5px] border-[var(--border)] pt-3">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        <span>Deducciones {cantidadTotal > 0 && `· ${cantidadTotal} partida${cantidadTotal === 1 ? '' : 's'}`}</span>
        <span className="flex items-center gap-2">
          {cantidadTotal > 0 && (
            <span className="font-semibold text-slate-700 dark:text-slate-300">-{formatearMoneda(totalGeneral)}</span>
          )}
          <IconChevronDown className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {abierto && (
        <div className="mt-2 space-y-1">
          {resumen.map((categoria) => (
            <div key={categoria.id}>
              <button
                type="button"
                onClick={() => alternarCategoria(categoria.id)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                <span>{categoria.titulo} {categoria.cantidad > 0 && `(${categoria.cantidad})`}</span>
                <span className="flex items-center gap-2">
                  {categoria.cantidad > 0 && (
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatearMoneda(categoria.total)}</span>
                  )}
                  <IconChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${categoriaActiva === categoria.id ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>

              {categoriaActiva === categoria.id && (
                <div className="pl-2">
                  {categoria.id === 'compra_credito' && (
                    <SeccionComprasTienda
                      planillaId={planillaId}
                      detalle={detalle}
                      editable={editable}
                      onDetalleActualizado={onDetalleActualizado}
                      tipo="compra_credito"
                      titulo="Compras a crédito"
                      requiereMotivo={false}
                      textoVacio="Sin compras a crédito registradas."
                      encabezado={false}
                    />
                  )}
                  {categoria.id === 'cobro_adicional' && (
                    <SeccionComprasTienda
                      planillaId={planillaId}
                      detalle={detalle}
                      editable={editable}
                      onDetalleActualizado={onDetalleActualizado}
                      tipo="cobro_adicional"
                      titulo="Cobros adicionales"
                      requiereMotivo
                      textoVacio="Sin cobros adicionales registrados."
                      encabezado={false}
                    />
                  )}
                  {categoria.id === 'llegadas_tarde' && (
                    <SeccionLlegadasTarde
                      planillaId={planillaId}
                      detalle={detalle}
                      editable={editable}
                      onDetalleActualizado={onDetalleActualizado}
                      encabezado={false}
                    />
                  )}
                  {categoria.id === 'vales' && <SeccionVales detalle={detalle} encabezado={false} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
