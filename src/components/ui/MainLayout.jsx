import { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

/**
 * @file MainLayout.jsx
 * @description Layout principal unificado para el sistema SIGEA.
 * Divide la pantalla en un Sidebar colapsable a la izquierda y un área principal a la derecha
 * con Topbar, contenedor central `<main>` y Footer institucional al final del scroll.
 *
 * Soporta dos modos según `varianteTopbar`:
 * - **'privada' (por defecto):** Topbar con título de página y menú de cuenta. Footer compacto.
 * - **'publica':** Topbar con navegación ancla y botones de autenticación. Footer completo.
 *
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
  varianteTopbar = 'privada',
  fullWidth = false,
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

  // El Topbar se oculta al bajar solo en la variante privada (en la home se mantiene sticky por secciones)
  const [showTopbar, setShowTopbar] = useState(true);
  const lastScrollY = useRef(0);

  const handleScroll = (e) => {
    if (varianteTopbar === 'publica') return; // la home maneja su propio sticky
    const currentScrollY = e.currentTarget.scrollTop;
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

  // La home (variante pública) usa el footer completo; las páginas internas usan el compacto
  const footerCompacto = varianteTopbar !== 'publica';

  return (
    <div className="h-screen overflow-hidden w-full flex bg-surface text-ink-900 font-sans antialiased">
      {/* Sidebar Lateral Colapsable */}
      <Sidebar
        activeItem={activeNav}
        onSelectNav={onSelectNav}
        usuario={usuario}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Área Principal (columna derecha con scroll) */}
      <div
        onScroll={handleScroll}
        className="flex-1 flex flex-col h-full overflow-y-auto bg-surface min-w-0 transition-all duration-300"
      >
        {/* Topbar con ocultamiento inteligente (solo en variante privada) */}
        <div
          className={`sticky top-0 z-30 transition-transform duration-300 ${
            showTopbar || varianteTopbar === 'publica' ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <Topbar
            title={title}
            variante={varianteTopbar}
            usuario={usuario}
            onLogout={handleLogout}
            apiNotificaciones={apiNotificaciones}
          />
        </div>

        {/* Contenedor Central <main> */}
        <main className={`flex-1 bg-surface ${fullWidth ? 'w-full' : 'p-6 md:p-8'}`}>
          {children}
        </main>

        {/* Footer institucional: completo en home/público, compacto en páginas internas */}
        <Footer compacto={footerCompacto} />
      </div>
    </div>
  );
}
