import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import AdminLayout from './layouts/AdminLayout';
import CajeroLayout from './layouts/CajeroLayout';
import Dashboard from './pages/dashboard/Dashboard';
import MiCaja from './pages/caja/MiCaja';
import Proximamente from './pages/Proximamente';
import PlanillasListado from './pages/planillas/PlanillasListado';
import PlanillaDetalle from './pages/planillas/PlanillaDetalle';
import EmpleadosListado from './pages/empleados/EmpleadosListado';
import EmpleadoDetalle from './pages/empleados/EmpleadoDetalle';

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
            <Route path="/caja" element={<MiCaja />} />
            <Route path="/reportes" element={<Proximamente titulo="Reportes" />} />

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/planillas" element={<PlanillasListado />} />
              <Route path="/planillas/:id" element={<PlanillaDetalle />} />
              <Route path="/prestamos" element={<Proximamente titulo="Préstamos" />} />
              <Route path="/empleados" element={<EmpleadosListado />} />
              <Route path="/empleados/:id" element={<EmpleadoDetalle />} />
              <Route path="/proveedores" element={<Proximamente titulo="Proveedores" />} />
            </Route>

            <Route element={<ProtectedRoute roles={['secretaria']} />}>
              <Route path="/facturas-pendientes" element={<Proximamente titulo="Facturas pendientes" />} />
              <Route path="/gastos-externos" element={<Proximamente titulo="Gastos externos" />} />
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
