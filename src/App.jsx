import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import RolesPage from './pages/RolesPage';
import AuditoriaPage from './pages/AuditoriaPage';
import EventosPage from './pages/EventosPage';
import ConvocatoriasPage from './pages/ConvocatoriasPage';
import CuentaPage from './pages/CuentaPage';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/eventos" element={<EventosPage />} />
            <Route path="/convocatorias" element={<ConvocatoriasPage />} />
            <Route path="/cuenta" element={<CuentaPage />} />
            <Route path="/perfil" element={<Navigate to="/cuenta" replace />} />
            <Route path="/configuracion" element={<CuentaPage />} />

            {/* Solo administradores (la API también lo valida y responde 403) */}
            <Route element={<AdminRoute />}>
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/roles-permisos" element={<RolesPage />} />
              <Route path="/auditoria" element={<AuditoriaPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;