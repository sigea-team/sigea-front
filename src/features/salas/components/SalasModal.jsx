import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Link2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Unlink,
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
import AsignarSalaEventoModal from './AsignarSalaEventoModal';
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
  const [modalSala, setModalSala] = useState(null); // { tipo: 'editar', sala: Object }
  // Salas del catálogo que aún no están en el evento; con valor, se abre el modal de asignación.
  const [salasParaAsignar, setSalasParaAsignar] = useState(null);
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
  // Desde el evento no se crean salas: se asignan salas ya creadas en el catálogo («Salas y Espacios»).
  const abrirAsignarSala = async () => {
    try {
      const catalogo = await api.listarSalasGlobales();
      const yaAsignadas = new Set(salas.map((s) => String(s.id)));
      const libres = (Array.isArray(catalogo) ? catalogo : []).filter((s) => !yaAsignadas.has(String(s.id)));
      if (libres.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'No hay salas para asignar',
          text: 'Todas las salas del catálogo ya están asignadas a este evento. Las salas nuevas se crean en «Salas y Espacios».',
          confirmButtonColor: '#a6192e',
        });
        return;
      }
      setSalasParaAsignar(libres);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo cargar el catálogo de salas',
        text: mensajeApi(err, 'Intenta de nuevo en unos segundos.'),
        confirmButtonColor: '#a6192e',
      });
    }
  };

  const handleAsignarSala = async ({ sala }) => {
    await conMensajeApi(() => api.vincularSalaEvento(eventoId, sala.id), 'No fue posible asignar la sala al evento.');
    Swal.fire({
      icon: 'success',
      title: 'Sala asignada',
      text: `La sala «${sala.nombre}» quedó asignada a «${evento.nombre}».`,
      confirmButtonColor: '#a6192e',
    });
    recargar();
  };

  const handleGuardarSala = async (datos) => {
    if (modalSala?.tipo === 'editar') {
      const actualizada = await conMensajeApi(
        () => api.actualizarSala(eventoId, modalSala.sala.id, datos),
        'No fue posible actualizar la sala.'
      );
      // HU-20 Criterio 5: avisa las actividades del evento que quedaron fuera de las nuevas franjas.
      await avisarDisponibilidad(actualizada, 'Sala actualizada', `Se actualizaron los datos de «${datos.nombre}».`);
    }
    recargar();
  };

  // Desde el evento la sala solo se quita del evento (desvincular); sigue en el catálogo para otros eventos.
  // El backend no deja desvincularla si tiene actividades programadas en este evento.
  const handleDesvincularSala = async (sala) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title: `¿Quitar «${sala.nombre}» de este evento?`,
      text: 'La sala dejará de estar disponible en este evento, pero seguirá en el catálogo institucional.',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
    });

    if (confirm.isConfirmed) {
      try {
        await api.desvincularSalaEvento(eventoId, sala.id);
        Swal.fire({
          icon: 'success',
          title: 'Sala quitada del evento',
          text: `«${sala.nombre}» ya no está asignada a «${evento.nombre}».`,
          confirmButtonColor: '#a6192e',
        });
        recargar();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo quitar la sala',
          text: mensajeApi(err, 'La sala no pudo quitarse del evento.'),
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
    const confirmacion = await Swal.fire({
      title: '¿Eliminar actividad?',
      text: 'Se removerá esta actividad de la programación y de la sala.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
    });
    if (!confirmacion.isConfirmed) return;
    try {
      // La API recibe (eventoId, actividadId); antes se pasaba solo el id y la ruta quedaba en /undefined.
      await api.eliminarActividad(eventoId, actividadId);
      Swal.fire({ icon: 'success', title: 'Actividad eliminada', timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar la actividad',
        text: mensajeApi(err, 'No fue posible eliminar la actividad.'),
        confirmButtonColor: '#a6192e',
      });
    }
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
          <div className="flex items-center justify-between border-b border-border gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPestanaActiva('salas')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  pestanaActiva === 'salas'
                    ? 'border-brand-600 text-brand-600 bg-brand-100'
                    : 'border-transparent text-ink-600 hover:text-ink-900'
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
                    ? 'border-brand-600 text-brand-600 bg-brand-100'
                    : 'border-transparent text-ink-600 hover:text-ink-900'
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
                    ? 'border-brand-600 text-brand-600 bg-brand-100'
                    : 'border-transparent text-ink-600 hover:text-ink-900'
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
            <div className="p-4 rounded-xl bg-brand-100 border border-brand-600 text-brand-700 text-xs">
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
                    rightElement={<Search className="w-4 h-4 text-ink-600" />}
                  />
                </div>
                <Button type="button" variant="primary" onClick={abrirAsignarSala}>
                  <Link2 className="w-4 h-4" />
                  <span>Asignar sala</span>
                </Button>
              </div>

              {salasFiltradas.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-[12px] border border-dashed border-field-border bg-surface-muted">
                  <Building className="w-10 h-10 text-ink-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-ink-900">No hay salas asignadas</p>
                  <p className="text-xs text-ink-600 mt-1 max-w-md mx-auto">
                    Asigna una sala del catálogo institucional para habilitar la infraestructura del evento.
                  </p>
                  <div className="mt-4">
                    <Button type="button" variant="primary" size="sm" onClick={abrirAsignarSala}>
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Asignar sala</span>
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
                        className="rounded-[12px] border border-border bg-white p-4 shadow-xs hover:border-brand-600 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-serif-title text-base font-semibold text-ink-900 leading-snug">
                                {sala.nombre}
                              </h4>
                              {sala.ubicacion && (
                                <p className="text-xs text-ink-600 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-600" />
                                  <span className="truncate">{sala.ubicacion}</span>
                                </p>
                              )}
                            </div>
                            <TipoSalaBadge tipo={sala.tipo} />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                            <AforoBadge aforo={sala.aforoMaximo} />
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-muted text-ink-600 border border-border"
                              title="Franjas horarias de disponibilidad"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              {cantFranjas} {cantFranjas === 1 ? 'franja' : 'franjas'} de horario
                            </span>
                            {actividadesSala.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-muted text-ink-600">
                                {actividadesSala.length} {actividadesSala.length === 1 ? 'actividad' : 'actividades'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setModalDisponibilidadSala(sala)}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Configurar disponibilidad
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setModalSala({ tipo: 'editar', sala })}
                              className="p-1.5 text-ink-600 hover:text-ink-900 hover:bg-surface-muted rounded cursor-pointer"
                              title="Editar sala"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDesvincularSala(sala)}
                              className="p-1.5 text-brand-700 hover:bg-brand-100 rounded cursor-pointer"
                              title="Quitar sala del evento"
                              aria-label={`Quitar ${sala.nombre} del evento`}
                            >
                              <Unlink className="w-4 h-4" />
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
              <div className="bg-surface-muted p-4 rounded-[12px] border border-border">
                <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-brand-600" />
                  Disponibilidad de ponentes registrados (Criterio 2)
                </h4>
                <p className="text-xs text-ink-600 mt-0.5">
                  Define los rangos horarios en que los ponentes del evento están disponibles.
                  El sistema los guardará como referencia para la programación y advertirá si cambios
                  generan conflicto con actividades programadas (Criterio 5).
                </p>
              </div>

              {ponentes.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-[12px] border border-dashed border-field-border bg-surface-muted">
                  <User className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-ink-900">No hay ponentes registrados para este evento</p>
                  <p className="text-[11px] text-ink-600 mt-0.5">
                    Vincula o invita conferencistas desde el módulo de conferencistas para configurar su disponibilidad.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-[12px] border border-border bg-white overflow-hidden shadow-xs">
                  {ponentes.map((p) => {
                    const cantFranjas = p.disponibilidad?.length || 0;
                    const actividadesPonente = actividades.filter(
                      (a) => Number(a.ponenteId) === Number(p.personaId)
                    );

                    return (
                      <div
                        key={p.personaId}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-muted transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-ink-900">
                              {p.nombres} {p.apellidos}
                            </span>
                            {cantFranjas > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-brand-600 text-surface px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                {cantFranjas} {cantFranjas === 1 ? 'rango' : 'rangos'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                                Sin disponibilidad definida
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-600">
                            {p.institucion ? `${p.institucion} • ` : ''}
                            {p.correo}
                          </p>
                          {actividadesPonente.length > 0 && (
                            <p className="text-[11px] text-ink-600 font-medium">
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
                <div role="status" className="flex items-start gap-3 p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    La programación de actividades todavía no está disponible: el backend aún no tiene este servicio.
                    Por ahora puedes registrar las salas y la disponibilidad horaria de salas y ponentes.
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                    Actividades programadas en infraestructura
                  </h4>
                  <p className="text-xs text-ink-600 mt-0.5">
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
                <div className="text-center py-10 px-4 rounded-[12px] border border-dashed border-field-border bg-surface-muted">
                  <Calendar className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-ink-900">No hay actividades programadas</p>
                  <p className="text-[11px] text-ink-600 mt-0.5">
                    Usa «Programar actividad» para agendar respetando el aforo y la disponibilidad registrada.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[12px] border border-border bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-muted border-b border-border font-bold text-ink-900 uppercase">
                        <th className="py-3 px-4">Actividad</th>
                        <th className="py-3 px-4">Sala Asignada</th>
                        <th className="py-3 px-4">Ponente</th>
                        <th className="py-3 px-4">Fecha y Horario</th>
                        <th className="py-3 px-4">Inscritos / Aforo</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-ink-900">
                      {actividades.map((act) => {
                        const sala = salas.find((s) => Number(s.id) === Number(act.salaId));
                        const ponente = ponentes.find((p) => Number(p.personaId) === Number(act.ponenteId));
                        const sobrecupo = sala && (act.inscripcionesActivas || 0) > sala.aforoMaximo;

                        return (
                          <tr key={act.id} className="hover:bg-surface-muted transition-colors">
                            <td className="py-3.5 px-4 font-semibold">
                              <p>{act.nombre}</p>
                              {act.tieneAdvertencia && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-brand-700 bg-brand-100 px-2 py-0.5 rounded font-medium border border-border">
                                  <AlertTriangle className="w-3 h-3 text-brand-600" />
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
                              <p className="text-ink-600 text-[11px]">
                                {formatearHora(act.horaInicio)} – {formatearHora(act.horaFin)}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  sobrecupo ? 'text-brand-700 bg-brand-100 px-2 py-0.5 rounded' : 'text-ink-900'
                                }`}
                              >
                                {act.inscripcionesActivas || 0} / {sala?.aforoMaximo || '—'}
                              </span>
                              {sobrecupo && <p className="text-[10px] text-brand-700 mt-0.5">Sobrecupo</p>}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleEliminarActividad(act.id)}
                                className="p-1.5 text-brand-700 hover:bg-brand-100 rounded cursor-pointer"
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

      {salasParaAsignar && (
        <AsignarSalaEventoModal
          isOpen
          salasDisponibles={salasParaAsignar}
          eventos={[evento]}
          eventoActualId={String(eventoId)}
          onClose={() => setSalasParaAsignar(null)}
          onAsignar={handleAsignarSala}
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
