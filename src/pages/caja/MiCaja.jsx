import { useEffect, useState } from 'react';
import api from '../../api/axios';
import FormApertura from '../../components/caja/FormApertura';
import PanelTrabajo from '../../components/caja/PanelTrabajo';

export default function MiCaja() {
  const [cierre, setCierre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    api
      // "mio=1" fuerza el filtro por el usuario autenticado sin importar el
      // rol — sin esto, un Admin vería el primer cierre abierto de cualquier
      // cajero (el backend solo auto-filtra por dueño cuando el rol es
      // cajero).
      .get('/cierres-caja', { params: { estado: 'abierto', mio: 1 } })
      .then(({ data }) => {
        const encontrado = data.data?.[0];

        if (!encontrado) {
          return null;
        }

        return api.get(`/cierres-caja/${encontrado.id}`).then(({ data: completo }) => completo);
      })
      .then((completo) => {
        if (activo) setCierre(completo ?? null);
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar el estado de caja.');
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  async function refrescar(id = cierre?.id) {
    if (!id) return;
    const { data } = await api.get(`/cierres-caja/${id}`);
    setCierre(data);
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Cargando...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600 dark:text-red-400">{error}</div>;
  }

  if (!cierre) {
    return <FormApertura onAbierto={(nuevoCierre) => refrescar(nuevoCierre.id)} />;
  }

  return (
    <PanelTrabajo cierre={cierre} onGuardado={() => refrescar()} onReiniciar={() => setCierre(null)} />
  );
}
