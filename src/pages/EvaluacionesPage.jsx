import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import EvaluacionesTable from '../features/evaluaciones/components/EvaluacionesTable';
import EvaluacionFormModal from '../features/evaluaciones/components/EvaluacionFormModal';
import ResultadoEvaluacionModal from '../features/evaluaciones/components/ResultadoEvaluacionModal';
import HistorialVersionesModal from '../features/propuestas/components/HistorialVersionesModal';
import ObservacionesPropuestaModal from '../features/observaciones/components/ObservacionesPropuestaModal';
import { observacionService } from '../api/observacionService';
import { evaluacionService } from '../api/evaluacionService';
import { propuestaService } from '../api/propuestaService';
import { calcularPuntuacionPonderada } from '../features/evaluaciones/evaluacionUtils';

/**
 * @file EvaluacionesPage.jsx
 * @description Vista principal para el registro de evaluaciones y cálculo de puntuación ponderada (HU-17).
 *
 * Permite al evaluador:
 *  - Visualizar sus propuestas asignadas con estado y periodo de evaluación.
 *  - Calificar cada criterio de la rúbrica con retroalimentación (Criterio 1 y 2).
 *  - Verificación en vivo de completitud y restricción de periodo cerrado (Criterio 4).
 *  - Consultar el dictamen consolidado y alerta de incompletitud (Criterio 3).
 *  - HU-14, Criterio 4: consultar el historial de versiones de las propuestas asignadas.
 *  - HU-19: registrar observaciones y ajustes requeridos y dar por resueltos los que el autor atendió.
 * @module pages/EvaluacionesPage
 */

/**
 * @param {Object} props
 * @param {typeof propuestaService} [props.apiPropuestas] - API de propuestas para el historial de versiones (HU-14).
 * @param {typeof observacionService} [props.apiObservaciones] - API de observaciones (HU-19).
 */
export default function EvaluacionesPage({ apiPropuestas = propuestaService, apiObservaciones = observacionService }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'pendiente' | 'completada'
  // HU-14: propuesta cuyo historial de versiones se consulta
  const [historialPropuesta, setHistorialPropuesta] = useState(null);
  // HU-19: propuesta cuyas observaciones se gestionan
  const [observacionesPropuesta, setObservacionesPropuesta] = useState(null);

  // Estados de modales
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [modalEvaluacionAbierto, setModalEvaluacionAbierto] = useState(false);

  const [propuestaResultado, setPropuestaResultado] = useState(null);
  const [modalResultadoAbierto, setModalResultadoAbierto] = useState(false);

  // Carga de datos
  const cargarAsignaciones = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const data = await evaluacionService.listarAsignaciones();
      setAsignaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar asignaciones de evaluación:', err);
      setAsignaciones([]);
      setErrorCarga(
        err?.response?.data?.message || 'No fue posible cargar tus asignaciones de evaluación. Intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarAsignaciones();
  }, [cargarAsignaciones]);

  // Manejadores de modales
  const handleAbrirEvaluacion = (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setModalEvaluacionAbierto(true);
  };

  const handleCerrarEvaluacion = () => {
    setModalEvaluacionAbierto(false);
    setAsignacionSeleccionada(null);
  };

  const handleVerResultado = (asignacion) => {
    setPropuestaResultado({
      id: asignacion.propuestaId,
      titulo: asignacion.propuestaTitulo,
    });
    setModalResultadoAbierto(true);
  };

  const handleCerrarResultado = () => {
    setModalResultadoAbierto(false);
    setPropuestaResultado(null);
  };

  const handleGuardadoExitoso = () => {
    cargarAsignaciones();
  };

  // Filtrado de asignaciones
  const asignacionesFiltradas = useMemo(() => {
    return asignaciones.filter((item) => {
      const coincideEstado =
        filtroEstado === 'todos' || item.estado === filtroEstado;

      const q = terminoBusqueda.toLowerCase().trim();
      const coincideBusqueda =
        !q ||
        item.propuestaTitulo?.toLowerCase().includes(q) ||
        item.convocatoriaTitulo?.toLowerCase().includes(q) ||
        (Array.isArray(item.autores) &&
          item.autores.some((a) => a.toLowerCase().includes(q)));

      return coincideEstado && coincideBusqueda;
    });
  }, [asignaciones, filtroEstado, terminoBusqueda]);

  // Métricas rápidas
  const metricas = useMemo(() => {
    const total = asignaciones.length;
    const pendientes = asignaciones.filter((a) => a.estado !== 'completada').length;
    const completadas = asignaciones.filter((a) => a.estado === 'completada').length;

    let sumaNotas = 0;
    let cantCompletadas = 0;
    asignaciones.forEach((a) => {
      if (a.estado === 'completada' && Array.isArray(a.evaluaciones)) {
        const nota = calcularPuntuacionPonderada(a.evaluaciones, a.evaluaciones);
        if (nota !== null) {
          sumaNotas += nota;
          cantCompletadas += 1;
        }
      }
    });

    const promedio = cantCompletadas > 0 ? (sumaNotas / cantCompletadas).toFixed(2) : '—';

    return { total, pendientes, completadas, promedio };
  }, [asignaciones]);

  return (
    <MainLayout title="Evaluación de Propuestas" activeNav="evaluaciones">
      <div className="space-y-6">
        {/* Encabezado institucional */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              SIGEA • Arbitraje y Rúbricas
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-1">
              Evaluación de Propuestas Académicas
            </h1>
            <p className="text-xs sm:text-sm text-ink-600 mt-1 max-w-2xl">
              Califica las ponencias asignadas aplicando los criterios y pesos de la rúbrica oficial (HU-17). El sistema calculará automáticamente la puntuación ponderada y validará la completitud del arbitraje.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cargarAsignaciones}
              loading={cargando}
              title="Actualizar listado de asignaciones"
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        {errorCarga && (
          <div role="alert" className="flex items-start gap-3 p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-brand-600" />
            <p className="text-sm">{errorCarga}</p>
          </div>
        )}

        {/* Tarjetas de métricas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-[12px] bg-surface-muted border border-border">
            <div className="flex items-center justify-between text-ink-600">
              <span className="text-xs font-medium">Total Asignadas</span>
              <ClipboardCheck className="w-4 h-4 text-brand-600" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-ink-900 font-bold mt-2">
              {metricas.total}
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-surface-muted border border-border">
            <div className="flex items-center justify-between text-ink-600">
              <span className="text-xs font-medium">Por Calificar</span>
              <Clock className="w-4 h-4 text-brand-700" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-brand-700 font-bold mt-2">
              {metricas.pendientes}
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-surface-muted border border-border">
            <div className="flex items-center justify-between text-ink-600">
              <span className="text-xs font-medium">Completadas</span>
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-brand-600 font-bold mt-2">
              {metricas.completadas}
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-surface-muted border border-border">
            <div className="flex items-center justify-between text-ink-600">
              <span className="text-xs font-medium">Promedio Otorgado</span>
              <Award className="w-4 h-4 text-brand-600" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-brand-600 font-bold mt-2">
              {metricas.promedio}
            </p>
          </div>
        </div>

        {/* Barra de filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-border">
          {/* Pestañas de estado */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-muted rounded-[8px] border border-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                filtroEstado === 'todos'
                  ? 'bg-white text-brand-600 shadow-2xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Todas ({metricas.total})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('pendiente')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                filtroEstado === 'pendiente'
                  ? 'bg-white text-brand-700 shadow-2xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Pendientes ({metricas.pendientes})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('completada')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                filtroEstado === 'completada'
                  ? 'bg-white text-brand-600 shadow-2xs'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Completadas ({metricas.completadas})
            </button>
          </div>

          {/* Campo de búsqueda */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-ink-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Buscar por título, autor o convocatoria..."
              className="w-full pl-9 pr-3 py-1.5 rounded-[8px] border border-border text-xs outline-hidden focus:border-brand-600 focus:ring-2 focus:ring-brand-600 transition-all"
            />
          </div>
        </div>

        {/* Tabla principal */}
        <EvaluacionesTable
          asignaciones={asignacionesFiltradas}
          cargando={cargando}
          hayFiltros={Boolean(terminoBusqueda) || filtroEstado !== 'todos'}
          onAbrirEvaluacion={handleAbrirEvaluacion}
          onVerResultado={handleVerResultado}
          onVerVersiones={(asignacion) =>
            setHistorialPropuesta({ id: asignacion.propuestaId, titulo: asignacion.propuestaTitulo })
          }
          onVerObservaciones={(asignacion) =>
            setObservacionesPropuesta({ id: asignacion.propuestaId, titulo: asignacion.propuestaTitulo })
          }
        />

        {/* Modales */}
        {modalEvaluacionAbierto && asignacionSeleccionada && (
          <EvaluacionFormModal
            key={asignacionSeleccionada.asignacionId}
            isOpen
            asignacion={asignacionSeleccionada}
            onClose={handleCerrarEvaluacion}
            onGuardadoExitoso={handleGuardadoExitoso}
          />
        )}

        <ResultadoEvaluacionModal
          isOpen={modalResultadoAbierto}
          propuestaId={propuestaResultado?.id}
          propuestaTitulo={propuestaResultado?.titulo}
          onClose={handleCerrarResultado}
        />

        {/* HU-14, Criterio 4: el evaluador asignado consulta las versiones de la propuesta */}
        {historialPropuesta && (
          <HistorialVersionesModal
            key={`historial-${historialPropuesta.id}`}
            propuesta={historialPropuesta}
            api={apiPropuestas}
            onClose={() => setHistorialPropuesta(null)}
          />
        )}

        {/* HU-19: el evaluador asignado registra observaciones y resuelve los ajustes atendidos */}
        {observacionesPropuesta && (
          <ObservacionesPropuestaModal
            key={`observaciones-${observacionesPropuesta.id}`}
            propuesta={observacionesPropuesta}
            modo="evaluador"
            api={apiObservaciones}
            onClose={() => setObservacionesPropuesta(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
