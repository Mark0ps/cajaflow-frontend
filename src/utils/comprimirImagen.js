// Las fotos de cámara de un teléfono pesan 3–12 MB; sin comprimir, la subida
// es lenta en datos móviles y puede superar upload_max_filesize de PHP en el
// servidor (la foto se descarta y la validación falla). Se redimensiona y
// recomprime en el cliente antes de subir. Los PDF y formatos que el navegador
// no pueda decodificar (ej. HEIC en algunos navegadores) pasan sin tocar.

const DIMENSION_MAXIMA = 1920;
const UMBRAL_BYTES = 1024 * 1024; // debajo de 1 MB no vale la pena recomprimir

export async function comprimirImagen(file) {
  if (!file || !file.type?.startsWith('image/')) return file;
  if (file.size <= UMBRAL_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, DIMENSION_MAXIMA / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * escala));
    canvas.height = Math.max(1, Math.round(bitmap.height * escala));

    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));

    if (!blob || blob.size >= file.size) return file;

    const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nombre, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
