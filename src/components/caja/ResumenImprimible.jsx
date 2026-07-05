import { formatearFechaLarga, formatearMoneda } from '../../utils/moneda';

/**
 * Versión "para compartir" del resumen del cierre — estilos inline con
 * colores fijos (no tokens `dark:`/`var(--...)`) a propósito: la imagen
 * exportada debe verse igual sin importar el modo claro/oscuro de quien la
 * reciba por WhatsApp, y algunos navegadores tienen problemas capturando
 * `oklch()`/variables CSS con html2canvas.
 */
export default function ResumenImprimible({ cierre }) {
  const efectivo = Number(cierre.efectivo ?? 0);
  const totalGastos = Number(cierre.total_gastos ?? 0);
  const totalVales = Number(cierre.total_vales ?? 0);
  const tarjeta = Number(cierre.tarjeta_credito ?? 0);
  const transferencia = Number(cierre.transferencia ?? 0);
  const diferencia = Number(cierre.diferencia ?? 0);

  const ventaEfectivoReconstruida = efectivo + totalGastos + totalVales;
  const totalVentaSegunCaja = ventaEfectivoReconstruida + tarjeta + transferencia;

  const esPreliminar = cierre.estado === 'abierto';

  const colorDiferencia =
    diferencia === 0
      ? { bg: '#d1fae5', fg: '#065f46' }
      : diferencia < 0
        ? { bg: '#fee2e2', fg: '#991b1b' }
        : { bg: '#fef3c7', fg: '#92400e' };

  return (
    <div style={{ width: 480, fontFamily: 'Arial, Helvetica, sans-serif', background: '#ffffff', color: '#0f172a', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>CajaFlow</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Inversiones PG Store</div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            padding: '5px 12px',
            borderRadius: 999,
            background: esPreliminar ? '#fef3c7' : '#dcfce7',
            color: esPreliminar ? '#92400e' : '#166534',
          }}
        >
          {esPreliminar ? 'PRELIMINAR' : 'FINAL'}
        </div>
      </div>

      <div style={{ marginBottom: 18, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{cierre.cajero?.name}</div>
        <div>
          {formatearFechaLarga(cierre.fecha)} · Turno <span style={{ textTransform: 'capitalize' }}>{cierre.turno}</span>
        </div>
      </div>

      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <tbody>
          <FilaImprimible label="Efectivo en caja" valor={efectivo} />
          <FilaImprimible operador="+" label="Gastos" valor={totalGastos} />
          <FilaImprimible operador="+" label="Vales" valor={totalVales} />
          <FilaImprimible operador="=" label="Venta efectivo" valor={ventaEfectivoReconstruida} resaltado conBorde />
          <FilaImprimible operador="+" label="Tarjeta" valor={tarjeta} espaciado />
          <FilaImprimible operador="+" label="Transferencia" valor={transferencia} />
          <FilaImprimible operador="=" label="Total según caja" valor={totalVentaSegunCaja} resaltado conBorde />
          <FilaImprimible label="Venta según A2 Food" valor={cierre.venta_sistema_a2} espaciado />
        </tbody>
      </table>

      <div
        style={{
          marginTop: 18,
          padding: '12px 16px',
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: colorDiferencia.bg,
          color: colorDiferencia.fg,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13 }}>Diferencia</span>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{formatearMoneda(diferencia)}</span>
      </div>

      <div style={{ marginTop: 16, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
        Generado por CajaFlow · Sistema interno de caja y planillas
      </div>
    </div>
  );
}

function FilaImprimible({ operador, label, valor, resaltado, conBorde, espaciado }) {
  return (
    <tr>
      <td
        style={{
          padding: '5px 0',
          paddingTop: espaciado ? 10 : 5,
          borderTop: conBorde ? '1px solid #e2e8f0' : 'none',
          color: resaltado ? '#0f172a' : '#64748b',
          fontWeight: resaltado ? 700 : 400,
        }}
      >
        {operador && <span style={{ display: 'inline-block', width: 14, color: '#94a3b8' }}>{operador}</span>}
        {label}
      </td>
      <td
        style={{
          padding: '5px 0',
          paddingTop: espaciado ? 10 : 5,
          borderTop: conBorde ? '1px solid #e2e8f0' : 'none',
          textAlign: 'right',
          fontWeight: resaltado ? 700 : 500,
          color: '#0f172a',
        }}
      >
        {formatearMoneda(valor)}
      </td>
    </tr>
  );
}
