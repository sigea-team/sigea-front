import { useState, useRef, useEffect } from 'react';
import {
  User,
  ChevronDown,
  UserCog,
  LogOut,
  CalendarDays,
  FileText,
  Info,
  Sparkles,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../store/authStore';
import NotificacionesCampana from '../../features/notificaciones/components/NotificacionesCampana';
import UfpsLogo from './UfpsLogo';

/**
 * Menú desplegable y cajetín de perfil de usuario.
 */
function UserMenu({
  usuario,
  nombreCompleto,
  rol,
  email,
  userMenuOpen,
  setUserMenuOpen,
  userMenuRef,
  navigate,
  handleLogout,
  mostrarOpcionPanel = false,
}) {
  return (
    <div className="relative" ref={userMenuRef}>
      <button
        type="button"
        onClick={() => setUserMenuOpen((prev) => !prev)}
        className="flex items-center gap-2.5 sm:gap-3 select-none p-1.5 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
        aria-label="Menú de usuario"
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

          {mostrarOpcionPanel && (
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                navigate('/dashboard');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-ink-900 hover:bg-brand-100 hover:text-brand-600 transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-600" />
              <span>Ir a mi Panel</span>
            </button>
          )}

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
  );
}

/**
 * @file Topbar.jsx
 * @description Barra superior institucional (64px) unificada para el sistema SIGEA.
 * Soporta dos modos:
 * - **Privado (por defecto):** Título de página activa, campana de notificaciones (HU-11)
 *   y menú de perfil de usuario.
 * - **Público (`variante="publica"`):** Navegación ancla a secciones de la Home y botones
 *   de autenticación (Iniciar sesión / Registrarse), o estado de cuenta institucional unificado si hay sesión.
 * @module components/ui/Topbar
 */
export default function Topbar({
  title = 'Dashboard Principal',
  usuario: usuarioProp,
  onLogout: onLogoutProp,
  apiNotificaciones,
  className = '',
  variante = 'privada',
}) {
  const navigate = useNavigate();
  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const token = useAuthStore((state) => state.token);
  const usuario = usuarioProp || auth?.usuario || storeUser;
  const conSesion = Boolean(token || usuarioProp);

  const nombreCompleto = usuario?.nombreCompleto || usuario?.nombre || 'Usuario SIGEA';
  const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles[0] : 'Asistente');
  const email = usuario?.correo || usuario?.email || '';

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
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

  /* ── Variante Pública (Home / Landing) ── */
  if (variante === 'publica') {
    const scrollASeccion = (e, sectionId) => {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };

    const enlaces = [
      { href: '#eventos', sectionId: 'eventos', label: 'Eventos & Jornadas', icon: CalendarDays },
      { href: '#convocatorias', sectionId: 'convocatorias', label: 'Convocatorias', icon: FileText },
      { href: '#que-es-sigea', sectionId: 'que-es-sigea', label: '¿Qué es SIGEA?', icon: Info },
      { href: '#beneficios', sectionId: 'beneficios', label: 'Beneficios', icon: Sparkles },
    ];

    return (
      <header className={`sticky top-0 z-40 w-full h-16 bg-surface border-b border-border shadow-2xs ${className}`}>
        <div className="w-full h-full px-6 sm:px-8 flex items-center justify-between">
          {/* Identidad institucional: Escudo UFPS + Nombre SIGEA */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-lg p-1">
            <UfpsLogo
              variante="vertical"
              className="h-10 w-auto max-w-[44px] object-contain shrink-0 group-hover:opacity-90 transition-opacity"
            />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-serif-title text-xl font-bold text-brand-600 tracking-tight">SIGEA</span>
                <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Cúcuta
                </span>
              </div>
              <p className="text-[11px] text-ink-600 font-normal">
                Ingeniería de Sistemas · UFPS
              </p>
            </div>
          </Link>

          {/* Enlaces de navegación desktop */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
            {enlaces.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => scrollASeccion(e, item.sectionId)}
                className="px-3 py-2 text-sm font-medium text-ink-600 hover:text-brand-600 hover:bg-surface-muted rounded-[8px] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Acciones de autenticación / perfil + menú móvil */}
          <div className="flex items-center gap-3 sm:gap-4">
            {conSesion ? (
              /* Con sesión: campana de notificaciones + cajetín de cuenta idéntico al topbar privado */
              <div className="flex items-center gap-3 sm:gap-4">
                <NotificacionesCampana api={apiNotificaciones} />
                <div className="h-6 w-px bg-border"></div>
                <UserMenu
                  usuario={usuario}
                  nombreCompleto={nombreCompleto}
                  rol={rol}
                  email={email}
                  userMenuOpen={userMenuOpen}
                  setUserMenuOpen={setUserMenuOpen}
                  userMenuRef={userMenuRef}
                  navigate={navigate}
                  handleLogout={handleLogout}
                  mostrarOpcionPanel={true}
                />
              </div>
            ) : (
              /* Sin sesión: botones de Iniciar sesión y Registrarse */
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="h-10 px-4 rounded-[8px] border border-field-border text-ink-900 bg-white hover:bg-surface-muted font-medium text-sm transition-colors inline-flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <LogIn className="w-4 h-4 text-ink-600" />
                  <span>Iniciar sesión</span>
                </Link>
                <Link
                  to="/registro"
                  className="h-10 px-4 rounded-[8px] bg-brand-600 text-white hover:bg-brand-700 font-medium text-sm transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarse</span>
                </Link>
              </div>
            )}

            {/* Botón menú móvil */}
            <button
              type="button"
              onClick={() => setMenuAbierto((prev) => !prev)}
              className="lg:hidden p-2 rounded-[8px] text-ink-600 hover:text-ink-900 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-expanded={menuAbierto}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            >
              {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {menuAbierto && (
          <div className="lg:hidden border-t border-border bg-white px-6 sm:px-8 pt-3 pb-6 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-1">
              {enlaces.map((item) => {
                const Icono = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      scrollASeccion(e, item.sectionId);
                      setMenuAbierto(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-sm font-medium text-ink-900 hover:bg-surface-muted hover:text-brand-600"
                  >
                    <Icono className="w-4 h-4 text-ink-600" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {conSesion ? (
                <div className="space-y-2 pt-1">
                  <div className="px-3 py-2 bg-surface-muted rounded-[8px] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                      {usuario?.avatarUrl ? (
                        <img src={usuario.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink-900 truncate">{nombreCompleto}</p>
                      <p className="text-[10px] text-ink-600 capitalize truncate">{rol}</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuAbierto(false)}
                    className="w-full h-10 px-3 rounded-[8px] border border-border text-ink-900 font-medium text-xs flex items-center gap-2 hover:bg-surface-muted transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-brand-600" />
                    <span>Ir a mi panel</span>
                  </Link>
                  <Link
                    to="/cuenta"
                    onClick={() => setMenuAbierto(false)}
                    className="w-full h-10 px-3 rounded-[8px] border border-border text-ink-900 font-medium text-xs flex items-center gap-2 hover:bg-surface-muted transition-colors"
                  >
                    <UserCog className="w-4 h-4 text-brand-600" />
                    <span>Gestionar Cuenta</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(false);
                      handleLogout();
                    }}
                    className="w-full h-10 px-3 rounded-[8px] text-brand-600 hover:bg-brand-100 font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuAbierto(false)}
                    className="w-full h-11 rounded-[8px] border border-field-border text-ink-900 font-medium text-sm flex items-center justify-center gap-2 hover:bg-surface-muted"
                  >
                    <LogIn className="w-4 h-4 text-ink-600" />
                    <span>Iniciar sesión</span>
                  </Link>
                  <Link
                    to="/registro"
                    onClick={() => setMenuAbierto(false)}
                    className="w-full h-11 rounded-[8px] bg-brand-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-700 shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrarse en SIGEA</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    );
  }

  /* ── Variante Privada (Dashboard / App interna) ── */
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
        <UserMenu
          usuario={usuario}
          nombreCompleto={nombreCompleto}
          rol={rol}
          email={email}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          userMenuRef={userMenuRef}
          navigate={navigate}
          handleLogout={handleLogout}
          mostrarOpcionPanel={false}
        />
      </div>
    </header>
  );
}
