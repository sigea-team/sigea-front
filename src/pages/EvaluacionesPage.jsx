import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import EvaluacionesTable from '../features/evaluaciones/components/EvaluacionesTable';
import EvaluacionFormModal from '../features/evaluaciones/components/EvaluacionFormModal';
import ResultadoEvaluacionModal from '../features/evaluaciones/components/ResultadoEvaluacionModal';
import { evaluacionService } from '../api/evaluacionService';
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
 * @module pages/EvaluacionesPage
 */

export default function EvaluacionesPage() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'pendiente' | 'completada'

  // Estados de modales
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [modalEvaluacionAbierto, setModalEvaluacionAbierto] = useState(false);

  const [propuestaResultado, setPropuestaResultado] = useState(null);
  const [modalResultadoAbierto, setModalResultadoAbierto] = useState(false);

  // Carga de datos
  const cargarAsignaciones = useCallback(async () => {
    setCargando(true);
    try {
      const data = await evaluacionService.listarAsignaciones();
      setAsignaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar asignaciones de evaluación:', err);
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

  const handleRestablecerDemo = () => {
    evaluacionService.restablecerDatosDemo();
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e]">
              SIGEA • Arbitraje y Rúbricas
            </span>
            <h1 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1">
              Evaluación de Propuestas Académicas
            </h1>
            <p className="text-xs sm:text-sm text-[#5b5f66] mt-1 max-w-2xl">
              Califica las ponencias asignadas aplicando los criterios y pesos de la rúbrica oficial (HU-17). El sistema calculará automáticamente la puntuación ponderada y validará la completitud del arbitraje.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestablecerDemo}
              title="Restablecer datos de prueba para verificar los 4 criterios de aceptación"
              className="text-xs text-[#5b5f66]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer demo</span>
            </Button>

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

        {/* Tarjetas de métricas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <div className="flex items-center justify-between text-[#5b5f66]">
              <span className="text-xs font-medium">Total Asignadas</span>
              <ClipboardCheck className="w-4 h-4 text-[#a6192e]" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] font-bold mt-2">
              {metricas.total}
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <div className="flex items-center justify-between text-[#5b5f66]">
              <span className="text-xs font-medium">Por Calificar</span>
              <Clock className="w-4 h-4 text-[#b54708]" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-[#b54708] font-bold mt-2">
              {metricas.pendientes}
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <div className="flex items-center justify-between text-[#5b5f66]">
              <span className="text-xs font-medium">Completadas</span>
              <CheckCircle2 className="w-4 h-4 text-[#107e3e]" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-[#107e3e] font-bold mt-2">
              {metricas.completadas}
            </p>
          </div>

          <div className="p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <div className="flex items-center justify-between text-[#5b5f66]">
              <span className="text-xs font-medium">Promedio Otorgado</span>
              <Award className="w-4 h-4 text-[#a6192e]" />
            </div>
            <p className="font-serif-title text-2xl sm:text-3xl text-[#a6192e] font-bold mt-2">
              {metricas.promedio}
            </p>
          </div>
        </div>

        {/* Barra de filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-[#e5e7ea]">
          {/* Pestañas de estado */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f7f7f8] rounded-[8px] border border-[#e5e7ea] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                filtroEstado === 'todos'
                  ? 'bg-white text-[#a6192e] shadow-2xs'
                  : 'text-[#5b5f66] hover:text-[#1f2023]'
              }`}
            >
              Todas ({metricas.total})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('pendiente')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                filtroEstado === 'pendiente'
                  ? 'bg-white text-[#b54708] shadow-2xs'
                  : 'text-[#5b5f66] hover:text-[#1f2023]'
              }`}
            >
              Pendientes ({metricas.pendientes})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('completada')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                filtroEstado === 'completada'
                  ? 'bg-white text-[#107e3e] shadow-2xs'
                  : 'text-[#5b5f66] hover:text-[#1f2023]'
              }`}
            >
              Completadas ({metricas.completadas})
            </button>
          </div>

          {/* Campo de búsqueda */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#9ca0a6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Buscar por título, autor o convocatoria..."
              className="w-full pl-9 pr-3 py-1.5 rounded-[8px] border border-[#e5e7ea] text-xs outline-hidden focus:border-[#a6192e] focus:ring-2 focus:ring-[#a6192e]/20 transition-all"
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
        />

        {/* Modales */}
        <EvaluacionFormModal
          isOpen={modalEvaluacionAbierto}
          asignacion={asignacionSeleccionada}
          onClose={handleCerrarEvaluacion}
          onGuardadoExitoso={handleGuardadoExitoso}
        />

        <ResultadoEvaluacionModal
          isOpen={modalResultadoAbierto}
          propuestaId={propuestaResultado?.id}
          propuestaTitulo={propuestaResultado?.titulo}
          onClose={handleCerrarResultado}
        />
      </div>
    </MainLayout>
  );
}
