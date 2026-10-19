import { useState, useRef, useEffect } from 'react';
import { Bell, User, PanelLeft, ChevronDown, UserCog, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
import NotificacionesCampana from '../../features/notificaciones/components/NotificacionesCampana';

/**
 * @file MainLayout.jsx
 * @description Layout principal de aplicación funcional para el sistema SIGEA.
 * Divide la pantalla en un Sidebar colapsable a la izquierda y un área principal a la derecha
 * con Topbar (64px), contenedor central `<main>` (padding 32px) con tarjeta blanca y Footer institucional.
 * Consume los datos del usuario autenticado del AuthContext o por props.
 * La campana del Topbar muestra las notificaciones del usuario (HU-11).
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
  const navigate = useNavigate();
  const auth = useAuth();
  const usuario = usuarioProp || auth?.usuario;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sigea-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

  // Cierra el menú de usuario al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    if (onLogoutProp) {
      onLogoutProp();
    } else if (auth?.logout) {
      auth.logout();
    }
  };

  const nombreCompleto = usuario?.nombreCompleto || 'Usuario SIGEA';
  const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles[0] : 'Asistente');
  const email = usuario?.correo || usuario?.email || '';

  return (
    <div className="min-h-screen w-full flex bg-[#edeeef] text-[#1f2023] font-sans antialiased">
      {/* Sidebar Lateral Colapsable */}
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
        {/* Topbar Superior (64px) */}
        <header className="h-16 px-6 sm:px-8 bg-white border-b border-[#e5e7ea] flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Botón de alternancia de la barra lateral */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="p-2 -ml-2 rounded-lg text-[#5b5f66] hover:bg-[#f7f7f8] hover:text-[#1f2023] transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            <h1 className="text-lg font-semibold text-[#1f2023] tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Botón de Notificaciones */}
            <button
              type="button"
              className="p-2 rounded-full text-[#5b5f66] hover:bg-[#f7f7f8] hover:text-[#1f2023] transition-colors relative cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#a6192e]"></span>
            </button>

            {/* Separador */}
            <div className="h-6 w-px bg-[#e5e7ea]"></div>

            {/* Menú de Perfil / Avatar en Topbar */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 select-none p-1.5 rounded-lg hover:bg-[#f7f7f8] transition-colors cursor-pointer text-left"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-9 h-9 rounded-full bg-[#fdecec] border border-[#a6192e]/20 text-[#a6192e] flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden shrink-0">
                  {usuario?.avatarUrl ? (
                    <img src={usuario.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-[#1f2023] leading-tight">
                    {nombreCompleto}
                  </p>
                  <p className="text-[10px] text-[#5b5f66] capitalize">
                    {rol}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#5b5f66] hidden sm:block" />
              </button>

              {/* Menú Desplegable de Usuario */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-[#e5e7ea] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-[#e5e7ea]">
                    <p className="text-xs font-semibold text-[#1f2023] truncate">{nombreCompleto}</p>
                    {email && (
                      <p className="text-[11px] text-[#5b5f66] truncate mt-0.5">{email}</p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-[#fdecec] text-[#a6192e] rounded-full uppercase">
                      {rol}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/cuenta');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-[#1f2023] hover:bg-[#fdecec] hover:text-[#a6192e] transition-colors cursor-pointer"
                  >
                    <UserCog className="w-4 h-4 text-[#a6192e]" />
                    <span>Gestionar Cuenta</span>
                  </button>

                  <div className="border-t border-[#e5e7ea] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#a6192e] hover:bg-[#fdecec] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

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
