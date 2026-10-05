import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { CalendarDays, CopyPlus, History, Pencil, Plus, Search, Tags, Trash2, Users } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import BotonAccion from '../components/ui/BotonAccion';
import { eventoService } from '../api/eventoService';
import { parametroEventoService } from '../api/parametroEventoService';
import { comiteService } from '../api/comiteService';
import EstadoEventoBadge from '../features/eventos/components/EstadoEventoBadge';
import EventoFormModal from '../features/eventos/components/EventoFormModal';
import NuevaEdicionModal from '../features/eventos/components/NuevaEdicionModal';
import EdicionesModal from '../features/eventos/components/EdicionesModal';
import EventoDeleteModal from '../features/eventos/components/EventoDeleteModal';
import ParametrosEventoModal from '../features/eventos/components/ParametrosEventoModal';
import ComiteOrganizadorModal from '../features/comite/components/ComiteOrganizadorModal';
import {
  ESTADOS_EVENTO,
  esEditable,
  etiquetaModalidad,
  extraerError,
  formatearRango,
} from '../features/eventos/eventoUtils';

/**
 * @file EventosPage.jsx
 * @description Gestión de eventos y sus ediciones (HU-04: RF03 + RF04).
 * Lista los eventos y permite crearlos (Criterio 1), editarlos mientras están en configuración
 * (Criterio 2), crear nuevas ediciones (Criterio 3), consultar el historial de ediciones (Criterio 4)
 * y eliminarlos con confirmación (Criterio 5).
 * Desde cada fila también se abren los tipos de actividad y las líneas temáticas del evento (HU-05).
 * Desde cada fila también se abre el comité organizador del evento (HU-06).
 * @module pages/EventosPage
 */

const OPCIONES_ESTADO = [
  { value: 'todos', label: 'Todos los estados' },
  ...Object.entries(ESTADOS_EVENTO).map(([value, label]) => ({ value, label })),
];

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
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 * @param {function(string): void} [props.onSelectNav]
 */
export default function EventosPage({ api = eventoService, apiParametros = parametroEventoService, apiComite = comiteService, usuarioProp, onSelectNav }) {

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [version, setVersion] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modal abierto: { tipo: 'crear'|'editar'|'edicion'|'historial'|'eliminar'|'parametros'|'comite', evento }
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let activo = true;
    api
      .listarEventos()
      .then((data) => {
        if (!activo) return;
        setEventos(Array.isArray(data) ? data : []);
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
  }, [api, version]);

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

  const crearEdicion = async (datos) => {
    const edicion = await api.crearEdicion(modal.evento.id, datos);
    terminar('Edición creada', `«${edicion.nombre}» (${edicion.semestre}) quedó en configuración.`);
  };

  const eliminar = async (evento) => {
    await api.eliminarEvento(evento.id);
    terminar('Evento eliminado', `Se eliminó «${evento.nombre}».`);
  };

  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'todos';

  return (
    <MainLayout title="Gestión de eventos" activeNav="eventos" onSelectNav={onSelectNav} usuario={usuarioProp}>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-end justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              SIGEA — Eventos académicos
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1 tracking-tight">Eventos y ediciones</h2>
            <p className="text-sm text-[#5b5f66] mt-1 max-w-2xl">
              Crea los eventos del programa y reutiliza su configuración en cada nueva edición.
            </p>
          </div>
          <Button type="button" variant="primary" onClick={() => setModal({ tipo: 'crear', evento: null })} className="shrink-0">
            <Plus className="w-4 h-4" />
            <span>Crear evento</span>
          </Button>
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
              rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
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
          <p className="ml-auto text-xs text-[#5b5f66] pb-3">
            {cargando ? 'Cargando...' : `${eventosFiltrados.length} de ${eventos.length} eventos`}
          </p>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Evento</th>
                  <th scope="col" className="py-3.5 px-5">Fechas</th>
                  <th scope="col" className="py-3.5 px-5">Semestre</th>
                  <th scope="col" className="py-3.5 px-5">Modalidad</th>
                  <th scope="col" className="py-3.5 px-5">Estado</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
                {cargando && eventos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 px-5 text-center text-[#5b5f66]" role="status">
                      Cargando eventos...
                    </td>
                  </tr>
                )}

                {!cargando && errorCarga && eventos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 px-5 text-center">
                      <p className="font-semibold text-base text-[#1f2023]">No se pudieron cargar los eventos</p>
                      <button
                        type="button"
                        onClick={recargar}
                        className="text-xs mt-1 text-[#a6192e] font-semibold underline cursor-pointer"
                      >
                        Reintentar
                      </button>
                    </td>
                  </tr>
                )}

                {!cargando && !errorCarga && eventosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 px-5 text-center">
                      {hayFiltros ? (
                        <>
                          <p className="font-semibold text-base text-[#1f2023]">Ningún evento coincide con la búsqueda</p>
                          <p className="text-xs mt-1 text-[#5b5f66]">Prueba con otro término o cambia el filtro de estado.</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-base text-[#1f2023]">Todavía no hay eventos registrados</p>
                          <p className="text-xs mt-1 text-[#5b5f66]">Usa «Crear evento» para registrar el primero.</p>
                        </>
                      )}
                    </td>
                  </tr>
                )}

                {eventosFiltrados.map((evento) => {
                  const editable = esEditable(evento);
                  const motivoBloqueo = `Solo disponible en configuración. Estado actual: ${ESTADOS_EVENTO[evento.estado] || evento.estado}.`;
                  const nombreBase = evento.eventoBaseId ? nombrePorId[evento.eventoBaseId] : null;
                  const derivadas = edicionesPorBase[evento.id] || 0;

                  return (
                    <tr key={evento.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                      <td className="py-4 px-5 align-middle max-w-sm">
                        <p className="font-semibold text-[#1f2023]">{evento.nombre}</p>
                        <p className="text-xs text-[#5b5f66] mt-0.5">
                          {evento.tipo}
                          {evento.esEdicion
                            ? ` — edición de ${nombreBase || 'otro evento'}`
                            : derivadas > 0
                            ? ` — evento base de ${derivadas} ${derivadas === 1 ? 'edición' : 'ediciones'}`
                            : ''}
                        </p>
                      </td>
                      <td className="py-4 px-5 align-middle whitespace-nowrap text-[#1f2023]">
                        {formatearRango(evento.fechaInicio, evento.fechaFin)}
                      </td>
                      <td className="py-4 px-5 align-middle">{evento.semestre || '—'}</td>
                      <td className="py-4 px-5 align-middle">{etiquetaModalidad(evento.modalidad)}</td>
                      <td className="py-4 px-5 align-middle">
                        <EstadoEventoBadge estado={evento.estado} />
                      </td>
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <BotonAccion
                    icono={Tags}
                    etiqueta="Tipos de actividad y líneas temáticas"
                    onClick={() => setModal({ tipo: 'parametros', evento })}
                         />
                          <BotonAccion
                            icono={Users}
                            etiqueta="Comité organizador"
                            onClick={() => setModal({ tipo: 'comite', evento })}
                         />
                          <BotonAccion
                            icono={History}
                            etiqueta="Ver historial de ediciones"
                            onClick={() => setModal({ tipo: 'historial', evento })}
                          />
                          <BotonAccion
                            icono={CopyPlus}
                            etiqueta="Crear nueva edición a partir de este evento"
                            onClick={() => setModal({ tipo: 'edicion', evento })}
                          />
                          <BotonAccion
                            icono={Pencil}
                            etiqueta="Editar configuración"
                            onClick={() => setModal({ tipo: 'editar', evento })}
                            disabled={!editable}
                            motivo={motivoBloqueo}
                          />
                          <BotonAccion
                            icono={Trash2}
                            etiqueta="Eliminar evento"
                            onClick={() => setModal({ tipo: 'eliminar', evento })}
                            disabled={!editable}
                            motivo={motivoBloqueo}
                            peligro
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Los modales se montan con key para reiniciar su estado en cada apertura */}
      {(modal?.tipo === 'crear' || modal?.tipo === 'editar') && (
        <EventoFormModal
          key={`form-${modal.evento?.id ?? 'nuevo'}`}
          isOpen
          evento={modal.evento}
          onClose={cerrarModal}
          onSubmit={modal.tipo === 'crear' ? crear : editar}
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
    </MainLayout>
  );
}
