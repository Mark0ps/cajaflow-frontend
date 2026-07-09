export function formatearMoneda(valor) {
  const numero = Number(valor ?? 0);
  const formateado = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
  return `L. ${formateado}`;
}

export function fechaLocalHoy() {
  const ahora = new Date();
  const offsetMs = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora - offsetMs).toISOString().slice(0, 10);
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Nombres de mes capitalizados, indexados 1-12 (índice 0 vacío). */
export const NOMBRES_MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "martes 7 julio 2026" a partir de una fecha YYYY-MM-DD (o ISO con hora). */
export function formatearFechaLarga(fechaIso) {
  const fecha = new Date(`${String(fechaIso).slice(0, 10)}T00:00:00`);
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

/** "7 jul 2026" — sin nombre de día, para mostrar dos fechas juntas en poco espacio. */
export function formatearFechaCorta(fechaIso) {
  const fecha = new Date(`${String(fechaIso).slice(0, 10)}T00:00:00`);
  return `${fecha.getDate()} ${MESES[fecha.getMonth()].slice(0, 3)} ${fecha.getFullYear()}`;
}

/** true si dos fechas ISO (con o sin hora) caen en días de calendario distintos. */
export function difierenPorDia(fechaIsoA, fechaIsoB) {
  return String(fechaIsoA).slice(0, 10) !== String(fechaIsoB).slice(0, 10);
}

/**
 * Últimos `cantidad` meses (incluyendo el actual), más recientes primero,
 * como { value: "2026-07", label: "Julio 2026" } — para selects de mes.
 */
export function generarOpcionesMes(cantidad = 12) {
  const ahora = new Date();
  const opciones = [];

  for (let i = 0; i < cantidad; i += 1) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    opciones.push({ value: `${anio}-${String(mes).padStart(2, '0')}`, label: `${NOMBRES_MESES[mes]} ${anio}` });
  }

  return opciones;
}
