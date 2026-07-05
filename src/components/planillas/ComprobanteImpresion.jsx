import { formatearMoneda, NOMBRES_MESES } from '../../utils/moneda';

function formatearCargo(cargo) {
  if (!cargo) return '';
  return cargo
    .split('_')
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

function formatearFecha(fecha) {
  return fecha ? String(fecha).slice(0, 10) : '';
}

function Linea({ label, valor, destacado }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${destacado ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span>{formatearMoneda(valor)}</span>
    </div>
  );
}

function Encabezado({ periodoLabel, periodoFechas }) {
  return (
    <div className="mb-3 text-center">
      <p className="font-semibold uppercase tracking-wide">Inversiones PG Store</p>
      <p>Comprobante de pago de planilla</p>
      <p>{periodoLabel}</p>
      <p className="text-current/70">{periodoFechas}</p>
    </div>
  );
}

function DatosEmpleado({ empleado }) {
  return (
    <div className="mb-3">
      <p className="font-semibold">{empleado?.nombre} {empleado?.apellido}</p>
      <p>{formatearCargo(empleado?.cargo)}</p>
    </div>
  );
}

/**
 * Único lugar del comprobante con tamaños de fuente explícitos (el resto de
 * bloques no fija font-size propio, así que hereda el de su contenedor).
 * "grande" se activa solo en carta completa impresa, donde el body-text de
 * todo el documento ya se agranda (ver el modo "impresion" de carta abajo).
 */
function TotalDestacado({ total, grande }) {
  return (
    <div className="mt-2 border-y-2 border-current py-2 text-center">
      <p className={grande ? 'text-base uppercase tracking-wide' : 'text-xs uppercase tracking-wide'}>Total a pagar</p>
      <p className={grande ? 'text-4xl font-bold' : 'text-2xl font-bold'}>{formatearMoneda(total)}</p>
    </div>
  );
}

function BloqueDevengado({ detalle, mostrarDetalleHoras }) {
  const horasCantidad = Number(detalle.horas_extras_cantidad);
  const valorHora = Number(detalle.valor_hora_extra);
  const labelHoras =
    mostrarDetalleHoras && horasCantidad > 0
      ? `Horas extra (${horasCantidad} hrs × ${formatearMoneda(valorHora)})`
      : 'Horas extra';

  return (
    <div>
      <p className="mb-1 font-semibold uppercase tracking-wide">Devengado</p>
      <div className="space-y-0.5">
        <Linea label="Salario" valor={detalle.salario_devengado} />
        <Linea label={labelHoras} valor={detalle.horas_extras_valor} />
        <Linea label="Bonificación" valor={detalle.bonificaciones} />
      </div>
      <div className="mt-1 border-t border-dashed border-current pt-1">
        <Linea
          label="Total devengado"
          valor={
            Number(detalle.salario_devengado) + Number(detalle.horas_extras_valor) + Number(detalle.bonificaciones)
          }
          destacado
        />
      </div>
    </div>
  );
}

function BloqueDeducciones({ lineas, total }) {
  return (
    <div>
      <p className="mb-1 font-semibold uppercase tracking-wide">Deducciones</p>
      <div className="space-y-0.5">
        {lineas.map((linea) => (
          <Linea key={linea.label} label={linea.label} valor={linea.valor} />
        ))}
      </div>
      <div className="mt-1 border-t border-dashed border-current pt-1">
        <Linea label="Total deducción" valor={total} destacado />
      </div>
    </div>
  );
}

function BloquePrestamo({ abono, prestamo }) {
  if (!abono || !prestamo) return null;

  const saldoDespues = Number(prestamo.saldo_pendiente);
  const saldoAntes = saldoDespues + Number(abono.monto);

  return (
    <div>
      <p className="mb-1 font-semibold uppercase tracking-wide">Estado del préstamo</p>
      <div className="space-y-0.5">
        <Linea label="Saldo antes" valor={saldoAntes} />
        <Linea label="Abonado" valor={abono.monto} />
        <Linea label="Saldo después" valor={saldoDespues} />
      </div>
    </div>
  );
}

/**
 * flex (no grid): más robusto entre motores de impresión. Fuera de un
 * contenedor flex de columna, "mt-auto" no tiene efecto (se computa 0), así
 * que es seguro pasar pegarAlFondo en cualquier formato — solo hace algo
 * donde el padre realmente es flex-col con altura fija (media/carta en
 * modo impresión).
 */
function BloqueFirmas({ compacto, pegarAlFondo }) {
  const margen = pegarAlFondo ? 'mt-auto' : compacto ? 'mt-6' : 'mt-10';

  return (
    <div className={`flex flex-row gap-6 ${margen}`}>
      <div className="flex-1 text-center">
        <div className="mb-1 border-t border-current pt-1">Firma del empleado</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-1 border-t border-current pt-1">Firma de administración</div>
      </div>
    </div>
  );
}

/**
 * Comprobante individual de un empleado en una planilla, parametrizado por
 * formato ("ticket" | "media" | "carta") y por modo:
 *
 * - modo="preview" (default): lo que se ve dentro del modal. Para media y
 *   carta comparte el mismo "núcleo" (alto fijo, flex-col, firma con
 *   mt-auto) que la copia de impresión real — así el preview es WYSIWYG,
 *   no una aproximación — envuelto en un marco decorativo (borde/outline +
 *   sombra) que simula el papel. Esta copia vive dentro de #root y JAMÁS se
 *   imprime (ver ModalComprobante.jsx: #root se oculta por completo en
 *   @media print).
 * - modo="impresion": la copia que de verdad se imprime, con el mismo
 *   núcleo pero sin ningún marco decorativo. Se renderiza en un portal
 *   fuera de #root (ver ModalComprobante.jsx) para que un documento HTML
 *   corto y oculto (el resto de la app) no infle la paginación de
 *   impresión — sin esto, Chrome puede repetir el comprobante en cada
 *   página si el árbol oculto ocupa varias hojas de alto. Por eso esta
 *   copia nunca lleva position:fixed: es contenido de flujo normal, del
 *   tamaño real de la hoja elegida (ver @page dinámico en ModalComprobante.jsx).
 */
export default function ComprobanteImpresion({ formato, planilla, detalle, mostrarDetalleHoras, modo = 'preview' }) {
  const empleado = detalle.empleado;
  const creditos = (detalle.compras_tienda ?? []).filter((compra) => compra.tipo === 'compra_credito');
  const cobros = (detalle.compras_tienda ?? []).filter((compra) => compra.tipo === 'cobro_adicional');
  const totalCreditos = creditos.reduce((acumulado, compra) => acumulado + Number(compra.valor), 0);
  const totalCobros = cobros.reduce((acumulado, compra) => acumulado + Number(compra.valor), 0);
  const abono = detalle.prestamo_abonos?.[0];
  const prestamo = abono?.prestamo;

  const lineasDeduccion = [
    { label: 'Compras a crédito', valor: totalCreditos },
    { label: 'Cobros adicionales', valor: totalCobros },
  ];
  if (abono) lineasDeduccion.push({ label: 'Abono a préstamo', valor: Number(abono.monto) });
  if (Number(detalle.total_vales) > 0) lineasDeduccion.push({ label: 'Vales', valor: Number(detalle.total_vales) });
  if (Number(detalle.total_llegadas_tarde) > 0) {
    lineasDeduccion.push({ label: 'Llegadas tarde', valor: Number(detalle.total_llegadas_tarde) });
  }
  if (Number(detalle.otras_deducciones) > 0) {
    lineasDeduccion.push({ label: 'Otras deducciones', valor: Number(detalle.otras_deducciones) });
  }

  const periodoLabel = `${NOMBRES_MESES[planilla.mes]} ${planilla.anio} · Quincena ${planilla.quincena}`;
  const periodoFechas = `${formatearFecha(planilla.periodo_inicio)} al ${formatearFecha(planilla.periodo_fin)}`;
  const imprimir = modo === 'impresion';

  if (formato === 'ticket') {
    const clases = imprimir
      ? 'w-full bg-white p-3 font-mono text-[11px] leading-snug text-black'
      : 'mx-auto w-[300px] rounded border-2 border-black bg-white p-3 font-mono text-[11px] leading-snug text-black shadow-md';

    return (
      <div className={clases}>
        <Encabezado periodoLabel={periodoLabel} periodoFechas={periodoFechas} />
        <DatosEmpleado empleado={empleado} />
        <div className="space-y-3 border-t border-dashed border-current pt-2">
          <BloqueDevengado detalle={detalle} mostrarDetalleHoras={mostrarDetalleHoras} />
          <BloqueDeducciones lineas={lineasDeduccion} total={detalle.total_deducciones} />
        </div>
        <TotalDestacado total={detalle.total_a_pagar} />
        {prestamo && (
          <div className="mt-3 border-t border-dashed border-current pt-2">
            <BloquePrestamo abono={abono} prestamo={prestamo} />
          </div>
        )}
        <BloqueFirmas compacto />
      </div>
    );
  }

  if (formato === 'media') {
    // Mismo núcleo en preview e impresión: alto fijo (5.5in) + flex-col, y
    // el split izquierda/derecha en flex-row. Así lo que se ve en el modal
    // antes de imprimir es exactamente lo que sale en el PDF — la única
    // diferencia es el marco decorativo (borde/sombra) que envuelve la
    // copia de preview, nunca el layout interno.
    const nucleo = (
      <div className="flex h-[5.5in] w-[8.5in] flex-col overflow-hidden bg-white p-6 text-[13px] text-black">
        <Encabezado periodoLabel={periodoLabel} periodoFechas={periodoFechas} />
        {/* flex en fila (no grid): la columna izquierda (devengado/deducciones)
            y la derecha (total/préstamo) quedan una junto a otra. */}
        <div className="flex flex-row gap-6">
          <div className="flex-1 space-y-4">
            <DatosEmpleado empleado={empleado} />
            <BloqueDevengado detalle={detalle} mostrarDetalleHoras={mostrarDetalleHoras} />
            <BloqueDeducciones lineas={lineasDeduccion} total={detalle.total_deducciones} />
          </div>
          <div className="flex-1 space-y-4">
            <TotalDestacado total={detalle.total_a_pagar} />
            <BloquePrestamo abono={abono} prestamo={prestamo} />
          </div>
        </div>
        <BloqueFirmas pegarAlFondo />
      </div>
    );

    if (imprimir) {
      return (
        <div className="w-full">
          {/* Empuja el comprobante a la mitad inferior de la hoja carta completa
              (@page en ModalComprobante.jsx la deja sin márgenes). Es un spacer
              de flujo normal, no position:fixed — así no se repite en cada
              página si el documento paginara por alguna razón. */}
          <div className="h-[5.5in]" aria-hidden="true" />
          {nucleo}
        </div>
      );
    }

    return (
      <div className="mx-auto w-fit overflow-auto rounded border-2 border-black shadow-md">{nucleo}</div>
    );
  }

  // Mismo razonamiento que "media": el núcleo (alto fijo = hoja carta menos
  // los márgenes de @page, flex-col, firma con mt-auto) es idéntico en
  // preview e impresión; solo cambia el marco decorativo alrededor. "w-full"
  // es clave: en impresión toma el 100% del área imprimible real (7in, ya
  // descontados los márgenes de @page); en preview toma el 100% del interior
  // de la página simulada de abajo (ver nota sobre outline vs. border).
  const nucleoCarta = (
    <div className="flex w-full flex-col bg-white text-lg text-black" style={{ height: 'calc(11in - 1.5in)' }}>
      <Encabezado periodoLabel={periodoLabel} periodoFechas={periodoFechas} />
      <DatosEmpleado empleado={empleado} />
      <div className="space-y-10">
        <BloqueDevengado detalle={detalle} mostrarDetalleHoras={mostrarDetalleHoras} />
        <BloqueDeducciones lineas={lineasDeduccion} total={detalle.total_deducciones} />
        <TotalDestacado total={detalle.total_a_pagar} grande />
        <BloquePrestamo abono={abono} prestamo={prestamo} />
      </div>
      <BloqueFirmas pegarAlFondo />
    </div>
  );

  if (imprimir) {
    return <div className="w-full">{nucleoCarta}</div>;
  }

  return (
    // Página simulada a tamaño real (8.5in de ancho, alto automático) con un
    // padding de 0.75in que representa el margen de @page — así "w-full" del
    // núcleo cae exacto en 7in, igual que en la hoja impresa. "outline" en vez
    // de "border": un borde normal restaría sus px del área de contenido
    // (rompiendo el cálculo anterior); un outline se pinta afuera de la caja
    // sin afectar el tamaño.
    <div className="mx-auto w-[8.5in] bg-white p-[0.75in] shadow-md outline outline-2 outline-black">
      {nucleoCarta}
    </div>
  );
}
