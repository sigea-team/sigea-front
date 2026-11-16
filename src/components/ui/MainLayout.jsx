import { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

/**
 * @file MainLayout.jsx
 * @description Layout principal de aplicación funcional para el sistema SIGEA.
 * Divide la pantalla en un Sidebar colapsable a la izquierda y un área principal a la derecha
 * con Topbar inteligente (se oculta al bajar), contenedor central `<main>` y Footer al final del scroll.
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

  // Estado y referencia para ocultar/mostrar el Topbar al hacer scroll
  const [showTopbar, setShowTopbar] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e) => {
    const currentScrollY = e.currentTarget.scrollTop;

    // Si baja más de 60px se oculta; si sube (o está arriba) se muestra
    if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
      setShowTopbar(false);
    } else if (currentScrollY < lastScrollY.current || currentScrollY <= 60) {
      setShowTopbar(true);
    }

    lastScrollY.current = currentScrollY;
  };

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
    <div className="h-screen overflow-hidden w-full flex bg-surface text-ink-900 font-sans antialiased">
      {/* Sidebar Lateral Colapsable (Fijo a la izquierda) */}
      <Sidebar
        activeItem={activeNav}
        onSelectNav={onSelectNav}
        usuario={usuario}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Área Principal de Contenido (Toda la columna derecha tiene el scroll) */}
      <div
        onScroll={handleScroll}
        className="flex-1 flex flex-col h-full overflow-y-auto bg-surface min-w-0 transition-all duration-300"
      >
        {/* Topbar Superior con ocultamiento inteligente */}
        <div
          className={`sticky top-0 z-30 transition-transform duration-300 ${
            showTopbar ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <Topbar
            title={title}
            usuario={usuario}
            onLogout={handleLogout}
            apiNotificaciones={apiNotificaciones}
          />
        </div>

        {/* Contenedor Central <main> */}
        <main className="flex-1 p-6 md:p-8 bg-surface">
          {children}
        </main>

        {/* Footer Global al final del contenido (solo visible al bajar) */}
        <Footer compacto />
      </div>
    </div>
  );
}