import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Award, 
  Settings, 
  LogOut,
  User,
  Shield
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../store/authStore';

/**
 * Items por defecto para la navegación del Sidebar de SIGEA.
 */
const DEFAULT_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'convocatorias', label: 'Convocatorias', icon: FileText, href: '/convocatorias' },
  { id: 'eventos', label: 'Eventos', icon: Calendar, href: '/eventos' },
  { id: 'certificados', label: 'Certificados', icon: Award, href: '/certificados' },
  { id: 'configuracion', label: 'Configuración', icon: Settings, href: '/configuracion' },
];

const ADMIN_NAV_ITEM = {
  id: 'roles',
  label: 'Administrar Roles y Permisos',
  icon: Shield,
  href: '/roles',
};

/**
 * @file Sidebar.jsx
 * @description Sidebar de navegación lateral fija (260px) para el sistema SIGEA.
 * Maneja el encabezado de marca institucional, ítems con estado activo/hover y
 * tarjeta inferior de perfil de usuario con datos del usuario logueado (nombre, email, rol)
 * y acción de cierre de sesión. Muestra 'Administrar Roles y Permisos' en caso de rol ADMIN.
 * @module components/ui/Sidebar
 */
export default function Sidebar({
  activeItem = 'dashboard',
  onSelectNav,
  usuario: usuarioProp,
  onLogout: onLogoutProp,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = usuarioProp || auth?.usuario || storeUser;

  const handleLogout = () => {
    if (onLogoutProp) {
      onLogoutProp();
    } else if (auth?.logout) {
      auth.logout();
    }
  };

  const handleNavClick = (item) => {
    if (onSelectNav) {
      onSelectNav(item.id);
    }
    if (item.href) {
      navigate(item.href);
    }
  };

  const nombreCompleto = usuario?.nombreCompleto || 'Usuario SIGEA';
  const email = usuario?.email || usuario?.correo || 'usuario@ufps.edu.co';
  const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles[0] : 'Asistente');

  const isAdmin =
    String(rol).toUpperCase() === 'ADMIN' ||
    String(rol).toUpperCase() === 'ADMINISTRADOR' ||
    (Array.isArray(usuario?.roles) &&
      usuario.roles.some((r) => String(r).toUpperCase() === 'ADMIN' || String(r).toUpperCase() === 'ADMINISTRADOR'));

  const navItems = [...DEFAULT_NAV_ITEMS];
  if (isAdmin) {
    const configIndex = navItems.findIndex((item) => item.id === 'configuracion');
    if (configIndex !== -1) {
      navItems.splice(configIndex, 0, ADMIN_NAV_ITEM);
    } else {
      navItems.push(ADMIN_NAV_ITEM);
    }
  }

  return (
    <aside className={`w-[260px] h-screen flex flex-col bg-white border-r border-[#e5e7ea] shrink-0 select-none ${className}`}>
      {/* Header del Sidebar: Marca SIGEA / UFPS */}
      <div className="h-16 px-6 border-b border-[#e5e7ea] flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#a6192e] flex items-center justify-center text-white font-bold text-sm shadow-sm">
          UFPS
        </div>
        <div>
          <span className="font-serif-title text-xl text-[#a6192e] tracking-tight block leading-none">
            SIGEA
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-[#5b5f66] uppercase block mt-0.5">
            Eventos Académicos
          </span>
        </div>
      </div>

      {/* Menú de Navegación Principal */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold text-[#9ca0a6] uppercase tracking-wider mb-2">
          Navegación
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const currentPath = location?.pathname;
          const isActive =
            activeItem === item.id ||
            activeItem === item.label.toLowerCase() ||
            (currentPath && item.href && currentPath === item.href);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-sm font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[#fdecec] text-[#a6192e]'
                  : 'text-[#1f2023] hover:bg-[#f7f7f8] hover:text-[#a6192e]'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#a6192e]' : 'text-[#5b5f66]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Perfil de Usuario y Cerrar Sesión (Pie del Sidebar) */}
      <div className="p-4 border-t border-[#e5e7ea] bg-[#f7f7f8]/50 shrink-0 space-y-3">
        

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[8px] text-xs font-semibold text-[#a6192e] hover:bg-[#fdecec] transition-colors cursor-pointer border border-[#a6192e]/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
