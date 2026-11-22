import { useState } from 'react';
import UfpsLogo from './UfpsLogo';
import SidebarNavItem from './SidebarNavItem';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Award, 
  Settings, 
  LogOut,
  UserCog,
  Shield,
  History,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Mic,
  Building,
  CalendarClock,
  FileStack,
  ClipboardList,
  Archive,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RUTA_MI_PERFIL_CONFERENCISTA, esModoConferencista, useAuthStore } from '../../store/authStore';
import { esAdministrador, veEvaluaciones, veEventos } from '../../utils/permisos';
import { veMemoriaHistorica } from '../../features/memoria/memoriaUtils';

/**
 * Items por defecto para la navegación del Sidebar de SIGEA.
 */
const DEFAULT_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'convocatorias', label: 'Convocatorias', icon: FileText, href: '/convocatorias' },
  { id: 'eventos', label: 'Eventos', icon: Calendar, href: '/eventos' },
  { id: 'certificados', label: 'Certificados', icon: Award, href: '/certificados' },
  { id: 'cuenta', label: 'Mi Cuenta', icon: UserCog, href: '/cuenta' },
];

/** HU-14: propuestas del autor, sus versiones y modificación. */
const MIS_PROPUESTAS_NAV_ITEM = {
  id: 'mis-propuestas',
  label: 'Mis propuestas',
  icon: FileStack,
  href: '/mis-propuestas',
};

/** HU-25: encuestas de satisfacción de los eventos y actividades a los que asistió el usuario. */
const MIS_ENCUESTAS_NAV_ITEM = {
  id: 'mis-encuestas',
  label: 'Mis encuestas',
  icon: ClipboardList,
  href: '/mis-encuestas',
};

/** HU-17: evaluaciones de propuestas asignadas según rúbrica */
const EVALUADOR_NAV_ITEM = {
  id: 'evaluaciones',
  label: 'Evaluaciones',
  icon: ClipboardCheck,
  href: '/evaluaciones',
};

const ADMIN_NAV_ITEM = {
  id: 'roles',
  label: 'Administrar Roles y Permisos',
  icon: Shield,
  href: '/roles',
};

/** HU-03: consulta del log de auditoría (solo administradores). */
const AUDITORIA_NAV_ITEM = {
  id: 'auditoria',
  label: 'Auditoría',
  icon: History,
  href: '/auditoria',
};

/** HU-12: perfil propio del conferencista invitado (solo con el perfil de ingreso «Conferencista»). */
const MI_PERFIL_CONFERENCISTA_NAV_ITEM = {
  id: 'mi-perfil-conferencista',
  label: 'Mi trayectoria',
  icon: Mic,
  href: RUTA_MI_PERFIL_CONFERENCISTA,
};

/** HU-20: Crear y configurar salas y disponibilidad */
const SALAS_NAV_ITEM = {
  id: 'salas',
  label: 'Salas y Espacios',
  icon: Building,
  href: '/salas',
};

/** HU-28: archivo de los eventos cerrados formalmente (memoria histórica). */
const MEMORIA_HISTORICA_NAV_ITEM = {
  id: 'memoria-historica',
  label: 'Memoria histórica',
  icon: Archive,
  href: '/memoria-historica',
};

/** HU-21: Programar actividades de la agenda controlando conflictos y simultáneas */
const AGENDA_NAV_ITEM = {
  id: 'agenda',
  label: 'Agenda de Actividades',
  icon: CalendarClock,
  href: '/agenda',
};

/**
 * @file Sidebar.jsx
 * @description Sidebar de navegación lateral colapsable para el sistema SIGEA.
 * Maneja el encabezado de marca institucional con botón de colapso,
 * ítems de navegación con soporte para vista normal y colapsada (iconos con tooltip),
 * y acción de cierre de sesión en el pie.
 * @module components/ui/Sidebar
 */
export default function Sidebar({
  activeItem = 'dashboard',
  onSelectNav,
  usuario: usuarioProp,
  onLogout: onLogoutProp,
  collapsed: collapsedProp,
  onToggleCollapse,
  className = '',
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

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

  // Misma regla que AdminRoute: el menú y las rutas deciden igual quién es administrador.
  const isAdmin = esAdministrador(usuario);
  const esPonente =
    usuario?.modoIngreso === 'PONENTE' ||
    usuario?.roles?.includes('PONENTE') ||
    usuario?.roles?.includes('AUTOR');
  const esConferencista = esModoConferencista(usuario);

  let navItems;

  // Criterio Ponente: Si la persona ingresa como ponente, únicamente le sale en el sidebar
  // las opciones para gestión y envío de propuestas.
  if (esPonente && !isAdmin) {
    navItems = [
      MIS_PROPUESTAS_NAV_ITEM,
      { id: 'convocatorias', label: 'Enviar propuesta', icon: FileText, href: '/convocatorias' },
    ];
  } else {
    // Para administradores y otros roles:
    navItems = DEFAULT_NAV_ITEMS.filter((item) => {
      // Convocatorias solo visible para administradores en este flujo (los ponentes van por el flujo dedicado de arriba)
      if (item.id === 'convocatorias') {
        return isAdmin;
      }
      // Con el perfil «Evaluador» no se muestran Eventos ni Certificados
      if (item.id === 'eventos' || item.id === 'certificados') {
        return veEventos(usuario);
      }
      return true;
    });

    // Las propuestas SOLO se muestran a quien ingrese expresamente como ponente (manejado arriba).
    // Un administrador o asistente nunca ve "Mis propuestas" ni opciones de envío de propuestas.

    if (esConferencista) {
      navItems.splice(1, 0, MI_PERFIL_CONFERENCISTA_NAV_ITEM);
    }

    // HU-25: quien asiste a eventos responde sus encuestas de satisfacción (no aplica al perfil «Evaluador»).
    if (veEventos(usuario)) {
      const cuentaIndex = navItems.findIndex((item) => item.id === 'cuenta');
      navItems.splice(cuentaIndex === -1 ? navItems.length : cuentaIndex, 0, MIS_ENCUESTAS_NAV_ITEM);
    }

    // Evaluaciones: solo si entró con el perfil «Evaluador» (y la cuenta tiene el permiso) o es administrador.
    // Una cuenta con permiso de evaluador que entra como Asistente no lo ve.
    if (veEvaluaciones(usuario)) {
      const eventosIndex = navItems.findIndex((item) => item.id === 'eventos');
      if (eventosIndex !== -1) {
        navItems.splice(eventosIndex, 0, EVALUADOR_NAV_ITEM);
      } else {
        navItems.push(EVALUADOR_NAV_ITEM);
      }
    }

    if (isAdmin) {
      const evIdx = navItems.findIndex((item) => item.id === 'eventos');
      if (evIdx !== -1) {
        navItems.splice(evIdx + 1, 0, AGENDA_NAV_ITEM, SALAS_NAV_ITEM);
      } else {
        navItems.push(AGENDA_NAV_ITEM, SALAS_NAV_ITEM);
      }
      const cuentaIndex = navItems.findIndex((item) => item.id === 'cuenta');
      if (cuentaIndex !== -1) {
        navItems.splice(cuentaIndex, 0, ADMIN_NAV_ITEM, AUDITORIA_NAV_ITEM);
      } else {
        navItems.push(ADMIN_NAV_ITEM, AUDITORIA_NAV_ITEM);
      }
    }

    // HU-28: memoria histórica para administradores y cuentas con permiso de memoria histórica o de reportes,
    // después de Salas (o de Eventos). No aplica al perfil «Evaluador».
    if (veEventos(usuario) && veMemoriaHistorica(usuario)) {
      const anclaIdx = ['salas', 'agenda', 'eventos']
        .map((id) => navItems.findIndex((item) => item.id === id))
        .find((indice) => indice !== -1);
      navItems.splice(anclaIdx === undefined ? navItems.length : anclaIdx + 1, 0, MEMORIA_HISTORICA_NAV_ITEM);
    }
  }

  return (
    <aside
      className={`h-screen flex flex-col bg-brand-700 border-r border-brand-600 shrink-0 select-none overflow-x-hidden transition-[width] duration-300 ease-in-out ${
        isCollapsed ? 'w-[7px]' : 'w-[276px]'
      } ${className}`}
      aria-expanded={!isCollapsed}
    >
      {/* Header del Sidebar: Marca SIGEA / UFPS con botón de colapso */}
      <div
        className={`h-16 border-b border-brand-600 flex items-center shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={handleToggle}
            title="Expandir menú lateral"
            aria-label="Expandir menú lateral"
            className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm hover:bg-white/90 transition-colors cursor-pointer group"
          >
            <UfpsLogo
              variante="vertical"
              className="w-full h-full object-contain group-hover:hidden"
            />
            <ChevronRight className="w-5 h-5 text-brand-600 hidden group-hover:block" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              {/*<div className="w-16 h-16 p-1 flex items-center justify-center shadow-sm shrink-0">*/}
                <UfpsLogo
                  variante="white"
                  className="w-16 p-0 m-0 h-full object-contain"
                />
              {/*</div>*/}
              <div className="min-w-0">
                <span className="font-serif-title text-xl text-surface tracking-tight block leading-none">
                  SIGEA
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-brand-100 uppercase block mt-0.5 truncate">
                  Eventos Académicos
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              title="Colapsar menú lateral"
              aria-label="Colapsar menú lateral"
              className="p-1.5 rounded-lg text-brand-100 hover:bg-brand-600 hover:text-surface transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Menú de Navegación Principal */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {!isCollapsed ? (
          <p className="px-3 text-[11px] font-bold text-brand-100 uppercase tracking-wider mb-2">
            Navegación
          </p>
        ) : (
          <div className="my-2 border-t border-brand-600 mx-2" />
        )}

        {navItems.map((item) => {
          const currentPath = location?.pathname;
          const isActive =
            activeItem === item.id ||
            activeItem === item.label.toLowerCase() ||
            Boolean(currentPath && item.href && (currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href))));

          return (
            <SidebarNavItem
              key={item.id}
              item={item}
              isActive={isActive}
              isCollapsed={isCollapsed}
              onClick={handleNavClick}
            />
          );
        })}
      </nav>

      {/* Pie del Sidebar: Solo Cerrar Sesión (sin vista de cuenta/perfil) */}
      <div className={`border-t border-brand-600 bg-brand-700 shrink-0 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className="relative group">
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar sesión' : undefined}
            aria-label="Cerrar sesión"
            className={`w-full flex items-center rounded-[8px] text-xs font-semibold text-brand-100 hover:bg-brand-600 hover:text-surface transition-colors cursor-pointer border border-brand-100 ${
              isCollapsed ? 'justify-center h-11 px-0' : 'justify-center gap-2 px-3 py-2.5'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Cerrar sesión</span>}
          </button>

          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-brand-600 text-surface text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              Cerrar sesión
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
