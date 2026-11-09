import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, UserCog, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../store/authStore';
import NotificacionesCampana from '../../features/notificaciones/components/NotificacionesCampana';

/**
 * @file Topbar.jsx
 * @description Barra superior institucional (64px) independiente para el sistema SIGEA.
 * Maneja el título de la página activa, la campana de notificaciones (HU-11)
 * y el menú de perfil de usuario con acceso a la gestión de cuenta y cierre de sesión.
 * @module components/ui/Topbar
 */
export default function Topbar({
  title = 'Dashboard Principal',
  usuario: usuarioProp,
  onLogout: onLogoutProp,
  apiNotificaciones,
  className = '',
}) {
  const navigate = useNavigate();
  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = usuarioProp || auth?.usuario || storeUser;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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
    <header className={`h-16 px-6 sm:px-8 bg-surface border-b border-border flex items-center justify-between shrink-0 shadow-2xs ${className}`}>
      {/* Título de la vista actual */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-ink-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Extremo derecho: Notificaciones, separador y menú de usuario */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Campana de Notificaciones (HU-11) */}
        <NotificacionesCampana api={apiNotificaciones} />

        {/* Separador */}
        <div className="h-6 w-px bg-border"></div>

        {/* Menú de Perfil / Avatar de Usuario */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 select-none p-1.5 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer text-left"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden shrink-0">
              {usuario?.avatarUrl ? (
                <img src={usuario.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-ink-900 leading-tight">
                {nombreCompleto}
              </p>
              <p className="text-[10px] text-ink-600 capitalize">
                {rol}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-ink-300 hidden sm:block" />
          </button>

          {/* Menú desplegable */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-xs font-semibold text-ink-900 truncate">{nombreCompleto}</p>
                {email && (
                  <p className="text-[11px] text-ink-600 truncate mt-0.5">{email}</p>
                )}
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-brand-100 text-brand-600 rounded-full uppercase">
                  {rol}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/cuenta');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-ink-900 hover:bg-brand-100 hover:text-brand-600 transition-colors cursor-pointer"
              >
                <UserCog className="w-4 h-4 text-brand-600" />
                <span>Gestionar Cuenta</span>
              </button>

              <div className="border-t border-border my-1" />

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-brand-600 hover:bg-brand-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
