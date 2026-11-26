import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Plus, Search, Shapes, ChevronLeft, ChevronRight } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { eventoService } from '../api/eventoService';
import { parametroEventoService } from '../api/parametroEventoService';
import { comiteService } from '../api/comiteService';
import { conferencistaService } from '../api/conferencistaService';
import { presupuestoService } from '../api/presupuestoService';
import { tipoEventoService } from '../api/tipoEventoService';
import { presupuestoAprobadoService } from '../api/presupuestoAprobadoService';
import { ejecucionPresupuestalService } from '../api/ejecucionPresupuestalService';
import { salaService } from '../api/salaService';
import EventoFormModal from '../features/eventos/components/EventoFormModal';
import NuevaEdicionModal from '../features/eventos/components/NuevaEdicionModal';
import ModificarFechasModal from '../features/eventos/components/ModificarFechasModal';
import EdicionesModal from '../features/eventos/components/EdicionesModal';
import EventoDeleteModal from '../features/eventos/components/EventoDeleteModal';
import ParametrosEventoModal from '../features/eventos/components/ParametrosEventoModal';
import TiposEventoModal from '../features/eventos/components/TiposEventoModal';
import ComiteOrganizadorModal from '../features/comite/components/ComiteOrganizadorModal';
import ConferencistasModal from '../features/conferencistas/components/ConferencistasModal';
import SalasModal from '../features/salas/components/SalasModal';
import AgendaModal from '../features/agenda/components/AgendaModal';
import PresupuestoPreliminarModal from '../features/presupuesto/components/PresupuestoPreliminarModal';
import PresupuestoAprobadoModal from '../features/presupuesto/components/PresupuestoAprobadoModal';
import EjecucionPresupuestalModal from '../features/presupuesto/components/EjecucionPresupuestalModal';
import InscripcionEventoModal from '../features/inscripciones/components/InscripcionEventoModal';
import EncuestasEventoModal from '../features/encuestas/components/EncuestasEventoModal';
import { encuestaService } from '../api/encuestaService';
import CertificadosEventoModal from '../features/certificados/components/CertificadosEventoModal';
import { certificadoService } from '../api/certificadoService';
import { inscripcionService } from '../api/inscripcionService';
import { asistenciaService } from '../api/asistenciaService';
import { memoriaHistoricaService } from '../api/memoriaHistoricaService';
import CierreFormalModal from '../features/memoria/components/CierreFormalModal';
import MemoriaHistoricaModal from '../features/memoria/components/MemoriaHistoricaModal';
import EliminacionHistoricaModal from '../features/memoria/components/EliminacionHistoricaModal';
import { puedeEliminarConAutorizacion } from '../features/memoria/memoriaUtils';
import {
  ESTADOS_EVENTO,
  extraerError,
  filtrarEventosPublicos,
  formatearRango,
} from '../features/eventos/eventoUtils';
import EventCard from '../features/eventos/components/EventCard';
import EventDetailPopup from '../features/eventos/components/EventDetailPopup';
import { useAuth } from '../context/AuthContext';
import { esAdministrador } from '../utils/permisos';

/**
 * @file EventosPage.jsx
 * @description Gestión de eventos y sus ediciones (HU-04: RF03 + RF04).
 * Lista los eventos y permite crearlos (Criterio 1), editarlos mientras están en configuración
 * (Criterio 2), crear nuevas ediciones (Criterio 3), consultar el historial de ediciones (Criterio 4)
 * y eliminarlos con confirmación (Criterio 5).
 * Desde cada fila también se abren los tipos de actividad y las líneas temáticas del evento (HU-05).
 * Desde cada fila también se abre el comité organizador del evento (HU-06).
 * Desde cada fila también se abre el presupuesto preliminar del evento (HU-07).
 * Desde cada fila también se abren los gastos y la ejecución presupuestal del evento (HU-09).
 * En cada fila solo quedan visibles «Publicar» y «Editar» (cuando el evento está en configuración);
 * el resto de acciones va agrupado por tema en el menú «Más».
 * El participante (sin perfil de administrador) se inscribe desde cada fila al evento y a sus actividades (HU-23).
 * Desde el menú «Más» el organizador configura, publica y consulta las encuestas de satisfacción del evento (HU-25).
 * HU-28: desde el menú «Más» el organizador hace el cierre formal de un evento finalizado. Un evento cerrado
 * formalmente se marca «Memoria histórica» y su menú solo ofrece consultar la memoria y sus ediciones (su información
 * ya no se modifica); quien tiene la autorización especial también puede eliminarlo.
 * @module pages/EventosPage
 */

const OPCIONES_ESTADO = [
  { value: 'todos', label: 'Todos los estados' },
  ...Object.entries(ESTADOS_EVENTO).map(([value, label]) => ({ value, label })),
];

const TARJETAS_POR_PAGINA = 8;

const ALERTA_EXITO = {
  icon: 'success',
  confirmButtonText: 'Entendido',
  confirmButtonColor: '#a6192e',
  customClass: { popup: 'rounded-[16px]', confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm' },
};

/**
 * @param {Object} props
 * @param {typeof eventoService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {typeof parametroEventoService} [props.apiParametros] - Cliente de la API de parámetros (HU-05).
 * @param {typeof comiteService} [props.apiComite] - Cliente de la API del comité (HU-06); Storybook inyecta una versión simulada.
 * @param {typeof conferencistaService} [props.apiConferencistas] - Cliente de la API de conferencistas (HU-12); Storybook inyecta una versión simulada.
 * @param {typeof presupuestoService} [props.apiPresupuesto] - Cliente de la API del presupuesto preliminar (HU-07); Storybook inyecta una versión simulada.
 * @param {typeof presupuestoAprobadoService} [props.apiPresupuestoAprobado] - Cliente de la API del presupuesto aprobado (HU-08); Storybook inyecta una versión simulada.
 * @param {typeof ejecucionPresupuestalService} [props.apiEjecucion] - Cliente de la API de la ejecución presupuestal (HU-09); Storybook inyecta una versión simulada.
 * @param {typeof tipoEventoService} [props.apiTiposEvento] - Cliente del catálogo de tipos de evento; Storybook inyecta una versión simulada.
 * @param {typeof inscripcionService} [props.apiInscripciones] - Cliente de la API de inscripciones (HU-23); Storybook inyecta una versión simulada.
 * @param {typeof asistenciaService} [props.apiAsistencia] - Cliente de la API del código QR (HU-24); Storybook inyecta una versión simulada.
 * @param {typeof encuestaService} [props.apiEncuestas] - Cliente de la API de encuestas de satisfacción (HU-25); Storybook inyecta una versión simulada.
 * @param {typeof certificadoService} [props.apiCertificados] - Cliente de la API de certificados (HU-26); Storybook inyecta una versión simulada.
 * @param {typeof memoriaHistoricaService} [props.apiMemoria] - Cliente de la API de la memoria histórica (HU-28); Storybook inyecta una versión simulada.
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 * @param {function(string): void} [props.onSelectNav]
 */
export default function EventosPage({
  api = eventoService,
  apiParametros = parametroEventoService,
  apiComite = comiteService,
  apiConferencistas = conferencistaService,
  apiPresupuesto = presupuestoService,
  apiTiposEvento = tipoEventoService,
  apiPresupuestoAprobado = presupuestoAprobadoService,
  apiEjecucion = ejecucionPresupuestalService,
  apiSalas = salaService,
  apiInscripciones = inscripcionService,
  apiAsistencia = asistenciaService,
  apiEncuestas = encuestaService,
  apiCertificados = certificadoService,
  apiMemoria = memoriaHistoricaService,
  usuarioProp,
  onSelectNav,
}) {
  const auth = useAuth();
  const usuarioActual = usuarioProp || auth?.usuario;
  const isAdmin = esAdministrador(usuarioActual);
  const puedeEliminarHistorico = puedeEliminarConAutorizacion(usuarioActual);

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [version, setVersion] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);

  // Reiniciar a la primera página al cambiar filtros
  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroEstado]);

  // Modal abierto: { tipo, evento }
  const [modal, setModal] = useState(null);

  // Popup de detalle para evento seleccionado
  const [eventoDetalle, setEventoDetalle] = useState(null);

  const abrirDetalle = (evento) => setEventoDetalle(evento);
  const cerrarDetalle = () => setEventoDetalle(null);

  /**
   * Acción disparada desde el popup: cierra el popup y abre el modal correspondiente.
   * @param {string} tipo
   * @param {Object} evento
   */
  const manejarAccionPopup = (tipo, evento) => {
    setModal({ tipo, evento });
  };

  // Catálogo de tipos de evento para el combobox del formulario (null mientras carga). La ventana de
  // administración se abre aparte, encima del formulario, para no perder lo que el usuario escribió.
  const [tiposEvento, setTiposEvento] = useState(null);
  const [tiposAbierto, setTiposAbierto] = useState(false);

  useEffect(() => {
    let activo = true;
    apiTiposEvento
      .listar()
      .then((data) => {
        if (activo) setTiposEvento(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // Sin catálogo el combobox queda vacío; el error de permisos o de conexión ya lo informa la carga de eventos.
        if (activo) setTiposEvento([]);
      });
    return () => {
      activo = false;
    };
  }, [apiTiposEvento]);

  /** Al cerrar la administración de tipos se refresca el combobox y la tabla (un tipo pudo cambiar de nombre). */
  const cerrarTipos = (lista) => {
    setTiposAbierto(false);
    if (Array.isArray(lista)) {
      setTiposEvento(lista);
      setCargando(true);
      setVersion((v) => v + 1);
    }
  };

  useEffect(() => {
    let activo = true;
    api
      .listarEventos()
      .then((data) => {
        if (!activo) return;
        const lista = Array.isArray(data) ? data : [];
        setEventos(isAdmin ? lista : filtrarEventosPublicos(lista));
        setErrorCarga(false);
      })
      .catch((err) => {
        if (!activo) return;
        setErrorCarga(true);
        Swal.fire({
          icon: 'error',
          title: 'No se pudieron cargar los eventos',
          text: extraerError(err).mensaje,
          showCancelButton: true,
          confirmButtonText: 'Reintentar',
          cancelButtonText: 'Cerrar',
          confirmButtonColor: '#a6192e',
          customClass: { popup: 'rounded-[16px]' },
        }).then((resultado) => {
          if (resultado.isConfirmed) {
            setCargando(true);
            setVersion((v) => v + 1);
          }
        });
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [api, version, isAdmin]);

  const recargar = () => {
    setCargando(true);
    setVersion((v) => v + 1);
  };

  const cerrarModal = () => setModal(null);

  /** Nombre del evento base de cada edición, y cuántas ediciones tiene cada base. */
  const { nombrePorId, edicionesPorBase } = useMemo(() => {
    const nombres = {};
    const conteo = {};
    eventos.forEach((e) => {
      nombres[e.id] = e.nombre;
      if (e.eventoBaseId) conteo[e.eventoBaseId] = (conteo[e.eventoBaseId] || 0) + 1;
    });
    return { nombrePorId: nombres, edicionesPorBase: conteo };
  }, [eventos]);

  const eventosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return eventos.filter((e) => {
      if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false;
      if (!texto) return true;
      return [e.nombre, e.tipo, e.semestre].some((campo) => (campo || '').toLowerCase().includes(texto));
    });
  }, [eventos, busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(eventosFiltrados.length / TARJETAS_POR_PAGINA));

  const eventosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * TARJETAS_POR_PAGINA;
    return eventosFiltrados.slice(inicio, inicio + TARJETAS_POR_PAGINA);
  }, [eventosFiltrados, pagina]);

  const terminar = (titulo, texto) => {
    cerrarModal();
    recargar();
    Swal.fire({ ...ALERTA_EXITO, title: titulo, text: texto });
  };

  const crear = async (datos) => {
    const creado = await api.crearEvento(datos);
    terminar('Evento creado', `«${creado.nombre}» quedó en configuración.`);
  };

  const editar = async (datos) => {
    const actualizado = await api.actualizarEvento(modal.evento.id, datos);
    terminar('Cambios guardados', `Se actualizó la configuración de «${actualizado.nombre}».`);
  };

  const modificarFechas = async (datos) => {
    const actualizado = await api.modificarFechasEvento(modal.evento.id, datos);
    terminar('Fechas actualizadas', `«${actualizado.nombre}» ahora va del ${formatearRango(actualizado.fechaInicio, actualizado.fechaFin)}.`);
  };

  const crearEdicion = async (datos) => {
    const edicion = await api.crearEdicion(modal.evento.id, datos);
    terminar('Edición creada', `«${edicion.nombre}» (${edicion.semestre}) quedó en configuración.`);
  };

  const eliminar = async (evento) => {
    await api.eliminarEvento(evento.id);
    terminar('Evento eliminado', `Se eliminó «${evento.nombre}».`);
  };

  const publicar = (evento) => {
    Swal.fire({
      title: '¿Publicar evento?',
      text: `Al publicar «${evento.nombre}», su estado pasará a habilitado y quedará disponible para las siguientes fases del sistema. El día de inicio pasará automáticamente a «en ejecución».`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, publicar',
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
        try {
          const publicado = await api.publicarEvento(evento.id);
          const nombre = publicado.nombre || evento.nombre;
          terminar(
            '¡Evento publicado!',
            publicado.estado === 'en_ejecucion'
              ? `«${nombre}» ya está en ejecución, porque hoy está dentro de sus fechas.`
              : `«${nombre}» ahora está habilitado. Pasará a «en ejecución» automáticamente el día de inicio.`
          );
        } catch (err) {
          const { mensaje } = extraerError(err);
          Swal.fire({
            icon: 'error',
            title: 'No se pudo publicar el evento',
            text: mensaje,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#a6192e',
            customClass: {
              popup: 'rounded-[16px]',
              confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
            },
          });
        }
      }
    });
  };

  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'todos';

  return (
    <MainLayout
      title={isAdmin ? "Gestión de eventos" : "Eventos académicos"}
      activeNav="eventos"
      onSelectNav={onSelectNav}
      usuario={usuarioActual}
    >
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-end justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
              SIGEA — {isAdmin ? 'Gestión de eventos' : 'Eventos académicos'}
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-1 tracking-tight">
              {isAdmin ? 'Eventos y ediciones' : 'Catálogo de eventos'}
            </h2>
            <p className="text-sm text-ink-600 mt-1 max-w-2xl">
              {isAdmin
                ? 'Crea los eventos del programa y reutiliza su configuración en cada nueva edición.'
                : 'Consulta los eventos académicos institucionales programados por la universidad.'}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setTiposAbierto(true)}>
                <Shapes className="w-4 h-4" />
                <span>Tipos de evento</span>
              </Button>
              <Button type="button" variant="primary" onClick={() => setModal({ tipo: 'crear', evento: null })}>
                <Plus className="w-4 h-4" />
                <span>Crear evento</span>
              </Button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-end gap-4">
          <div className="w-full max-w-sm">
            <Input
              id="buscar-evento"
              label="Buscar"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, tipo o semestre"
              rightElement={<Search className="w-4 h-4 text-ink-600" />}
            />
          </div>
          <div className="w-56">
            <Select
              id="filtro-estado"
              label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              options={OPCIONES_ESTADO}
            />
          </div>
          <p className="ml-auto text-xs text-ink-600 pb-3">
            {cargando ? 'Cargando...' : `${eventosFiltrados.length} de ${eventos.length} eventos`}
          </p>
        </div>

        {/* Galería de tarjetas */}
        {cargando && eventos.length === 0 && (
          <p className="py-16 text-center text-ink-600" role="status">Cargando eventos...</p>
        )}

        {!cargando && errorCarga && eventos.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-semibold text-base text-ink-900">No se pudieron cargar los eventos</p>
            <button
              type="button"
              onClick={recargar}
              className="text-xs mt-1 text-brand-600 font-semibold underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !errorCarga && eventosFiltrados.length === 0 && (
          <div className="py-16 text-center">
            {hayFiltros ? (
              <>
                <p className="font-semibold text-base text-ink-900">Ningún evento coincide con la búsqueda</p>
                <p className="text-xs mt-1 text-ink-600">Prueba con otro término o cambia el filtro de estado.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-base text-ink-900">Todavía no hay eventos registrados</p>
                <p className="text-xs mt-1 text-ink-600">
                  {isAdmin ? 'Usa «Crear evento» para registrar el primero.' : 'Próximamente se publicarán nuevos eventos académicos.'}
                </p>
              </>
            )}
          </div>
        )}

        {eventosFiltrados.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {eventosPaginados.map((evento) => {
                const nombreBase = evento.eventoBaseId ? nombrePorId[evento.eventoBaseId] : null;
                const derivadas = edicionesPorBase[evento.id] || 0;
                return (
                  <EventCard
                    key={evento.id}
                    evento={evento}
                    nombreBase={nombreBase}
                    derivadas={derivadas}
                    onClick={() => abrirDetalle(evento)}
                  />
                );
              })}
            </div>

            {/* Controles de paginación para optimización de carga y renderizado */}
            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                <p className="text-xs text-ink-600">
                  Mostrando <span className="font-semibold text-ink-900">{(pagina - 1) * TARJETAS_POR_PAGINA + 1}</span> a{' '}
                  <span className="font-semibold text-ink-900">
                    {Math.min(pagina * TARJETAS_POR_PAGINA, eventosFiltrados.length)}
                  </span>{' '}
                  de <span className="font-semibold text-ink-900">{eventosFiltrados.length}</span> eventos
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="h-9 px-3 rounded-[8px] border border-field-border bg-surface text-ink-900 text-xs font-medium hover:bg-surface-muted disabled:bg-surface-muted disabled:text-ink-300 disabled:border-border disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                      .filter((num) => num === 1 || num === totalPaginas || Math.abs(num - pagina) <= 1)
                      .map((num, idx, arr) => {
                        const anterior = arr[idx - 1];
                        const haySalto = anterior && num - anterior > 1;
                        return (
                          <div key={num} className="flex items-center">
                            {haySalto && <span className="px-1 text-xs text-ink-300">…</span>}
                            <button
                              type="button"
                              onClick={() => setPagina(num)}
                              className={`w-9 h-9 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                                pagina === num
                                  ? 'bg-brand-600 text-surface shadow-xs'
                                  : 'bg-surface text-ink-900 border border-field-border hover:bg-surface-muted'
                              }`}
                              aria-current={pagina === num ? 'page' : undefined}
                              aria-label={`Ir a la página ${num}`}
                            >
                              {num}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="h-9 px-3 rounded-[8px] border border-field-border bg-surface text-ink-900 text-xs font-medium hover:bg-surface-muted disabled:bg-surface-muted disabled:text-ink-300 disabled:border-border disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    aria-label="Página siguiente"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popup de detalle completo */}
      <EventDetailPopup
        isOpen={eventoDetalle !== null}
        evento={eventoDetalle}
        nombreBase={eventoDetalle?.eventoBaseId ? nombrePorId[eventoDetalle.eventoBaseId] : null}
        derivadas={eventoDetalle ? (edicionesPorBase[eventoDetalle.id] || 0) : 0}
        isAdmin={isAdmin}
        puedeEliminarHistorico={puedeEliminarHistorico}
        onClose={cerrarDetalle}
        onPublicar={publicar}
        onAccion={manejarAccionPopup}
      />

      {/* Los modales se montan con key para reiniciar su estado en cada apertura */}
      {(modal?.tipo === 'crear' || modal?.tipo === 'editar') && (
        <EventoFormModal
          key={`form-${modal.evento?.id ?? 'nuevo'}`}
          isOpen
          evento={modal.evento}
          onClose={cerrarModal}
          onSubmit={modal.tipo === 'crear' ? crear : editar}
          tiposEvento={tiposEvento}
          onAdministrarTipos={() => setTiposAbierto(true)}
        />
      )}

      {modal?.tipo === 'edicion' && (
        <NuevaEdicionModal
          key={`edicion-${modal.evento.id}`}
          isOpen
          origen={modal.evento}
          onClose={cerrarModal}
          onSubmit={crearEdicion}
        />
      )}

      {modal?.tipo === 'fechas' && (
        <ModificarFechasModal
          key={`fechas-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          onClose={cerrarModal}
          onSubmit={modificarFechas}
        />
      )}

      {modal?.tipo === 'historial' && (
        <EdicionesModal
          key={`historial-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={api}
          onClose={cerrarModal}
          onNuevaEdicion={(origen) => setModal({ tipo: 'edicion', evento: origen })}
        />
      )}

      {modal?.tipo === 'parametros' && (
        <ParametrosEventoModal
          key={`parametros-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiParametros}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'comite' && (
        <ComiteOrganizadorModal
          key={`comite-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiComite}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'conferencistas' && (
        <ConferencistasModal
          key={`conferencistas-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiConferencistas}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'salas' && (
        <SalasModal
          key={`salas-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiSalas}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'agenda' && (
        <AgendaModal
          key={`agenda-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'encuestas' && (
        <EncuestasEventoModal
          key={`encuestas-${modal.evento.id}`}
          evento={modal.evento}
          api={apiEncuestas}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'certificados' && (
        <CertificadosEventoModal
          key={`certificados-${modal.evento.id}`}
          evento={modal.evento}
          api={apiCertificados}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'cierre' && (
        <CierreFormalModal
          key={`cierre-${modal.evento.id}`}
          evento={modal.evento}
          api={apiMemoria}
          onClose={cerrarModal}
          onCerrado={() =>
            terminar(
              'Evento cerrado formalmente',
              `La información de «${modal.evento.nombre}» quedó consolidada en la memoria histórica. Desde ahora es solo de consulta.`
            )
          }
        />
      )}

      {modal?.tipo === 'memoria' && (
        <MemoriaHistoricaModal
          key={`memoria-${modal.evento.id}`}
          evento={modal.evento}
          api={apiMemoria}
          onClose={cerrarModal}
          onEliminar={puedeEliminarHistorico ? () => setModal({ tipo: 'eliminarHistorico', evento: modal.evento }) : undefined}
        />
      )}

      {modal?.tipo === 'eliminarHistorico' && (
        <EliminacionHistoricaModal
          key={`eliminar-historico-${modal.evento.id}`}
          evento={modal.evento}
          api={apiMemoria}
          onClose={cerrarModal}
          onEliminado={(mensaje) => terminar('Evento eliminado', mensaje)}
        />
      )}

      {modal?.tipo === 'presupuesto' && (
        <PresupuestoPreliminarModal
          key={`presupuesto-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiPresupuesto}
          onClose={cerrarModal}
          onAbrirPresupuestoAprobado={() => setModal({ tipo: 'presupuestoAprobado', evento: modal.evento })}
        />
      )}

      {modal?.tipo === 'presupuestoAprobado' && (
        <PresupuestoAprobadoModal
          key={`aprobado-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiPresupuestoAprobado}
          onClose={cerrarModal}
          onAbrirPreliminar={() => setModal({ tipo: 'presupuesto', evento: modal.evento })}
          onPresupuestoActualizado={recargar}
        />
      )}

      {modal?.tipo === 'ejecucion' && (
        <EjecucionPresupuestalModal
          key={`ejecucion-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiEjecucion}
          onClose={cerrarModal}
          onAbrirPresupuestoAprobado={() => setModal({ tipo: 'presupuestoAprobado', evento: modal.evento })}
        />
      )}

      {modal?.tipo === 'inscripcion' && (
        <InscripcionEventoModal
          key={`inscripcion-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          api={apiInscripciones}
          apiAsistencia={apiAsistencia}
          onClose={cerrarModal}
        />
      )}

      {modal?.tipo === 'eliminar' && (
        <EventoDeleteModal
          key={`eliminar-${modal.evento.id}`}
          isOpen
          evento={modal.evento}
          edicionesDerivadas={edicionesPorBase[modal.evento.id] || 0}
          onClose={cerrarModal}
          onConfirm={eliminar}
        />
      )}

      {/* Se monta después del formulario para quedar encima si se abre desde él */}
      {tiposAbierto && <TiposEventoModal key="tipos-evento" isOpen api={apiTiposEvento} onClose={cerrarTipos} />}
    </MainLayout>
  );
}
