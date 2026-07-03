export function extraerMensajeError(err) {
  const data = err.response?.data;

  if (!data) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }

  if (data.errors) {
    const primero = Object.values(data.errors)[0];
    return Array.isArray(primero) ? primero[0] : data.message;
  }

  return data.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.';
}
