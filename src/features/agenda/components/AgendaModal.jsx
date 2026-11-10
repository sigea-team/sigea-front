import { useState, useEffect } from 'react';
import { CalendarClock, Plus, RefreshCw, LayoutList, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import AgendaTimeline from './AgendaTimeline';
import AgendaTabla from './AgendaTabla';
import FiltrosAgenda from './FiltrosAgenda';
import ActividadFormModal from './ActividadFormModal';
import AgendaGeneracionPanel from './AgendaGeneracionPanel';
import { agendaService } from '../../../api/agendaService';
import { separarActividades, precargaAsignacionManual } from '../agendaPublicacionUtils';
import { confirmarDesprogramar } from '../accionesAgenda';
import { actividadService } from '../../../api/actividadService';
import { salaService } from '../../../api/salaService';
import { conferencistaService } from '../../../api/conferencistaService';
import { parametroEventoService } from '../../../api/parametroEventoService';

/**
 * @file AgendaModal.jsx
 * @description Modal embebible para administrar la agenda de un evento directamente (HU-21). HU-22: incluye la
 * franja de generación automática y publicación; la línea de tiempo y la tabla solo muestran las actividades con
 * horario.
 */
export default function AgendaModal({
  isOpen,
  evento,
  onClose,
  apiActividades = actividadService,
  apiSalas = salaService,
  apiConferencistas = conferencistaService,
  apiParametros = parametroEventoService,
  apiAgenda = agendaService,
}) {
  const [todasActividades, setActividades] = useState([]);
  const [salas, setSalas] = useState([]);
  const [ponentes, setPonentes] = useState([]);
  const [tiposActividad, setTiposActividad] = useState([]);
  const [propuestasProgramables, setPropuestasProgramables] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('timeline'); // 'timeline' | 'tabla'

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroSala, setFiltroSala] = useState('');
  const [soloSimultaneas, setSoloSimultaneas] = useState(false);

  // Modales
  const [modalFormulario, setModalFormulario] = useState(null); // null | { tipo: 'crear'|'editar', actividad: ... }
  const [version, setVersion] = useState(0);

  const eventoId = evento?.id;
  const recargar = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (!isOpen || !eventoId) return;

    let activo = true;

    Promise.allSettled([
      apiActividades.listarActividades(eventoId),
      apiSalas.listarSalas(eventoId),
      apiConferencistas.listarConferencistas(eventoId),
      apiParametros.listar('tipos', eventoId),
      // HU-19: propuestas aprobadas en versión definitiva que se pueden vincular a una actividad
      apiAgenda?.listarPropuestasProgramables
        ? apiAgenda.listarPropuestasProgramables(eventoId)
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
  }, [isOpen, eventoId, version, apiActividades, apiSalas, apiConferencistas, apiParametros, apiAgenda]);

  if (!isOpen || !evento) return null;

  // HU-22: las actividades por programar no tienen fecha ni horario; se gestionan en «Generar agenda».
  const { programadas: actividades } = separarActividades(todasActividades);

  // Filtrado
  const actividadesFiltradas = actividades.filter((a) => {
    if (filtroFecha && a.fecha !== filtroFecha) return false;
    if (filtroSala && String(a.salaId) !== String(filtroSala)) return false;
    if (soloSimultaneas && !a.permiteSimultaneidad) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchNom = (a.nombre || '').toLowerCase().includes(q);
      const matchPon = (a.ponenteNombre || '').toLowerCase().includes(q);
      if (!matchNom && !matchPon) return false;
    }
    return true;
  });

  const fechasDisponibles = Array.from(new Set(actividades.map((a) => a.fecha).filter(Boolean)));
  const hayFiltros = Boolean(busqueda.trim() || filtroFecha || filtroSala || soloSimultaneas);

  const handleCrear = async (datos) => {
    await apiActividades.crearActividad(eventoId, datos);
    recargar();
    Swal.fire({
      icon: 'success',
      title: 'Actividad programada',
      text: `«${datos.nombre}» fue agregada en el lugar cronológico correspondiente.`,
      timer: 2200,
      showConfirmButton: false,
    });
  };

  const handleEditar = async (datos) => {
    await apiActividades.actualizarActividad(eventoId, modalFormulario.actividad.id, datos);
    recargar();
    Swal.fire({
      icon: 'success',
      title: 'Actividad actualizada',
      text: `Se actualizaron los datos y se revalidaron los conflictos de la agenda.`,
      timer: 2200,
      showConfirmButton: false,
    });
  };

  const handleEliminar = (act) => {
    Swal.fire({
      title: '¿Eliminar actividad?',
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
        await apiActividades.eliminarActividad(eventoId, act.id);
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

  const handleDesprogramar = (act) => confirmarDesprogramar(apiAgenda, eventoId, act, recargar);
  const handleAsignarManual = (act) =>
    setModalFormulario({ tipo: 'editar', actividad: precargaAsignacionManual(act, evento) });

  return (
    <>
      <ModalShell
        titulo={`Agenda y Cronograma: ${evento.nombre}`}
        subtitulo="Organiza el desarrollo cronológico asignando sala, horario y ponente sin traslapes no planificados (HU-21)"
        icono={CalendarClock}
        onClose={onClose}
        ancho="max-w-5xl"
        pie={
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Barra superior con acciones y cambio de vista */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVista('timeline')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  vista === 'timeline'
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-muted text-ink-600 hover:bg-border'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Línea de tiempo
              </button>

              <button
                type="button"
                onClick={() => setVista('tabla')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  vista === 'tabla'
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-muted text-ink-600 hover:bg-border'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Tabla detallada
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => setModalFormulario({ tipo: 'crear' })}
                disabled={salas.length === 0}
                title={salas.length === 0 ? 'Debes registrar al menos una sala antes de programar' : undefined}
              >
                <Plus className="w-4 h-4" />
                <span>Programar actividad</span>
              </Button>
            </div>
          </div>

          {/* HU-22: generación automática y publicación */}
          <AgendaGeneracionPanel
            evento={evento}
            actividades={todasActividades}
            tiposActividad={tiposActividad}
            ponentes={ponentes}
            version={version}
            api={apiAgenda}
            apiActividades={apiActividades}
            onCambios={recargar}
            onAsignarManual={salas.length > 0 ? handleAsignarManual : undefined}
          />

          {/* Filtros */}
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
            hayFiltrosActivos={hayFiltros}
          />

          {/* Contenido principal */}
          {cargando ? (
            <div className="py-16 text-center text-xs text-ink-600">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
              Cargando cronograma del evento...
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
        </div>
      </ModalShell>

      {/* Modal de Formulario (Crear / Editar) */}
      {modalFormulario && (
        <ActividadFormModal
          key={`modal-actividad-${modalFormulario.tipo}-${modalFormulario.actividad?.id || 'nueva'}`}
          isOpen
          actividad={modalFormulario.tipo === 'editar' ? modalFormulario.actividad : null}
          evento={evento}
          salas={salas}
          ponentes={ponentes}
          tiposActividad={tiposActividad}
          propuestas={propuestasProgramables}
          actividadesExistentes={actividades}
          onClose={() => setModalFormulario(null)}
          onSubmit={modalFormulario.tipo === 'editar' ? handleEditar : handleCrear}
        />
      )}
    </>
  );
}
