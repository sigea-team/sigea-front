import { useCallback, useEffect, useState } from 'react';
import { History, Lock, RefreshCw, AlertTriangle, X } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import AuditoriaFiltros from '../features/auditoria/components/AuditoriaFiltros';
import AuditoriaTabla from '../features/auditoria/components/AuditoriaTabla';
import AuditoriaDetalleModal from '../features/auditoria/components/AuditoriaDetalleModal';
import { servicioAuditoria, mensajeErrorAuditoria } from '../api/auditoriaService';

/**
 * @file AuditoriaPage.jsx
 * @description Vista del log de auditoría de operaciones críticas para el administrador (HU-03, RF56).
 * - Criterio 1: muestra usuario, fecha y hora, acción y datos afectados de cada operación crítica.
 * - Criterio 2: filtros por usuario, tipo de operación y rango de fechas, con paginación.
 * - Criterio 3: vista de solo lectura, sin acciones de edición ni eliminación.
 * @module pages/AuditoriaPage
 */

/** Registros por página. */
const TAMANO_PAGINA = 10;

/** Filtros vacíos. */
const FILTROS_VACIOS = { correo: '', accion: '', desde: '', hasta: '' };

/**
 * @param {Object} props
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 * @param {{ buscar: Function, tiposOperacion: Function }} [props.servicio] - Permite inyectar datos simulados.
 * @param {function(string): void} [props.onSelectNav]
 */
export default function AuditoriaPage({ usuarioProp, servicio = servicioAuditoria, onSelectNav }) {
  // Filtros que el usuario está escribiendo vs. filtros ya aplicados a la consulta
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [consulta, setConsulta] = useState({ filtros: FILTROS_VACIOS, pagina: 0 });
  const [errorFechas, setErrorFechas] = useState(null);

  const [resultado, setResultado] = useState({ cargando: true, datos: null, error: null });
  const [tiposOperacion, setTiposOperacion] = useState([]);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Catálogo de tipos de operación (una sola vez)
  useEffect(() => {
    let activo = true;
    servicio
      .tiposOperacion()
      .then((tipos) => {
        if (activo) setTiposOperacion(Array.isArray(tipos) ? tipos : []);
      })
      .catch(() => {
        // Si falla, el filtro por tipo queda solo con la opción "Todos"; el error
        // principal (permisos, conexión) se muestra al consultar el log.
      });
    return () => {
      activo = false;
    };
  }, [servicio]);

  // Consulta del log cada vez que cambian los filtros aplicados o la página
  useEffect(() => {
    let activo = true;
    servicio
      .buscar({ ...consulta.filtros, pagina: consulta.pagina, tamano: TAMANO_PAGINA })
      .then((datos) => {
        if (activo) setResultado({ cargando: false, datos, error: null });
      })
      .catch((error) => {
        if (activo) setResultado({ cargando: false, datos: null, error: mensajeErrorAuditoria(error) });
      });
    return () => {
      activo = false;
    };
  }, [consulta, servicio]);

  /** Lanza una nueva consulta mostrando el estado de carga. */
  const consultar = useCallback((nuevaConsulta) => {
    setResultado((prev) => ({ ...prev, cargando: true, error: null }));
    setConsulta(nuevaConsulta);
  }, []);

  const handleCambiarFiltro = (campo, valor) => {
    setBorrador((prev) => ({ ...prev, [campo]: valor }));
    if (campo === 'desde' || campo === 'hasta') setErrorFechas(null);
  };

  const handleAplicar = () => {
    if (borrador.desde && borrador.hasta && borrador.desde > borrador.hasta) {
      setErrorFechas('La fecha "Hasta" no puede ser anterior a la fecha "Desde".');
      return;
    }
    consultar({ filtros: { ...borrador, correo: borrador.correo.trim() }, pagina: 0 });
  };

  const handleLimpiar = () => {
    setBorrador(FILTROS_VACIOS);
    setErrorFechas(null);
    consultar({ filtros: FILTROS_VACIOS, pagina: 0 });
  };

  const handleCambiarPagina = (pagina) => consultar({ ...consulta, pagina });

  const handleActualizar = () => consultar({ ...consulta });

  const datos = resultado.datos;

  return (
    <MainLayout
      title="Auditoría del Sistema"
      activeNav="auditoria"
      onSelectNav={onSelectNav}
      usuario={usuarioProp}
    >
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              SIGEA — Trazabilidad
            </span>
            <h2 className="font-serif-title text-3xl text-[#1f2023] mt-1 tracking-tight">
              Auditoría de Operaciones Críticas
            </h2>
            <p className="text-sm text-[#5b5f66] mt-1">
              Consulta quién realizó cada operación crítica, cuándo la hizo y qué datos afectó.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]"
              title="Los registros de auditoría no pueden modificarse ni eliminarse"
            >
              <Lock className="w-3.5 h-3.5 text-[#a6192e]" />
              Solo lectura
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={handleActualizar}
              disabled={resultado.cargando}
              className="h-10 px-4"
            >
              <RefreshCw className={`w-4 h-4 ${resultado.cargando ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        <AuditoriaFiltros
          valores={borrador}
          tiposOperacion={tiposOperacion}
          onCambiar={handleCambiarFiltro}
          onAplicar={handleAplicar}
          onLimpiar={handleLimpiar}
          errorFechas={errorFechas}
          cargando={resultado.cargando}
        />

        {resultado.error && (
          <div
            role="alert"
            className="p-4 rounded-[12px] border border-[#a6192e]/30 bg-[#fdecec] text-[#7a0c1e] text-sm font-medium flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0" />
              <span>{resultado.error}</span>
            </div>
            <button
              type="button"
              onClick={() => setResultado((prev) => ({ ...prev, error: null }))}
              className="p-1 hover:opacity-75 cursor-pointer ml-4"
              title="Cerrar mensaje"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <AuditoriaTabla
          registros={datos?.contenido || []}
          cargando={resultado.cargando}
          pagina={datos?.pagina ?? consulta.pagina}
          tamano={datos?.tamano ?? TAMANO_PAGINA}
          totalElementos={datos?.totalElementos ?? 0}
          totalPaginas={datos?.totalPaginas ?? 1}
          onCambiarPagina={handleCambiarPagina}
          onVerDetalle={setRegistroSeleccionado}
        />
      </div>

      <AuditoriaDetalleModal
        isOpen={Boolean(registroSeleccionado)}
        registro={registroSeleccionado}
        onClose={() => setRegistroSeleccionado(null)}
      />
    </MainLayout>
  );
}
