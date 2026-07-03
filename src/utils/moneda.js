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
