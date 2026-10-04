import { Eye, ChevronLeft, ChevronRight, User, Cpu } from 'lucide-react';
import { formatearFechaHora, normalizarPaginacion } from '../auditoriaUtils';

/**
 * @file AuditoriaTabla.jsx
 * @description Tabla paginada del log de auditoría (HU-03, Criterios 1 y 2).
 * Muestra quién ejecutó cada operación crítica, qué hizo, sobre qué recurso y cuándo.
 * No incluye acciones de edición ni eliminación: los registros son inmutables (Criterio 3).
 * @module features/auditoria/components/AuditoriaTabla
 */

const FILAS_ESQUELETO = 5;

/**
 * @param {Object} props
 * @param {Array<import('../../../api/auditoriaService').RegistroAuditoria>} [props.registros=[]]
 * @param {boolean} [props.cargando=false]
 * @param {number} [props.pagina=0]           - Página actual (desde 0).
 * @param {number} [props.tamano=10]
 * @param {number} [props.totalElementos=0]
 * @param {number} [props.totalPaginas=1]
 * @param {function(number): void} [props.onCambiarPagina]
 * @param {function(Object): void} [props.onVerDetalle]
 * @param {boolean} [props.hayFiltros=false] - Ajusta el mensaje cuando no hay resultados.
 */
export default function AuditoriaTabla({
  registros = [],
  cargando = false,
  pagina = 0,
  tamano = 10,
  totalElementos = 0,
  totalPaginas = 1,
  onCambiarPagina,
  onVerDetalle,
  hayFiltros = false,
}) {
  // Valores defensivos: totalPaginas mínimo 1 y página siempre dentro del rango.
  const p = normalizarPaginacion({ pagina, tamano, totalElementos, totalPaginas }, 10);
  const desde = p.totalElementos === 0 ? 0 : p.pagina * p.tamano + 1;
  const hasta = Math.min((p.pagina + 1) * p.tamano, p.totalElementos);
  const esPrimera = p.pagina <= 0;
  const esUltima = p.pagina >= p.totalPaginas - 1;

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
              <th className="py-3.5 px-6">Fecha y hora</th>
              <th className="py-3.5 px-6">Usuario</th>
              <th className="py-3.5 px-6">Operación</th>
              <th className="py-3.5 px-6">Recurso afectado</th>
              <th className="py-3.5 px-6 text-right">Datos afectados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
            {cargando ? (
              Array.from({ length: FILAS_ESQUELETO }).map((_, i) => (
                <tr key={`esqueleto-${i}`} aria-hidden="true">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="py-4 px-6">
                      <div className="h-4 rounded bg-[#edeeef] animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-6 text-center">
                  <p className="font-semibold text-base text-[#1f2023]">
                    {hayFiltros ? 'Sin resultados para los filtros aplicados' : 'Aún no hay operaciones críticas registradas'}
                  </p>
                  <p className="text-xs mt-1 text-[#9ca0a6]">
                    {hayFiltros
                      ? 'Prueba ampliando el rango de fechas o usando "Limpiar filtros".'
                      : 'Los registros aparecerán aquí a medida que se ejecuten operaciones críticas.'}
                  </p>
                </td>
              </tr>
            ) : (
              registros.map((r) => {
                const { fecha, hora } = formatearFechaHora(r.fechaHora);
                const esSistema = !r.usuarioId;
                return (
                  <tr key={r.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                    <td className="py-4 px-6 align-middle whitespace-nowrap">
                      <span className="font-medium block">{fecha}</span>
                      <span className="text-xs text-[#5b5f66] font-mono">{hora}</span>
                    </td>

                    <td className="py-4 px-6 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] flex items-center justify-center shrink-0">
                          {esSistema ? (
                            <Cpu className="w-4 h-4 text-[#5b5f66]" />
                          ) : (
                            <User className="w-4 h-4 text-[#a6192e]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold block truncate">{r.usuarioNombre || 'Sistema'}</span>
                          <span className="text-xs text-[#5b5f66] block truncate">
                            {r.usuarioCorreo || 'Operación automática del sistema'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 align-middle max-w-xs">
                      <span className="text-sm block leading-snug">{r.accionDescripcion || r.accion}</span>
                      <span className="text-[11px] font-mono text-[#5b5f66] uppercase tracking-wider">
                        {r.accion}
                      </span>
                    </td>

                    <td className="py-4 px-6 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f7f7f8] text-[#1f2023] border border-[#e5e7ea]">
                        {r.entidad}
                        {r.entidadId != null && <span className="text-[#5b5f66] ml-1">#{r.entidadId}</span>}
                      </span>
                    </td>

                    <td className="py-4 px-6 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => onVerDetalle?.(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#1f2023] bg-white border border-[#d8dadf] hover:bg-[#f7f7f8] hover:border-[#9ca0a6] transition-colors cursor-pointer"
                        title="Ver datos afectados"
                        aria-label={`Ver datos afectados del registro ${r.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-[#5b5f66]" />
                        <span>Ver detalle</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-[#e5e7ea] bg-[#f7f7f8]/50">
        <p className="text-xs text-[#5b5f66]">
          {cargando ? (
            'Consultando registros...'
          ) : (
            <>
              Mostrando <span className="font-bold text-[#1f2023]">{desde}</span>–
              <span className="font-bold text-[#1f2023]">{hasta}</span> de{' '}
              <span className="font-bold text-[#1f2023]">{p.totalElementos}</span> registros
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCambiarPagina?.(p.pagina - 1)}
            disabled={cargando || esPrimera}
            aria-label="Página anterior"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#d8dadf] bg-white text-[#1f2023] hover:bg-[#f7f7f8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>
          <span className="text-xs text-[#5b5f66] px-1" aria-live="polite">
            Página {p.pagina + 1} de {p.totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onCambiarPagina?.(p.pagina + 1)}
            disabled={cargando || esUltima}
            aria-label="Página siguiente"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold border border-[#d8dadf] bg-white text-[#1f2023] hover:bg-[#f7f7f8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
