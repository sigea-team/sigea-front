import { useEffect, useState } from 'react';
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
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ModalShell from '../../eventos/components/ModalShell';
import TipoSalaBadge from './TipoSalaBadge';
import AforoBadge from './AforoBadge';
import SalaFormModal from './SalaFormModal';
import DisponibilidadSalaModal from './DisponibilidadSalaModal';
import DisponibilidadPonenteModal from './DisponibilidadPonenteModal';
import ProgramarActividadModal from './ProgramarActividadModal';
import { formatearHora } from '../salaUtils';
import { avisarDisponibilidad, conMensajeApi, mensajeApi } from '../salaAvisos';

/**
 * @file SalasModal.jsx
 * @description Módulo central de Salas, Espacios y Disponibilidad de Salas y Ponentes (HU-20).
 * Integra los criterios 1 al 5:
 * - Criterio 1: Registro de salas con aforo y disponibilidad como referencia.
 * - Criterio 2: Configuración de rangos de disponibilidad para ponentes registrados.
 * - Criterio 3: Rechazo de duplicidad de nombres o aforos inválidos.
 * - Criterio 4: Advertencias al programar fuera de disponibilidad o modificar aforo con inscritos activos.
 * - Criterio 5: Detección y advertencia de conflictos al modificar disponibilidad de salas o ponentes.
 */
export default function SalasModal({ isOpen, evento, api, onClose }) {
  const [pestanaActiva, setPestanaActiva] = useState('salas'); // 'salas' | 'ponentes' | 'actividades'
  const [salas, setSalas] = useState([]);
  const [ponentes, setPonentes] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Modales hijos
  const [modalSala, setModalSala] = useState(null); // { tipo: 'crear'|'editar', sala: Object|null }
  const [modalDisponibilidadSala, setModalDisponibilidadSala] = useState(null); // sala: Object
  const [modalDisponibilidadPonente, setModalDisponibilidadPonente] = useState(null); // ponente: Object
  const [modalProgramar, setModalProgramar] = useState(false);

  const [version, setVersion] = useState(0);

  const eventoId = evento?.id;

  const recargar = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    Promise.all([
      api.listarSalas(eventoId),
      api.listarPonentesEvento(eventoId),
      api.listarActividades(eventoId),
    ])
      .then(([listaSalas, listaPonentes, listaActividades]) => {
        if (!activo) return;
        setSalas(Array.isArray(listaSalas) ? listaSalas : []);
        setPonentes(Array.isArray(listaPonentes) ? listaPonentes : []);
        setActividades(Array.isArray(listaActividades) ? listaActividades : []);
        setErrorCarga(null);
        setCargando(false);
      })
      .catch((err) => {
        if (activo) {
          setErrorCarga(mensajeApi(err, 'No se pudieron cargar los datos del módulo de salas.'));
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, api, version]);

  if (!isOpen || !evento) return null;

  // Filtrado de salas por búsqueda
  const salasFiltradas = salas.filter((s) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (s.nombre || '').toLowerCase().includes(texto) ||
      (s.ubicacion || '').toLowerCase().includes(texto) ||
      (s.tipo || '').toLowerCase().includes(texto)
    );
  });

  // Operaciones de salas
  const handleGuardarSala = async (datos) => {
    if (modalSala?.tipo === 'crear') {
      await conMensajeApi(() => api.crearSala(eventoId, datos), 'No fue posible registrar la sala.');
      Swal.fire({
        icon: 'success',
        title: 'Sala registrada',
        text: `La sala «${datos.nombre}» quedó guardada disponible para programar actividades.`,
        confirmButtonColor: '#a6192e',
      });
    } else if (modalSala?.tipo === 'editar') {
      await conMensajeApi(
        () => api.actualizarSala(eventoId, modalSala.sala.id, datos),
        'No fue posible actualizar la sala.'
      );
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
      text: 'Esta acción eliminará la sala y su configuración de disponibilidad.',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
    });

    if (confirm.isConfirmed) {
      try {
        await api.eliminarSala(eventoId, sala.id);
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
          text: mensajeApi(err, 'La sala no pudo ser eliminada.'),
          confirmButtonColor: '#a6192e',
        });
      }
    }
  };

  const handleGuardarDisponibilidadSala = async (salaId, franjas) => {
    const resultado = await conMensajeApi(
      () => api.guardarDisponibilidadSala(eventoId, salaId, franjas),
      'No fue posible guardar la disponibilidad de la sala.'
    );
    avisarDisponibilidad(resultado, 'Disponibilidad actualizada', 'Las franjas horarias de la sala se guardaron como referencia.');
    recargar();
  };

  const handleGuardarDisponibilidadPonente = async (personaId, franjas) => {
    const resultado = await conMensajeApi(
      () => api.guardarDisponibilidadPonente(eventoId, personaId, franjas),
      'No fue posible guardar la disponibilidad del ponente.'
    );
    avisarDisponibilidad(
      resultado,
      'Disponibilidad del ponente guardada',
      'Los rangos horarios se guardaron como referencia para la programación.'
    );
    recargar();
  };

  const handleProgramarActividad = async (datos) => {
    await conMensajeApi(() => api.programarActividad(eventoId, datos), 'No fue posible programar la actividad.');
    Swal.fire({
      icon: 'success',
      title: 'Actividad programada',
      text: `Se agendó la actividad «${datos.nombre}».`,
      confirmButtonColor: '#a6192e',
    });
    recargar();
  };

  const handleEliminarActividad = async (actividadId) => {
    await api.eliminarActividad(actividadId);
    recargar();
  };

  return (
    <>
      <ModalShell
        titulo={`Salas e Infraestructura — ${evento.nombre}`}
        subtitulo="Gestión de espacios, aforos y disponibilidad horaria de salas y ponentes (HU-20)"
        icono={Building}
        onClose={onClose}
        ancho="max-w-5xl"
        pie={
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar módulo
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Navegación por pestañas */}
          <div className="flex items-center justify-between border-b border-[#e5e7ea] gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPestanaActiva('salas')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  pestanaActiva === 'salas'
                    ? 'border-[#a6192e] text-[#a6192e] bg-[#fdecec]/30'
                    : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Salas y Espacios ({salas.length})</span>
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
                <span>Disponibilidad Ponentes ({ponentes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPestanaActiva('actividades')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  pestanaActiva === 'actividades'
                    ? 'border-[#a6192e] text-[#a6192e] bg-[#fdecec]/30'
                    : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Programación de Actividades ({actividades.length})</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={recargar}
              disabled={cargando}
              title="Refrescar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {errorCarga && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
              <p className="font-semibold">Error al cargar datos:</p>
              <p>{errorCarga}</p>
            </div>
          )}

          {/* ======================================================== */}
          {/* PESTAÑA 1: SALAS Y ESPACIOS (Criterios 1, 3, 4)           */}
          {/* ======================================================== */}
          {pestanaActiva === 'salas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:max-w-xs">
                  <Input
                    id="buscar-salas"
                    placeholder="Buscar sala por nombre o tipo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setModalSala({ tipo: 'crear', sala: null })}
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar sala (Criterio 1)</span>
                </Button>
              </div>

              {salasFiltradas.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-[#f7f7f8]/50">
                  <Building className="w-10 h-10 text-[#9ca0a6] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#1f2023]">No hay salas registradas</p>
                  <p className="text-xs text-[#5b5f66] mt-1 max-w-md mx-auto">
                    Crea la primera sala o espacio para habilitar la infraestructura del evento.
                  </p>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setModalSala({ tipo: 'crear', sala: null })}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar primera sala</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {salasFiltradas.map((sala) => {
                    const cantFranjas = sala.disponibilidad?.length || 0;
                    const actividadesSala = actividades.filter((a) => Number(a.salaId) === Number(sala.id));

                    return (
                      <div
                        key={sala.id}
                        className="rounded-[12px] border border-[#e5e7ea] bg-white p-4 shadow-xs hover:border-[#a6192e]/40 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-serif-title text-base font-semibold text-[#1f2023] leading-snug">
                                {sala.nombre}
                              </h4>
                              {sala.ubicacion && (
                                <p className="text-xs text-[#5b5f66] flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#a6192e]" />
                                  <span className="truncate">{sala.ubicacion}</span>
                                </p>
                              )}
                            </div>
                            <TipoSalaBadge tipo={sala.tipo} />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#e5e7ea]/60">
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

                        <div className="mt-4 pt-3 border-t border-[#e5e7ea] flex items-center justify-between gap-2">
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
          {/* PESTAÑA 2: DISPONIBILIDAD DE PONENTES (Criterio 2 y 5)    */}
          {/* ======================================================== */}
          {pestanaActiva === 'ponentes' && (
            <div className="space-y-4">
              <div className="bg-[#f7f7f8] p-4 rounded-[12px] border border-[#e5e7ea]">
                <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#a6192e]" />
                  Disponibilidad de ponentes registrados (Criterio 2)
                </h4>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Define los rangos horarios en que los ponentes del evento están disponibles.
                  El sistema los guardará como referencia para la programación y advertirá si cambios
                  generan conflicto con actividades programadas (Criterio 5).
                </p>
              </div>

              {ponentes.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-[#f7f7f8]/50">
                  <User className="w-8 h-8 text-[#9ca0a6] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#1f2023]">No hay ponentes registrados para este evento</p>
                  <p className="text-[11px] text-[#5b5f66] mt-0.5">
                    Vincula o invita conferencistas desde el módulo de conferencistas para configurar su disponibilidad.
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
                                {cantFranjas} {cantFranjas === 1 ? 'rango' : 'rangos'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Sin disponibilidad definida
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
          {/* PESTAÑA 3: PROGRAMACIÓN Y ACTIVIDADES (Criterios 4 y 5)  */}
          {/* ======================================================== */}
          {pestanaActiva === 'actividades' && (
            <div className="space-y-4">
              {!api.soportaActividades && (
                <div role="status" className="flex items-start gap-3 p-4 rounded-[12px] bg-[#fffaeb] border border-[#fedf89] text-[#b54708]">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    La programación de actividades todavía no está disponible: el backend aún no tiene este servicio.
                    Por ahora puedes registrar las salas y la disponibilidad horaria de salas y ponentes.
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                    Actividades programadas en infraestructura
                  </h4>
                  <p className="text-xs text-[#5b5f66] mt-0.5">
                    Permite programar actividades verificando el aforo y la disponibilidad de salas y ponentes (Criterio 4).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setModalProgramar(true)}
                  disabled={!api.soportaActividades || salas.length === 0}
                  title={api.soportaActividades ? undefined : 'El backend todavía no tiene la programación de actividades'}
                >
                  <Plus className="w-4 h-4" />
                  <span>Programar actividad</span>
                </Button>
              </div>

              {actividades.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-[#f7f7f8]/50">
                  <Calendar className="w-8 h-8 text-[#9ca0a6] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#1f2023]">No hay actividades programadas</p>
                  <p className="text-[11px] text-[#5b5f66] mt-0.5">
                    Usa «Programar actividad» para agendar respetando el aforo y la disponibilidad registrada.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[12px] border border-[#e5e7ea] bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] font-bold text-[#1f2023] uppercase">
                        <th className="py-3 px-4">Actividad</th>
                        <th className="py-3 px-4">Sala Asignada</th>
                        <th className="py-3 px-4">Ponente</th>
                        <th className="py-3 px-4">Fecha y Horario</th>
                        <th className="py-3 px-4">Inscritos / Aforo</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7ea] text-[#1f2023]">
                      {actividades.map((act) => {
                        const sala = salas.find((s) => Number(s.id) === Number(act.salaId));
                        const ponente = ponentes.find((p) => Number(p.personaId) === Number(act.ponenteId));
                        const sobrecupo = sala && (act.inscripcionesActivas || 0) > sala.aforoMaximo;

                        return (
                          <tr key={act.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                            <td className="py-3.5 px-4 font-semibold">
                              <p>{act.nombre}</p>
                              {act.tieneAdvertencia && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Fuera de disponibilidad registrada
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
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
                            <td className="py-3.5 px-4">
                              {ponente ? `${ponente.nombres} ${ponente.apellidos}` : 'Sin ponente'}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-medium">{act.fecha}</p>
                              <p className="text-[#5b5f66] text-[11px]">
                                {formatearHora(act.horaInicio)} – {formatearHora(act.horaFin)}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  sobrecupo ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-[#1f2023]'
                                }`}
                              >
                                {act.inscripcionesActivas || 0} / {sala?.aforoMaximo || '—'}
                              </span>
                              {sobrecupo && <p className="text-[10px] text-red-600 mt-0.5">Sobrecupo</p>}
                            </td>
                            <td className="py-3.5 px-4 text-right">
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
      </ModalShell>

      {/* Modales secundarios */}
      {modalSala && (
        <SalaFormModal
          isOpen
          sala={modalSala.sala}
          evento={evento}
          salasExistentes={salas}
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
          evento={evento}
          salas={salas}
          ponentes={ponentes}
          onClose={() => setModalProgramar(false)}
          onSubmit={handleProgramarActividad}
        />
      )}
    </>
  );
}
