import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { FileText, Plus, Search, RotateCw, Info } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { convocatoriaService } from '../api/convocatoriaService';
import { eventoService } from '../api/eventoService';
import ConvocatoriaFormModal from '../features/convocatorias/components/ConvocatoriaFormModal';
import ConvocatoriasTable from '../features/convocatorias/components/ConvocatoriasTable';
import { formatearFechaHora, puedeEnviarPropuesta } from '../features/convocatorias/convocatoriaUtils';

/**
 * @file ConvocatoriasPage.jsx
 * @description Gestión integral de convocatorias asociadas a eventos académicos (HU Crear convocatorias).
 * Orquesta la vista principal, filtros, llamadas a la API y modales.
 * @module pages/ConvocatoriasPage
 */

const OPCIONES_FILTRO_ESTADO = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'PUBLICADA', label: 'Publicada / Abierta' },
  { value: 'CERRADA', label: 'Cerrada / Vencida' },
];

const ALERTA_EXITO = {
  icon: 'success',
  confirmButtonText: 'Entendido',
  confirmButtonColor: '#a6192e',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

/**
 * Componente de página para la gestión de convocatorias académicas.
 * @param {Object} props
 * @param {typeof convocatoriaService} [props.api] - Cliente de API para convocatorias.
 * @param {typeof eventoService} [props.apiEventos] - Cliente de API para eventos.
 * @param {Object} [props.usuarioProp] - Usuario autenticado opcional (para Storybook o pruebas).
 * @param {Function} [props.onSelectNav] - Callback para navegación de ítems de menú.
 */
export default function ConvocatoriasPage({
  api = convocatoriaService,
  apiEventos = eventoService,
  usuarioProp,
  onSelectNav,
}) {
  const [convocatorias, setConvocatorias] = useState([]);
  const [eventosDisponibles, setEventosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modal: { tipo: 'crear' | 'editar', convocatoria }
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    Promise.all([api.listarConvocatorias(), apiEventos.listarEventos().catch(() => [])])
      .then(([listaConvocatorias, listaEventos]) => {
        if (!activo) return;
        setConvocatorias(Array.isArray(listaConvocatorias) ? listaConvocatorias : []);

        const eventosOpciones = (Array.isArray(listaEventos) ? listaEventos : []).map((ev) => ({
          value: String(ev.id),
          label: ev.nombre,
        }));
        setEventosDisponibles(eventosOpciones);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) {
          const msg =
            err?.response?.data?.mensaje ||
            err?.response?.data?.message ||
            err?.message ||
            'Error al cargar las convocatorias.';
          setErrorCarga(msg);
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [api, apiEventos, version]);

  const recargar = () => setVersion((v) => v + 1);
  const cerrarModal = () => setModal(null);

  const convocatoriasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return convocatorias.filter((c) => {
      const estadoUpper = (c.estado || '').toUpperCase();
      if (filtroEstado !== 'todos') {
        if (filtroEstado === 'PUBLICADA' && estadoUpper !== 'PUBLICADA' && estadoUpper !== 'ABIERTA') {
          return false;
        } else if (filtroEstado !== 'PUBLICADA' && estadoUpper !== filtroEstado) {
          return false;
        }
      }
      if (!texto) return true;
      return [c.titulo, c.eventoNombre, c.descripcion].some((campo) =>
        (campo || '').toLowerCase().includes(texto)
      );
    });
  }, [convocatorias, busqueda, filtroEstado]);

  // Criterio 1: Guardado en borrador
  const crear = async (datos) => {
    const creada = await api.crearConvocatoria(datos);
    cerrarModal();
    recargar();
    Swal.fire({
      ...ALERTA_EXITO,
      title: 'Convocatoria guardada',
      text: `La convocatoria «${creada.titulo}» fue guardada exitosamente en estado Borrador (Criterio 1).`,
    });
  };

  // Criterio 3: Edición de convocatoria existente en borrador sin publicarla
  const editar = async (datos) => {
    const actualizada = await api.actualizarConvocatoria(modal.convocatoria.id, datos);
    cerrarModal();
    recargar();
    Swal.fire({
      ...ALERTA_EXITO,
      title: 'Cambios actualizados',
      text: `Se actualizó la información de «${actualizada.titulo}» manteniéndose en borrador (Criterio 3).`,
    });
  };

  const publicar = (convocatoria) => {
    Swal.fire({
      title: '¿Publicar convocatoria?',
      text: `Al publicar «${convocatoria.titulo}», quedará abierta oficialmente para que los autores puedan enviar sus propuestas durante el periodo de recepción.`,
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
          const publicada = await api.publicarConvocatoria(convocatoria.id);
          recargar();
          Swal.fire({
            ...ALERTA_EXITO,
            title: '¡Convocatoria publicada!',
            text: `La convocatoria «${publicada.titulo || convocatoria.titulo}» ahora está publicada y disponible para la comunidad académica.`,
          });
        } catch (err) {
          const msg =
            err?.response?.data?.mensaje ||
            err?.response?.data?.message ||
            err?.message ||
            'No se pudo publicar la convocatoria.';
          Swal.fire({
            icon: 'error',
            title: 'Error al publicar',
            text: msg,
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

  const eliminar = (convocatoria) => {
    Swal.fire({
      title: '¿Eliminar convocatoria?',
      text: `Se eliminará la convocatoria en borrador «${convocatoria.titulo}». Esta acción no se puede deshacer.`,
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
        await api.eliminarConvocatoria(convocatoria.id);
        recargar();
        Swal.fire({
          ...ALERTA_EXITO,
          title: 'Convocatoria eliminada',
          text: `La convocatoria «${convocatoria.titulo}» ha sido eliminada.`,
        });
      }
    });
  };

  // Criterio 4: Verificación de intento de envío de propuesta
  const intentarEnviarPropuesta = (convocatoria) => {
    const validacion = puedeEnviarPropuesta(convocatoria);
    if (!validacion.permitido) {
      Swal.fire({
        icon: 'error',
        title: 'Envío de propuesta no permitido',
        text: validacion.motivo,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
      return;
    }

    Swal.fire({
      icon: 'info',
      title: 'Formulario de envío de propuesta',
      text: `El periodo de recepción está activo hasta el ${formatearFechaHora(convocatoria.fechaCierre)}.`,
      confirmButtonText: 'Continuar al formulario',
      confirmButtonColor: '#a6192e',
      customClass: {
        popup: 'rounded-[16px]',
        confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
      },
    });
  };

  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'todos';

  return (
    <MainLayout
      title="Gestión de convocatorias"
      activeNav="convocatorias"
      onSelectNav={onSelectNav}
      usuario={usuarioProp}
    >
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              SIGEA — Convocatorias y recepción de propuestas
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1 tracking-tight">
              Convocatorias académicas
            </h2>
            <p className="text-sm text-[#5b5f66] mt-1 max-w-2xl">
              Configura las fechas de apertura y cierre para la recepción de ponencias, pósters y artículos
              asociados a cada evento.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setModal({ tipo: 'crear', convocatoria: null })}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Crear convocatoria</span>
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="w-full sm:max-w-sm">
            <Input
              id="buscar-convocatoria"
              label="Buscar convocatoria"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Título, evento o descripción..."
              rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              id="filtro-estado-convocatoria"
              label="Estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              options={OPCIONES_FILTRO_ESTADO}
            />
          </div>
          <p className="sm:ml-auto text-xs text-[#5b5f66] sm:pb-3 self-end">
            {cargando ? 'Cargando...' : `${convocatoriasFiltradas.length} de ${convocatorias.length} convocatorias`}
          </p>
        </div>

        {/* Alerta de Error de carga */}
        {errorCarga && (
          <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#a6192e] shrink-0" />
              <span>{errorCarga}</span>
            </div>
            <button
              type="button"
              onClick={recargar}
              className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla Modular de Convocatorias */}
        <ConvocatoriasTable
          convocatorias={convocatoriasFiltradas}
          cargando={cargando}
          hayFiltros={hayFiltros}
          onEditar={(conv) => setModal({ tipo: 'editar', convocatoria: conv })}
          onPublicar={publicar}
          onEliminar={eliminar}
          onIntentarEnviar={intentarEnviarPropuesta}
        />
      </div>

      {/* Modal Crear / Editar */}
      {modal && (
        <ConvocatoriaFormModal
          key={`modal-convocatoria-${modal.convocatoria?.id || 'nueva'}`}
          isOpen={Boolean(modal)}
          convocatoria={modal.convocatoria}
          eventosDisponibles={eventosDisponibles}
          onClose={cerrarModal}
          onSubmit={modal.tipo === 'crear' ? crear : editar}
        />
      )}
    </MainLayout>
  );
}
