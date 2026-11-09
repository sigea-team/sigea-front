import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import RolesPage from './pages/RolesPage';
import AuditoriaPage from './pages/AuditoriaPage';
import EventosPage from './pages/EventosPage';
import ConvocatoriasPage from './pages/ConvocatoriasPage';
import CuentaPage from './pages/CuentaPage';
import ConvocatoriasPublicasPage from './pages/ConvocatoriasPublicasPage';
import ConferencistasPublicosPage from './pages/ConferencistasPublicosPage';
import MiPerfilConferencistaPage from './pages/MiPerfilConferencistaPage';
import ConferencistaInvitacionPage from './pages/ConferencistaInvitacionPage';
import EvaluacionesPage from './pages/EvaluacionesPage';
import SalasPage from './pages/SalasPage';
import AgendaPage from './pages/AgendaPage';
import AgendaPublicaPage from './pages/AgendaPublicaPage';
import MisPropuestasPage from './pages/MisPropuestasPage';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import EvaluadorRoute from './routes/EvaluadorRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
          {/* HU-32: destino del enlace del correo (app.mail.reset-password-path del backend) */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* HU-11 (Criterio 1): convocatorias publicadas, visibles sin iniciar sesión */}
          <Route path="/convocatorias-publicas" element={<ConvocatoriasPublicasPage />} />
          {/* HU-12 (Criterio 4): conferencistas de un evento publicado, visibles sin iniciar sesión */}
          <Route path="/eventos/:eventoId/conferencistas-publicos" element={<ConferencistasPublicosPage />} />
          {/* HU-22 (Criterio 3): agenda publicada del evento, organizada por día y hora, sin iniciar sesión */}
          <Route path="/eventos/:eventoId/agenda-publica" element={<AgendaPublicaPage />} />
          {/* HU-12: el conferencista invitado registra sus datos desde el enlace del correo (sin sesión) */}
          <Route path="/conferencista/invitacion" element={<ConferencistaInvitacionPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/eventos" element={<EventosPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/eventos/:eventoId/agenda" element={<AgendaPage />} />
            <Route path="/salas" element={<SalasPage />} />
            <Route path="/eventos/:eventoId/salas" element={<SalasPage />} />
            <Route path="/convocatorias" element={<ConvocatoriasPage />} />
            {/* HU-17: solo cuentas con el permiso PROPUESTAS_EVALUAR (la API también lo valida) */}
            <Route element={<EvaluadorRoute />}>
              <Route path="/evaluaciones" element={<EvaluacionesPage />} />
            </Route>
            {/* HU-14: propuestas del autor, sus versiones y modificación */}
            <Route path="/mis-propuestas" element={<MisPropuestasPage />} />
            <Route path="/cuenta" element={<CuentaPage />} />
            <Route path="/perfil" element={<Navigate to="/cuenta" replace />} />
            {/* HU-12: perfil de ingreso «Conferencista»: el conferencista actualiza su trayectoria */}
            <Route path="/mi-perfil-conferencista" element={<MiPerfilConferencistaPage />} />

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