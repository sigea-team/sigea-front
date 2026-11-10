import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  CalendarClock,
  Plus,
  RefreshCw,
  LayoutList,
  Calendar,
  Building,
  User,
  Layers,
  AlertCircle,
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { eventoService } from '../api/eventoService';
import { salaService } from '../api/salaService';
import { conferencistaService } from '../api/conferencistaService';
import { parametroEventoService } from '../api/parametroEventoService';
import { actividadService } from '../api/actividadService';
import AgendaTimeline from '../features/agenda/components/AgendaTimeline';
import AgendaTabla from '../features/agenda/components/AgendaTabla';
import FiltrosAgenda from '../features/agenda/components/FiltrosAgenda';
import ActividadFormModal from '../features/agenda/components/ActividadFormModal';
import AgendaGeneracionPanel from '../features/agenda/components/AgendaGeneracionPanel';
import { agendaService } from '../api/agendaService';
import { separarActividades, precargaAsignacionManual } from '../features/agenda/agendaPublicacionUtils';
import { confirmarDesprogramar } from '../features/agenda/accionesAgenda';

/**
 * @file AgendaPage.jsx
 * @description Vista principal del módulo de Agenda y Programación de Actividades (HU-21).
 * Permite a los organizadores y administradores:
 * - Programar actividades asignando sala, horario y ponente (Criterio 1).
 * - Detectar automáticamente conflictos de horario, sala y ponente antes de guardar (Criterio 2).
 * - Permitir actividades simultáneas intencionales (p. ej. talleres paralelos) sin conflicto de horario,
 *   pero validando que no compartan sala ni ponente (Criterio 3).
 * - Validar obligatoriedad de nombre, fecha, horario y sala (Criterio 4).
 * - Modificar actividades ya programadas revalidando conflictos con el resto de la agenda (Criterio 5).
 * - Indicador claro para integrar endpoints del backend cuando estén disponibles.
 * HU-22: franja de generación automática y publicación (`AgendaGeneracionPanel`). La línea de tiempo, la tabla,
 * los filtros y las métricas solo muestran las actividades con horario; las «por programar» se gestionan en el
 * modal de generación.
 */
export default function AgendaPage({
  apiActividades = actividadService,
  apiEventos = eventoService,
  apiSalas = salaService,
  apiConferencistas = conferencistaService,
  apiParametros = parametroEventoService,
  apiAgenda = agendaService,
}) {
  const { eventoId: eventoIdParam } = useParams();
  const navigate = useNavigate();

  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState(eventoIdParam || '');
  const [todasActividades, setActividades] = useState([]);
  const [salas, setSalas] = useState([]);
  const [ponentes, setPonentes] = useState([]);
  const [tiposActividad, setTiposActividad] = useState([]);
  const [propuestasProgramables, setPropuestasProgramables] = useState([]);

  const [cargando, setCargando] = useState(false);
  const [vista, setVista] = useState('timeline'); // 'timeline' | 'tabla'
  const [version, setVersion] = useState(0);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroSala, setFiltroSala] = useState('');
  const [soloSimultaneas, setSoloSimultaneas] = useState(false);

  // Modal para crear / editar actividad
  const [modalFormulario, setModalFormulario] = useState(null); // null | { tipo: 'crear'|'editar', actividad: ... }

  const idEventoActivo = eventoIdParam || eventoSeleccionadoId;
  const recargar = () => setVersion((v) => v + 1);

  // 1. Cargar lista de eventos disponibles
  useEffect(() => {
    let activo = true;
    apiEventos
      .listarEventos()
      .then((lista) => {
        if (!activo) return;
        const evs = Array.isArray(lista) ? lista : [];
        setEventos(evs);
        if (!eventoIdParam && evs.length > 0 && !eventoSeleccionadoId) {
          setEventoSeleccionadoId(String(evs[0].id));
        }
      })
      .catch((err) => {
        console.error('Error al listar eventos para agenda:', err);
      });

    return () => {
      activo = false;
    };
  }, [apiEventos, eventoIdParam, eventoSeleccionadoId]);

  // 2. Cargar datos del evento seleccionado (actividades, salas, ponentes, tipos de actividad)
  useEffect(() => {
    if (!idEventoActivo) return;

    let activo = true;
    Promise.resolve().then(() => {
      if (activo) setCargando(true);
    });

    Promise.allSettled([
      apiActividades.listarActividades(idEventoActivo),
      apiSalas.listarSalas(idEventoActivo),
      apiConferencistas.listarConferencistas(idEventoActivo),
      apiParametros.listar('tipos', idEventoActivo),
      // HU-19: propuestas aprobadas en versión definitiva que se pueden vincular a una actividad
      apiAgenda?.listarPropuestasProgramables
        ? apiAgenda.listarPropuestasProgramables(idEventoActivo)
        : Promise.resolve([]),
    ]).then(([resAct, resSalas, resPonentes, resTipos, resPropuestas]) => {
      if (!activo) return;

      if (resAct.status === 'fulfilled') setActividades(resAct.value || []);
      if (resSalas.status === 'fulfilled') setSalas(resSalas.value || []);
      if (resPonentes.status === 'fulfilled') setPonentes(resPonentes.value || []);
      if (resTipos.status === 'fulfilled') setTiposActividad(resTipos.value || []);
      setPropuestasProgramables(resPropuestas.status === 'fulfilled' ? resPropuestas.value || [] : []);

      setCargando(false);
    });

    return () => {
      activo = false;
    };
  }, [idEventoActivo, version, apiActividades, apiSalas, apiConferencistas, apiParametros, apiAgenda]);

  // HU-22: las actividades por programar no tienen fecha ni horario; no van en la línea de tiempo ni en la tabla.
  const { programadas: actividades } = useMemo(() => separarActividades(todasActividades), [todasActividades]);

  const eventoActual = useMemo(
    () => eventos.find((e) => String(e.id) === String(idEventoActivo)),
    [eventos, idEventoActivo]
  );

  const opcionesEventos = [
    { value: '', label: 'Selecciona un evento...' },
    ...eventos.map((e) => ({
      value: String(e.id),
      label: `${e.nombre} (${e.semestre || e.estado || 'Configurado'})`,
    })),
  ];

  // Filtrado de actividades
  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((a) => {
      if (filtroFecha && a.fecha !== filtroFecha) return false;
      if (filtroSala && String(a.salaId) !== String(filtroSala)) return false;
      if (soloSimultaneas && !a.permiteSimultaneidad) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchNom = (a.nombre || '').toLowerCase().includes(q);
        const matchPon = (a.ponenteNombre || '').toLowerCase().includes(q);
        const matchSala = (a.salaNombre || '').toLowerCase().includes(q);
        if (!matchNom && !matchPon && !matchSala) return false;
      }
      return true;
    });
  }, [actividades, busqueda, filtroFecha, filtroSala, soloSimultaneas]);

  // Estadísticas rápidas
  const metricas = useMemo(() => {
    const total = actividades.length;
    const simultaneas = actividades.filter((a) => a.permiteSimultaneidad).length;
    const salasOcupadas = new Set(actividades.map((a) => a.salaId)).size;
    const ponentesActivos = new Set(actividades.map((a) => a.ponenteId).filter(Boolean)).size;

    return { total, simultaneas, salasOcupadas, ponentesActivos };
  }, [actividades]);

  const fechasDisponibles = useMemo(
    () => Array.from(new Set(actividades.map((a) => a.fecha).filter(Boolean))),
    [actividades]
  );

  const hayFiltrosActivos = Boolean(busqueda.trim() || filtroFecha || filtroSala || soloSimultaneas);

  // Operaciones (Criterio 1, Criterio 4, Criterio 5)
  const handleCrear = async (datos) => {
    await apiActividades.crearActividad(idEventoActivo, datos);
    recargar();
    Swal.fire({
      icon: 'success',
      title: '¡Actividad programada exitosamente!',
      text: `«${datos.nombre}» fue agregada en el lugar cronológico correspondiente de la agenda.`,
      timer: 2400,
      showConfirmButton: false,
    });
  };

  const handleEditar = async (datos) => {
    await apiActividades.actualizarActividad(idEventoActivo, modalFormulario.actividad.id, datos);
    recargar();
    Swal.fire({
      icon: 'success',
      title: '¡Cambios guardados!',
      text: `Se actualizaron los datos y se revalidaron los conflictos con el resto de la agenda.`,
      timer: 2400,
      showConfirmButton: false,
    });
  };

  const handleEliminar = (act) => {
    Swal.fire({
      title: '¿Eliminar actividad de la agenda?',
      text: `Se removerá «${act.nombre}» del cronograma del evento.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
      customClass: {
        popup: 'rounded-[16px]',
        confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        await apiActividades.eliminarActividad(idEventoActivo, act.id);
        recargar();
        Swal.fire({
          icon: 'success',
          title: 'Actividad eliminada',
          timer: 1800,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleDesprogramar = (act) => confirmarDesprogramar(apiAgenda, idEventoActivo, act, recargar);

  // HU-22 Criterio 1 (ajuste manual): abre el formulario de HU-21 con un horario de su misma duración.
  const handleAsignarManual = (act) =>
    setModalFormulario({ tipo: 'editar', actividad: precargaAsignacionManual(act, eventoActual) });

  return (
    <MainLayout title="Agenda y Cronograma de Actividades" activeNav="agenda">
      <div className="space-y-6">
        {/* Encabezado con selector de evento y botón de acción */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink-900">
              {eventoActual ? `Agenda: ${eventoActual.nombre}` : 'Programación de la Agenda'}
            </h2>
            <p className="text-xs text-ink-600">
              {eventoActual
                ? `Fechas del evento: ${eventoActual.fechaInicio} al ${eventoActual.fechaFin} • Modalidad: ${eventoActual.modalidad || 'Presencial'}`
                : 'Selecciona un evento para visualizar y organizar cronológicamente sus actividades.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={recargar}
              disabled={cargando}
              title="Refrescar agenda desde el servidor"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </Button>

            <div className="w-72">
              <Select
                id="selector-evento-agenda"
                value={idEventoActivo}
                onChange={(e) => {
                  setEventoSeleccionadoId(e.target.value);
                  if (eventoIdParam) {
                    navigate(`/eventos/${e.target.value}/agenda`);
                  }
                }}
                options={opcionesEventos}
              />
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => setModalFormulario({ tipo: 'crear' })}
              disabled={!idEventoActivo || salas.length === 0}
              title={
                !idEventoActivo
                  ? 'Selecciona un evento'
                  : salas.length === 0
                  ? 'El evento no tiene salas registradas todavía'
                  : undefined
              }
            >
              <Plus className="w-4 h-4" />
              <span>Programar actividad</span>
            </Button>
          </div>
        </div>

        {!idEventoActivo ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-field-border bg-white">
            <Calendar className="w-12 h-12 text-ink-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-ink-900">Selecciona un evento académico</p>
            <p className="text-xs text-ink-600 mt-1">
              Elige un evento del selector superior para consultar o programar las actividades de su agenda.
            </p>
          </div>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl border border-border bg-white">
                <div className="flex items-center justify-between text-ink-600 mb-1">
                  <span className="text-[11px] font-semibold uppercase">Total Actividades</span>
                  <CalendarClock className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-xl font-bold text-ink-900">{metricas.total}</p>
                <p className="text-[10px] text-ink-600">En el cronograma</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-white">
                <div className="flex items-center justify-between text-ink-600 mb-1">
                  <span className="text-[11px] font-semibold uppercase">Simultáneas</span>
                  <Layers className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-xl font-bold text-ink-900">{metricas.simultaneas}</p>
                <p className="text-[10px] text-ink-600">Talleres y tracks paralelos</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-white">
                <div className="flex items-center justify-between text-ink-600 mb-1">
                  <span className="text-[11px] font-semibold uppercase">Salas Asignadas</span>
                  <Building className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-xl font-bold text-ink-900">{metricas.salasOcupadas}</p>
                <p className="text-[10px] text-ink-600">De {salas.length} disponibles</p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-white">
                <div className="flex items-center justify-between text-ink-600 mb-1">
                  <span className="text-[11px] font-semibold uppercase">Ponentes Activos</span>
                  <User className="w-4 h-4 text-brand-600" />
                </div>
                <p className="text-xl font-bold text-ink-900">{metricas.ponentesActivos}</p>
                <p className="text-[10px] text-ink-600">Con sesiones asignadas</p>
              </div>
            </div>

            {/* Aviso si el evento no tiene salas registradas */}
            {salas.length === 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-100 border border-brand-600 text-brand-700 text-xs">
                <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-brand-700">
                    No hay salas registradas para este evento
                  </p>
                  <p className="mt-0.5 text-brand-700">
                    Para programar actividades (Criterio 1 y 4), primero debes registrar los espacios o auditorios del evento desde el módulo de Salas y Espacios.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/eventos/${idEventoActivo}/salas`)}
                    className="mt-2 text-xs font-semibold text-brand-600 underline cursor-pointer"
                  >
                    Ir a Salas y Espacios →
                  </button>
                </div>
              </div>
            )}

            {/* HU-22: generación automática y publicación */}
            <AgendaGeneracionPanel
              evento={eventoActual || { id: idEventoActivo }}
              actividades={todasActividades}
              tiposActividad={tiposActividad}
              ponentes={ponentes}
              version={version}
              api={apiAgenda}
              apiActividades={apiActividades}
              onCambios={recargar}
              onAsignarManual={salas.length > 0 ? handleAsignarManual : undefined}
            />

            {/* Barra de Filtros y Selector de Vista */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 p-1 bg-surface-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setVista('timeline')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      vista === 'timeline'
                        ? 'bg-white text-ink-900 shadow-xs'
                        : 'text-ink-600 hover:text-ink-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Vista Cronológica (Timeline)
                  </button>

                  <button
                    type="button"
                    onClick={() => setVista('tabla')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      vista === 'tabla'
                        ? 'bg-white text-ink-900 shadow-xs'
                        : 'text-ink-600 hover:text-ink-900'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    Vista Tabla Detallada
                  </button>
                </div>

                <p className="text-xs text-ink-600">
                  Mostrando {actividadesFiltradas.length} de {actividades.length} actividades
                </p>
              </div>

              <FiltrosAgenda
                busqueda={busqueda}
                onCambiarBusqueda={setBusqueda}
                filtroFecha={filtroFecha}
                onCambiarFecha={setFiltroFecha}
                fechasDisponibles={fechasDisponibles}
                filtroSala={filtroSala}
                onCambiarSala={setFiltroSala}
                salas={salas}
                soloSimultaneas={soloSimultaneas}
                onCambiarSoloSimultaneas={setSoloSimultaneas}
                onLimpiarFiltros={() => {
                  setBusqueda('');
                  setFiltroFecha('');
                  setFiltroSala('');
                  setSoloSimultaneas(false);
                }}
                hayFiltrosActivos={hayFiltrosActivos}
              />
            </div>

            {/* Visualización de la Agenda */}
            {cargando ? (
              <div className="py-20 text-center text-xs text-ink-600">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-600" />
                Cargando agenda cronológica...
              </div>
            ) : vista === 'timeline' ? (
              <AgendaTimeline
                actividades={actividadesFiltradas}
                salas={salas}
                ponentes={ponentes}
                onEditar={(act) => setModalFormulario({ tipo: 'editar', actividad: act })}
                onEliminar={handleEliminar}
                onDesprogramar={handleDesprogramar}
              />
            ) : (
              <AgendaTabla
                actividades={actividadesFiltradas}
                salas={salas}
                ponentes={ponentes}
                onEditar={(act) => setModalFormulario({ tipo: 'editar', actividad: act })}
                onEliminar={handleEliminar}
                onDesprogramar={handleDesprogramar}
              />
            )}
          </>
        )}
      </div>

      {/* Modal para Crear o Editar actividad (Criterios 1, 2, 3, 4 y 5) */}
      {modalFormulario && (
        <ActividadFormModal
          key={`modal-actividad-${modalFormulario.tipo}-${modalFormulario.actividad?.id || 'nueva'}`}
          isOpen
          actividad={modalFormulario.tipo === 'editar' ? modalFormulario.actividad : null}
          evento={eventoActual}
          salas={salas}
          ponentes={ponentes}
          tiposActividad={tiposActividad}
          propuestas={propuestasProgramables}
          actividadesExistentes={actividades}
          onClose={() => setModalFormulario(null)}
          onSubmit={modalFormulario.tipo === 'editar' ? handleEditar : handleCrear}
        />
      )}
    </MainLayout>
  );
}
