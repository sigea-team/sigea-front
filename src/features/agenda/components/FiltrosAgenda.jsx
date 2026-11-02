import { Search, Layers, X } from 'lucide-react';

/**
 * @file FiltrosAgenda.jsx
 * @description Barra de búsqueda y filtros rápidos para la agenda (HU-21).
 */
export default function FiltrosAgenda({
  busqueda,
  onCambiarBusqueda,
  filtroFecha,
  onCambiarFecha,
  fechasDisponibles = [],
  filtroSala,
  onCambiarSala,
  salas = [],
  soloSimultaneas,
  onCambiarSoloSimultaneas,
  onLimpiarFiltros,
  hayFiltrosActivos,
}) {
  const opcionesFechas = [
    { value: '', label: 'Todas las fechas' },
    ...fechasDisponibles.map((f) => ({ value: f, label: f })),
  ];

  const opcionesSalas = [
    { value: '', label: 'Todas las salas' },
    ...salas.map((s) => ({ value: String(s.id ?? s.salaId), label: s.nombre })),
  ];

  return (
    <div className="p-3.5 bg-white border border-[#e5e7ea] rounded-xl space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Buscador de texto */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9ca0a6] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por actividad o ponente..."
            value={busqueda}
            onChange={(e) => onCambiarBusqueda(e.target.value)}
            className="w-full text-xs h-9 pl-9 pr-3 rounded-lg border border-[#d8dadf] bg-[#fafbfc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
          />
        </div>

        {/* Filtro por fecha */}
        <div>
          <select
            value={filtroFecha}
            onChange={(e) => onCambiarFecha(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg border border-[#d8dadf] bg-[#fafbfc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
          >
            {opcionesFechas.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por sala */}
        <div>
          <select
            value={filtroSala}
            onChange={(e) => onCambiarSala(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg border border-[#d8dadf] bg-[#fafbfc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
          >
            {opcionesSalas.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle de solo simultáneas y botón limpiar */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <label className="flex items-center gap-1.5 text-xs text-[#1f2023] font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloSimultaneas}
              onChange={(e) => onCambiarSoloSimultaneas(e.target.checked)}
              className="rounded border-[#d8dadf] text-[#a6192e] focus:ring-[#a6192e]"
            />
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Solo simultáneas</span>
          </label>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#a6192e] hover:underline cursor-pointer ml-2"
              title="Restablecer filtros"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
