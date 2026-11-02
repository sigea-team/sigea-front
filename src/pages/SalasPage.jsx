import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { eventoService } from '../api/eventoService';
import { salaService } from '../api/salaService';
import TipoSalaBadge from '../features/salas/components/TipoSalaBadge';
import AforoBadge from '../features/salas/components/AforoBadge';
import SalaFormModal from '../features/salas/components/SalaFormModal';
import DisponibilidadSalaModal from '../features/salas/components/DisponibilidadSalaModal';
import DisponibilidadPonenteModal from '../features/salas/components/DisponibilidadPonenteModal';
import ProgramarActividadModal from '../features/salas/components/ProgramarActividadModal';
import { formatearHora } from '../features/salas/salaUtils';
import { useAuth } from '../context/AuthContext';

/**
 * @file SalasPage.jsx
 * @description Módulo de Infraestructura: Catálogo institucional de Salas y Espacios (HU-20).
 * La creación de salas es independiente de los eventos: permite registrar y configurar
 * espacios físicos o virtuales para dejarlos disponibles y usarlos en eventos futuros.
 * Además, permite seleccionar eventos para programar actividades y gestionar la disponibilidad de ponentes.
 */
export default function SalasPage({ api = salaService, apiEventos = eventoService }) {
  const { eventoId: eventoIdParam } = useParams();
  const { usuario } = useAuth();

  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState(eventoIdParam || '');
  const [pestanaActiva, setPestanaActiva] = useState(eventoIdParam ? 'evento' : 'catalogo'); // 'catalogo' | 'evento' | 'ponentes'
  const [version, setVersion] = useState(0);

  // Datos
  const [todasLasSalas, setTodasLasSalas] = useState([]);
  const [ponentes, setPonentes] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  // Filtros del catálogo
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modales
  const [modalSala, setModalSala] = useState(null);
  const [modalDisponibilidadSala, setModalDisponibilidadSala] = useState(null);
  const [modalDisponibilidadPonente, setModalDisponibilidadPonente] = useState(null);
  const [modalProgramar, setModalProgramar] = useState(false);

  const idEventoActivo = eventoIdParam || eventoSeleccionadoId;
  const recargar = () => setVersion((v) => v + 1);

  // Cargar lista de eventos disponibles para programación
  useEffect(() => {
    let activo = true;
    apiEventos
      .listarEventos()
      .then((lista) => {
        if (!activo) return;
        const evs = Array.isArray(lista) ? lista : [];
        setEventos(evs);
        if (!eventoIdParam && evs.length > 0) {
          setEventoSeleccionadoId((prev) => prev || String(evs[0].id));
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [apiEventos, eventoIdParam]);

  const eventoActual = eventos.find((e) => String(e.id) === String(idEventoActivo));

  // Carga general de datos (Salas independientes del catálogo + datos del evento activo si hay)
  useEffect(() => {
    let activo = true;

    const promesas = [
      api.listarSalas(null), // Traer todas las salas del catálogo institucional
      idEventoActivo ? api.listarPonentesEvento(idEventoActivo).catch(() => []) : Promise.resolve([]),
      idEventoActivo ? api.listarActividades(idEventoActivo).catch(() => []) : Promise.resolve([]),
    ];

    Promise.all(promesas)
      .then(([listaSalas, listaPonentes, listaActividades]) => {
        if (!activo) return;
        setTodasLasSalas(Array.isArray(listaSalas) ? listaSalas : []);
        setPonentes(Array.isArray(listaPonentes) ? listaPonentes : []);
        setActividades(Array.isArray(listaActividades) ? listaActividades : []);
        setErrorCarga(null);
        setCargando(false);
      })
      .catch((err) => {
        if (activo) {
          setErrorCarga(err.message || 'Error al cargar información de salas.');
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [idEventoActivo, api, version]);

  // Filtrado de salas del catálogo institucional
  const salasFiltradas = todasLasSalas.filter((s) => {
    if (filtroTipo !== 'todos' && s.tipo !== filtroTipo) return false;
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (s.nombre || '').toLowerCase().includes(texto) ||
      (s.ubicacion || '').toLowerCase().includes(texto) ||
      (s.tipo || '').toLowerCase().includes(texto)
    );
  });

  // Métricas de infraestructura
  const cantFisicas = todasLasSalas.filter((s) => s.tipo === 'fisica').length;
  const cantVirtuales = todasLasSalas.filter((s) => s.tipo === 'virtual').length;

  // Operaciones de salas
  const handleGuardarSala = async (datos) => {
    if (modalSala?.tipo === 'crear') {
      // Si se crea en la pestaña del catálogo o sin evento, eventoId es null (independiente)
      const evId = modalSala.eventoId || null;
      await api.crearSala(evId, datos);
      Swal.fire({
        icon: 'success',
        title: 'Sala registrada',
        text: `La sala «${datos.nombre}» quedó guardada en el catálogo y disponible para futuros eventos.`,
        confirmButtonColor: '#a6192e',
      });
    } else if (modalSala?.tipo === 'editar') {
      await api.actualizarSala(modalSala.sala.id, datos);
      Swal.fire({
        icon: 'success',
        title: 'Sala actualizada',
        text: `Se actualizaron los datos de «${datos.nombre}».`,
        confirmButtonColor: '#a6192e',
      });
    }
    recargar();
  };

  const handleEliminarSala = async (sala) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: `¿Eliminar la sala «${sala.nombre}»?`,
      text: 'Esta acción eliminará la sala del catálogo de infraestructura.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
    });

    if (confirm.isConfirmed) {
      try {
        await api.eliminarSala(sala.id);
        Swal.fire({
          icon: 'success',
          title: 'Sala eliminada',
          text: `Se eliminó la sala «${sala.nombre}».`,
          confirmButtonColor: '#a6192e',
        });
        recargar();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo eliminar',
          text: err.message || 'La sala tiene actividades programadas o no pudo eliminarse.',
          confirmButtonColor: '#a6192e',
        });
      }
    }
  };

  const handleGuardarDisponibilidadSala = async (salaId, franjas) => {
    await api.guardarDisponibilidadSala(salaId, franjas);
    Swal.fire({
      icon: 'success',
      title: 'Disponibilidad actualizada',
      text: 'Las franjas horarias de la sala se guardaron exitosamente.',
      confirmButtonColor: '#a6192e',
    });
    recargar();
  };

  const handleGuardarDisponibilidadPonente = async (personaId, franjas) => {
    await api.guardarDisponibilidadPonente(idEventoActivo, personaId, franjas);
    Swal.fire({
      icon: 'success',
      title: 'Disponibilidad del ponente guardada',
      text: 'Los rangos de disponibilidad horaria se guardaron como referencia para la programación.',
      confirmButtonColor: '#a6192e',
    });
    recargar();
  };

  const handleProgramarActividad = async (datos) => {
    await api.programarActividad(idEventoActivo, datos);
    Swal.fire({
      icon: 'success',
      title: 'Actividad agendada',
      text: `Se programó «${datos.nombre}» en la infraestructura del evento.`,
      confirmButtonColor: '#a6192e',
    });
    recargar();
  };

  const handleEliminarActividad = async (actividadId) => {
    await api.eliminarActividad(actividadId);
    recargar();
  };

  const opcionesEventos = [
    { value: '', label: 'Seleccionar un evento académico...' },
    ...eventos.map((e) => ({
      value: String(e.id),
      label: `${e.nombre} (${e.semestre || e.estado || 'Activo'})`,
    })),
  ];

  return (
    <MainLayout title="Salas y Espacios" activeNav="salas" usuario={usuario}>
      <div className="space-y-6">
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              SIGEA — Infraestructura Institucional (HU-20)
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1 tracking-tight">
              Catálogo de salas y espacios
            </h2>
            <p className="text-sm text-[#5b5f66] mt-1 max-w-3xl">
              Registra y configura auditorios, aulas físicas y salas de videoconferencia independientes
              de los eventos para disponer de la infraestructura necesaria y programar actividades en eventos cuando lo requieras.
            </p>
          </div>

          {/* Botón de acción principal: Registrar sala en cualquier momento */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              onClick={() => setModalSala({ tipo: 'crear', sala: null, eventoId: null })}
            >
              <Plus className="w-4 h-4" />
              <span>Registrar nueva sala</span>
            </Button>
          </div>
        </div>

        {/* Tarjetas de Resumen de Infraestructura */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-[12px] border border-[#e5e7ea] bg-white p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-[#5b5f66] uppercase tracking-wider block">
              Salas disponibles
            </span>
            <span className="text-2xl font-bold text-[#1f2023] mt-0.5 block">
              {todasLasSalas.length}
            </span>
          </div>
          <div className="rounded-[12px] border border-[#e5e7ea] bg-white p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-[#5b5f66] uppercase tracking-wider block">
              Salas físicas
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-0.5 block">
              {cantFisicas}
            </span>
          </div>
          <div className="rounded-[12px] border border-[#e5e7ea] bg-white p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-[#5b5f66] uppercase tracking-wider block">
              Salas virtuales
            </span>
            <span className="text-2xl font-bold text-blue-700 mt-0.5 block">
              {cantVirtuales}
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="flex items-center justify-between border-b border-[#e5e7ea] gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPestanaActiva('catalogo')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                pestanaActiva === 'catalogo'
                  ? 'border-[#a6192e] text-[#a6192e] bg-[#fdecec]/30'
                  : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Catálogo General ({todasLasSalas.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva('ponentes')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                pestanaActiva === 'ponentes'
                  ? 'border-[#a6192e] text-[#a6192e] bg-[#fdecec]/30'
                  : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Disponibilidad de Ponentes</span>
            </button>

            <button
              type="button"
              onClick={() => setPestanaActiva('evento')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                pestanaActiva === 'evento'
                  ? 'border-[#a6192e] text-[#a6192e] bg-[#fdecec]/30'
                  : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Programación en Eventos ({actividades.length})</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={recargar}
            disabled={cargando}
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {errorCarga && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            <p className="font-semibold">No se pudieron cargar los datos:</p>
            <p>{errorCarga}</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 1: CATÁLOGO GENERAL DE SALAS (INDEPENDIENTE)     */}
        {/* ======================================================== */}
        {pestanaActiva === 'catalogo' && (
          <div className="space-y-4">
            {/* Filtros del Catálogo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:max-w-md">
                <div className="flex-1">
                  <Input
                    id="buscar-salas-catalogo"
                    placeholder="Buscar por nombre o ubicación..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
                  />
                </div>
                <div className="w-36 shrink-0">
                  <Select
                    id="filtro-tipo-sala"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    options={[
                      { value: 'todos', label: 'Todos los tipos' },
                      { value: 'fisica', label: 'Solo físicas' },
                      { value: 'virtual', label: 'Solo virtuales' },
                    ]}
                  />
                </div>
              </div>

              <span className="text-xs text-[#5b5f66]">
                Mostrando {salasFiltradas.length} de {todasLasSalas.length} espacios registrados
              </span>
            </div>

            {salasFiltradas.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-white">
                <Building className="w-12 h-12 text-[#9ca0a6] mx-auto mb-2" />
                <h3 className="font-serif-title text-base font-semibold text-[#1f2023]">
                  No se encontraron salas en el catálogo
                </h3>
                <p className="text-xs text-[#5b5f66] mt-1 max-w-md mx-auto">
                  {busqueda || filtroTipo !== 'todos'
                    ? 'Ninguna sala coincide con los filtros aplicados. Intenta con otros términos.'
                    : 'Crea auditorios, aulas y salas virtuales que quedarán disponibles para ser usadas en cualquier evento.'}
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setModalSala({ tipo: 'crear', sala: null, eventoId: null })}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar sala en catálogo</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salasFiltradas.map((sala) => {
                  const cantFranjas = sala.disponibilidad?.length || 0;
                  const actividadesSala = actividades.filter((a) => Number(a.salaId) === Number(sala.id));

                  return (
                    <div
                      key={sala.id}
                      className="rounded-[12px] border border-[#e5e7ea] bg-white p-5 shadow-xs hover:border-[#a6192e]/40 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif-title text-base font-semibold text-[#1f2023] leading-snug">
                              {sala.nombre}
                            </h4>
                            {sala.ubicacion && (
                              <p className="text-xs text-[#5b5f66] flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#a6192e]" />
                                <span className="truncate">{sala.ubicacion}</span>
                              </p>
                            )}
                          </div>
                          <TipoSalaBadge tipo={sala.tipo} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e5e7ea]/60">
                          <AforoBadge aforo={sala.aforoMaximo} />
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]"
                            title="Franjas horarias de disponibilidad"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {cantFranjas} {cantFranjas === 1 ? 'franja' : 'franjas'} de horario
                          </span>
                          {actividadesSala.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700">
                              {actividadesSala.length} {actividadesSala.length === 1 ? 'actividad' : 'actividades'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#e5e7ea] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setModalDisponibilidadSala(sala)}
                          className="text-xs font-medium text-[#a6192e] hover:text-[#7a0c1e] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Configurar disponibilidad
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModalSala({ tipo: 'editar', sala })}
                            className="p-1.5 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#f7f7f8] rounded cursor-pointer"
                            title="Editar sala"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarSala(sala)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Eliminar sala"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 2: DISPONIBILIDAD DE PONENTES POR EVENTO (HU-20) */}
        {/* ======================================================== */}
        {pestanaActiva === 'ponentes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
              <div>
                <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#a6192e]" />
                  Disponibilidad de ponentes registrados (Criterio 2)
                </h4>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Selecciona un evento académico para definir los rangos de disponibilidad horaria de sus ponentes.
                </p>
              </div>

              <div className="w-full sm:w-72 shrink-0">
                <Select
                  id="selector-evento-ponentes"
                  value={idEventoActivo}
                  onChange={(e) => setEventoSeleccionadoId(e.target.value)}
                  options={opcionesEventos}
                />
              </div>
            </div>

            {!idEventoActivo ? (
              <div className="text-center py-12 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-white">
                <User className="w-10 h-10 text-[#9ca0a6] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1f2023]">Selecciona un evento</p>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Elige un evento en el selector superior para consultar y configurar la disponibilidad de sus ponentes.
                </p>
              </div>
            ) : ponentes.length === 0 ? (
              <div className="text-center py-14 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-white">
                <User className="w-10 h-10 text-[#9ca0a6] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1f2023]">No hay ponentes registrados para este evento</p>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Asocia ponentes desde la gestión de conferencistas para configurar su disponibilidad.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e5e7ea] rounded-[12px] border border-[#e5e7ea] bg-white overflow-hidden shadow-xs">
                {ponentes.map((p) => {
                  const cantFranjas = p.disponibilidad?.length || 0;
                  const actividadesPonente = actividades.filter(
                    (a) => Number(a.ponenteId) === Number(p.personaId)
                  );

                  return (
                    <div
                      key={p.personaId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f7f7f8]/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#1f2023]">
                            {p.nombres} {p.apellidos}
                          </span>
                          {cantFranjas > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {cantFranjas} {cantFranjas === 1 ? 'rango disponible' : 'rangos disponibles'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Sin disponibilidad horaria
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5b5f66]">
                          {p.institucion ? `${p.institucion} • ` : ''}
                          {p.correo}
                        </p>
                        {actividadesPonente.length > 0 && (
                          <p className="text-[11px] text-indigo-700 font-medium">
                            {actividadesPonente.length} actividad(es) programada(s)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setModalDisponibilidadPonente(p)}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Definir disponibilidad</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: PROGRAMACIÓN Y ACTIVIDADES EN EVENTOS         */}
        {/* ======================================================== */}
        {pestanaActiva === 'evento' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
              <div>
                <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                  Programación de infraestructura por evento
                </h4>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Selecciona el evento para agendar actividades usando las salas y la disponibilidad registrada como referencia.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Select
                    id="selector-evento-actividades"
                    value={idEventoActivo}
                    onChange={(e) => setEventoSeleccionadoId(e.target.value)}
                    options={opcionesEventos}
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setModalProgramar(true)}
                  disabled={!idEventoActivo || todasLasSalas.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  <span>Programar actividad</span>
                </Button>
              </div>
            </div>

            {!idEventoActivo ? (
              <div className="text-center py-12 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-white">
                <Calendar className="w-10 h-10 text-[#9ca0a6] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1f2023]">Selecciona un evento académico</p>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Elige un evento para consultar o registrar la programación de sus actividades.
                </p>
              </div>
            ) : actividades.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-white">
                <Calendar className="w-12 h-12 text-[#9ca0a6] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#1f2023]">No hay actividades programadas</p>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Usa «Programar actividad» para agendar respetando el aforo y la disponibilidad horaria registrada.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[12px] border border-[#e5e7ea] bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] font-bold text-[#1f2023] uppercase">
                      <th className="py-3.5 px-4">Actividad</th>
                      <th className="py-3.5 px-4">Sala Asignada</th>
                      <th className="py-3.5 px-4">Ponente</th>
                      <th className="py-3.5 px-4">Fecha y Horario</th>
                      <th className="py-3.5 px-4">Inscritos / Aforo</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7ea] text-[#1f2023]">
                    {actividades.map((act) => {
                      const sala = todasLasSalas.find((s) => Number(s.id) === Number(act.salaId));
                      const ponente = ponentes.find((p) => Number(p.personaId) === Number(act.ponenteId));
                      const sobrecupo = sala && (act.inscripcionesActivas || 0) > sala.aforoMaximo;

                      return (
                        <tr key={act.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                          <td className="py-4 px-4 font-semibold">
                            <p>{act.nombre}</p>
                            {act.tieneAdvertencia && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Fuera de disponibilidad registrada
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {sala ? (
                              <div>
                                <span className="font-medium">{sala.nombre}</span>
                                <div className="mt-0.5">
                                  <TipoSalaBadge tipo={sala.tipo} />
                                </div>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {ponente ? `${ponente.nombres} ${ponente.apellidos}` : 'Sin ponente'}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <p className="font-medium">{act.fecha}</p>
                            <p className="text-[#5b5f66] text-[11px]">
                              {formatearHora(act.horaInicio)} – {formatearHora(act.horaFin)}
                            </p>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`font-semibold ${
                                sobrecupo ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-[#1f2023]'
                              }`}
                            >
                              {act.inscripcionesActivas || 0} / {sala?.aforoMaximo || '—'}
                            </span>
                            {sobrecupo && <p className="text-[10px] text-red-600 mt-0.5">Sobrecupo</p>}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleEliminarActividad(act.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Eliminar actividad"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales secundarios */}
      {modalSala && (
        <SalaFormModal
          isOpen
          sala={modalSala.sala}
          evento={eventoActual}
          salasExistentes={todasLasSalas}
          actividadesSala={
            modalSala.sala
              ? actividades.filter((a) => Number(a.salaId) === Number(modalSala.sala.id))
              : []
          }
          onClose={() => setModalSala(null)}
          onSubmit={handleGuardarSala}
        />
      )}

      {modalDisponibilidadSala && (
        <DisponibilidadSalaModal
          isOpen
          sala={modalDisponibilidadSala}
          actividadesSala={actividades.filter(
            (a) => Number(a.salaId) === Number(modalDisponibilidadSala.id)
          )}
          onClose={() => setModalDisponibilidadSala(null)}
          onGuardar={handleGuardarDisponibilidadSala}
        />
      )}

      {modalDisponibilidadPonente && (
        <DisponibilidadPonenteModal
          isOpen
          ponente={modalDisponibilidadPonente}
          actividadesPonente={actividades.filter(
            (a) => Number(a.ponenteId) === Number(modalDisponibilidadPonente.personaId)
          )}
          onClose={() => setModalDisponibilidadPonente(null)}
          onGuardar={handleGuardarDisponibilidadPonente}
        />
      )}

      {modalProgramar && (
        <ProgramarActividadModal
          isOpen
          evento={eventoActual}
          salas={todasLasSalas}
          ponentes={ponentes}
          onClose={() => setModalProgramar(false)}
          onSubmit={handleProgramarActividad}
        />
      )}
    </MainLayout>
  );
}
