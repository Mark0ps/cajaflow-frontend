import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import AdminLayout from './layouts/AdminLayout';
import CajeroLayout from './layouts/CajeroLayout';
import Dashboard from './pages/dashboard/Dashboard';
import MiCaja from './pages/caja/MiCaja';
import PlanillasListado from './pages/planillas/PlanillasListado';
import PlanillaDetalle from './pages/planillas/PlanillaDetalle';
import EmpleadosListado from './pages/empleados/EmpleadosListado';
import EmpleadoDetalle from './pages/empleados/EmpleadoDetalle';
import CierresCajaListado from './pages/caja/CierresCajaListado';
import CierreCajaDetalle from './pages/caja/CierreCajaDetalle';
import FacturasPendientes from './pages/gastos/FacturasPendientes';
import GastosExternos from './pages/gastos/GastosExternos';
import Reportes from './pages/reportes/Reportes';
import AsignarVale from './pages/vales/AsignarVale';
import PrestamosListado from './pages/prestamos/PrestamosListado';
import UsuariosListado from './pages/usuarios/UsuariosListado';
import ProveedoresListado from './pages/proveedores/ProveedoresListado';

function RaizPorRol() {
  const { user } = useAuth();
  return <Navigate to={user.role === 'cajero' ? '/mi-caja' : '/dashboard'} replace />;
}

function RutasProtegidas() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/no-autorizado" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RaizPorRol />} />

        <Route element={<ProtectedRoute roles={['admin', 'secretaria']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/caja" element={<CierresCajaListado />} />
            <Route path="/caja/:id" element={<CierreCajaDetalle />} />
            <Route path="/reportes" element={<Reportes />} />

            <Route element={<ProtectedRoute roles={['admin']} />}>
              {/* Ruta distinta de /mi-caja (exclusiva del cajero) para evitar
                  ambigüedad de path duplicado en el árbol de rutas; mismo
                  componente, Admin puede abrir/trabajar su propio turno. */}
              <Route path="/mi-turno" element={<MiCaja />} />
              <Route path="/planillas" element={<PlanillasListado />} />
              <Route path="/planillas/:id" element={<PlanillaDetalle />} />
              <Route path="/vales/asignar" element={<AsignarVale />} />
              <Route path="/prestamos" element={<PrestamosListado />} />
              <Route path="/empleados" element={<EmpleadosListado />} />
              <Route path="/empleados/:id" element={<EmpleadoDetalle />} />
              <Route path="/proveedores" element={<ProveedoresListado />} />
              <Route path="/usuarios" element={<UsuariosListado />} />
            </Route>

            <Route element={<ProtectedRoute roles={['secretaria']} />}>
              <Route path="/facturas-pendientes" element={<FacturasPendientes />} />
              <Route path="/gastos-externos" element={<GastosExternos />} />
            </Route>
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['cajero']} />}>
          <Route element={<CajeroLayout />}>
            <Route path="/mi-caja" element={<MiCaja />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RutasProtegidas />
      </AuthProvider>
    </BrowserRouter>
  );
}
