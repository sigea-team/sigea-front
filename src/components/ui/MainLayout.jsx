import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

/**
 * @file MainLayout.jsx
 * @description Layout principal de aplicación funcional para el sistema SIGEA.
 * Divide la pantalla en un Sidebar colapsable a la izquierda y un área principal a la derecha
 * con Topbar (64px) independiente, contenedor central `<main>` (padding 32px) con tarjeta blanca y Footer institucional.
 * Consume los datos del usuario autenticado del AuthContext o por props.
 * @module components/ui/MainLayout
 */
export default function MainLayout({
  children,
  title = 'Dashboard Principal',
  activeNav = 'dashboard',
  onSelectNav,
  usuario: usuarioProp,
  onLogout: onLogoutProp,
  apiNotificaciones,
}) {
  const auth = useAuth();
  const usuario = usuarioProp || auth?.usuario;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sigea-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sigea-sidebar-collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = () => {
    if (onLogoutProp) {
      onLogoutProp();
    } else if (auth?.logout) {
      auth.logout();
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#edeeef] text-[#1f2023] font-sans antialiased">
      {/* Sidebar Lateral Colapsable (Maneja su propio colapso) */}
      <Sidebar
        activeItem={activeNav}
        onSelectNav={onSelectNav}
        usuario={usuario}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Área Principal de Contenido (Derecha) */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#f7f7f8] min-w-0 transition-all duration-300">
        {/* Topbar Superior Independiente */}
        <Topbar
          title={title}
          usuario={usuario}
          onLogout={handleLogout}
          apiNotificaciones={apiNotificaciones}
        />

        {/* Contenedor Central <main> con padding de 32px (p-8) */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-6 sm:p-8 shadow-xs">
            {children}
          </div>
        </main>

        {/* Footer Global al Final */}
        <Footer />
      </div>
    </div>
  );
}
