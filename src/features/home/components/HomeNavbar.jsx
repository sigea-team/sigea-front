import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FileText, Info, LayoutDashboard, LogIn, Menu, UserPlus, X, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

/**
 * @file HomeNavbar.jsx
 * @description Barra de navegación pública superior institucional de SIGEA.
 * Permite navegar a secciones ancla de la home y acceder a login/registro o panel de usuario.
 * @module features/home/components/HomeNavbar
 */
export default function HomeNavbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const token = useAuthStore((state) => state.token);
  const usuario = useAuthStore((state) => state.usuario);
  const conSesion = Boolean(token);

  const enlaces = [
    { href: '#eventos', label: 'Eventos & Agenda', icon: CalendarDays },
    { href: '#convocatorias', label: 'Convocatorias', icon: FileText },
    { href: '#que-es-sigea', label: '¿Qué es SIGEA?', icon: Info },
    { href: '#beneficios', label: 'Beneficios', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Identidad institucional: Escudo UFPS + Nombre SIGEA */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-lg p-1">
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-sm group-hover:bg-brand-700 transition-colors">
            UFPS
          </div>
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
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Navegación principal">
          {enlaces.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-ink-600 hover:text-brand-600 hover:bg-surface-muted rounded-[8px] transition-colors"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/convocatorias-publicas"
            className="px-3 py-2 text-sm font-medium text-ink-600 hover:text-brand-600 hover:bg-surface-muted rounded-[8px] transition-colors"
          >
            Portal Convocatorias
          </Link>
        </nav>

        {/* Acciones de autenticación */}
        <div className="hidden sm:flex items-center gap-3">
          {conSesion ? (
            <Link
              to="/dashboard"
              className="h-10 px-4 rounded-[8px] bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{usuario?.nombreCompleto || usuario?.nombre || 'Mi panel'}</span>
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Botón menú móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto((prev) => !prev)}
          className="md:hidden p-2 rounded-[8px] text-ink-600 hover:text-ink-900 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <div className="md:hidden border-t border-border bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            {enlaces.map((item) => {
              const Icono = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-sm font-medium text-ink-900 hover:bg-surface-muted hover:text-brand-600"
                >
                  <Icono className="w-4 h-4 text-ink-600" />
                  <span>{item.label}</span>
                </a>
              );
            })}
            <Link
              to="/convocatorias-publicas"
              onClick={() => setMenuAbierto(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-sm font-medium text-ink-900 hover:bg-surface-muted hover:text-brand-600"
            >
              <FileText className="w-4 h-4 text-ink-600" />
              <span>Portal de Convocatorias</span>
            </Link>
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {conSesion ? (
              <Link
                to="/dashboard"
                onClick={() => setMenuAbierto(false)}
                className="w-full h-11 rounded-[8px] bg-brand-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-700"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ir a mi panel ({usuario?.nombreCompleto || usuario?.nombre || 'Usuario'})</span>
              </Link>
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
