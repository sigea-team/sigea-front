/**
 * @file SidebarNavItem.jsx
 * @description Componente individual para los ítems de navegación del Sidebar en SIGEA.
 * Soporta estados activo e inactivo, modo colapsado con tooltip flotante accesible e icono dinámico.
 * @module components/ui/SidebarNavItem
 */
export default function SidebarNavItem({
  item,
  isActive = false,
  isCollapsed = false,
  onClick,
}) {
  const Icon = item.icon;

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => onClick && onClick(item)}
        title={isCollapsed ? item.label : undefined}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full flex items-center rounded-[8px] text-sm font-medium transition-colors cursor-pointer ${
          isCollapsed ? 'justify-center h-11 px-0' : 'gap-3 px-3.5 py-2.5 text-left'
        } ${
          isActive
            ? 'bg-surface text-brand-600'
            : 'text-surface hover:bg-brand-600 hover:text-surface'
        }`}
      >
        {Icon && (
          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-600' : 'text-surface'}`} />
        )}
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </button>

      {/* Tooltip flotante al estar colapsado */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-ink-900 text-surface text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
          {item.label}
        </div>
      )}
    </div>
  );
}
