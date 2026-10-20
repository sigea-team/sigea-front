import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, RotateCw, Info, Globe } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { convocatoriaService } from '../api/convocatoriaService';
import { eventoService } from '../api/eventoService';
import ConvocatoriaFormModal from '../features/convocatorias/components/ConvocatoriaFormModal';
import ConvocatoriasTable from '../features/convocatorias/components/ConvocatoriasTable';
import FechaCierreModal from '../features/convocatorias/components/FechaCierreModal';
import PropuestaFormModal from '../features/propuestas/components/PropuestaFormModal';
import {
  formatearFechaHora,
  listarCamposFaltantes,
  mensajeErrorApi,
  puedeEnviarPropuesta,
} from '../features/convocatorias/convocatoriaUtils';
import { useAuth } from '../context/AuthContext';
import { esAdministrador } from '../utils/permisos';

/**
 * @file ConvocatoriasPage.jsx
 * @description Gestión integral de convocatorias asociadas a eventos académicos (HU Crear convocatorias).
 * Orquesta la vista principal, filtros, llamadas a la API y modales.
 * HU-11 (Publicar convocatorias):
 * - Criterio 1: publicar una convocatoria completa en borrador la hace visible en la vista pública.
 * - Criterio 2: modificar la fecha límite de una publicada notifica el cambio a los usuarios.
 * - Criterio 3: si falta la fecha límite u otro dato obligatorio, se informa qué completar.
 * @module pages/ConvocatoriasPage
 */

const OPCIONES_FILTRO_ESTADO = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'PUBLICADA', label: 'Publicada / Abierta' },
  { value: 'CERRADA', label: 'Cerrada / Vencida' },
];

/** SweetAlert2 con soporte de contenido React: el texto se escapa solo, sin construir HTML a mano. */
const SwalReact = withReactContent(Swal);

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
  const navigate = useNavigate();
  const [convocatorias, setConvocatorias] = useState([]);
  const [eventosDisponibles, setEventosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modal: { tipo: 'crear' | 'editar' | 'fecha', convocatoria }
  const [modal, setModal] = useState(null);
  // Modal de propuesta de ponencia (HU Registro de autores y ponentes)
  const [modalPropuesta, setModalPropuesta] = useState(null);

  const auth = useAuth();
  const usuarioActual = usuarioProp || auth?.usuario;
  const isAdmin = esAdministrador(usuarioActual);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    const peticiones = [
      api.listarConvocatorias(isAdmin),
      isAdmin ? apiEventos.listarEventos().catch(() => []) : Promise.resolve([]),
    ];

    Promise.all(peticiones)
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

  // HU-11, Criterio 3: el backend responde 400 CONVOCATORIA_INCOMPLETA con los campos faltantes
  const mostrarConvocatoriaIncompleta = (convocatoria, data) => {
    const faltantes = listarCamposFaltantes(data);

    SwalReact.fire({
      icon: 'warning',
      title: 'Completa los datos para publicar',
      html: (
        <div className="text-left">
          <p className="text-sm text-[#5b5f66] mb-2">
            {data?.message || 'La convocatoria tiene datos obligatorios sin completar.'}
          </p>
          {faltantes.length > 0 && (
            <ul className="list-disc pl-5 text-[13px] text-[#1f2023] space-y-1">
              {faltantes.map((f) => (
                <li key={f.campo || f.mensaje}>
                  <strong>{f.etiqueta}:</strong> {f.mensaje}
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Completar datos',
      cancelButtonText: 'Ahora no',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
      customClass: {
        popup: 'rounded-[16px]',
        confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
      },
    }).then((result) => {
      if (result.isConfirmed) setModal({ tipo: 'editar', convocatoria });
    });
  };

  // HU-11, Criterio 1: publicar una convocatoria completa en borrador
  const publicar = (convocatoria) => {
    Swal.fire({
      title: '¿Publicar convocatoria?',
      text: `Al publicar «${convocatoria.titulo}», quedará visible en la página pública de convocatorias y abierta para que los autores envíen sus propuestas hasta el ${formatearFechaHora(convocatoria.fechaCierre)}.`,
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
            text: `La convocatoria «${publicada.titulo || convocatoria.titulo}» ya está activa y visible para los usuarios externos en la página pública de convocatorias.`,
          });
        } catch (err) {
          const data = err?.response?.data;
          if (data?.codigo === 'CONVOCATORIA_INCOMPLETA') {
            mostrarConvocatoriaIncompleta(convocatoria, data);
            return;
          }
          Swal.fire({
            icon: 'error',
            title: 'Error al publicar',
            text: mensajeErrorApi(err, 'No se pudo publicar la convocatoria.'),
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

  /**
   * Códigos con los que el backend rechaza el cambio porque la convocatoria ya no se puede modificar
   * (expiró o dejó de estar publicada mientras el modal estaba abierto). Reintentar no sirve: se cierra
   * el modal y se recarga la lista para mostrar el estado actual.
   */
  const CODIGOS_CONVOCATORIA_NO_MODIFICABLE = ['CONVOCATORIA_CERRADA', 'OPERACION_NO_PERMITIDA'];

  // HU-11, Criterio 2: modificar la fecha límite de una convocatoria publicada
  const modificarFechaCierre = async (nuevaFecha) => {
    let resultado;
    try {
      resultado = await api.actualizarFechaCierre(modal.convocatoria.id, nuevaFecha);
    } catch (err) {
      if (!CODIGOS_CONVOCATORIA_NO_MODIFICABLE.includes(err?.response?.data?.codigo)) {
        throw err; // Otros errores (p. ej. fecha inválida) se muestran dentro del modal para corregirlos.
      }
      cerrarModal();
      recargar();
      Swal.fire({
        icon: 'error',
        title: 'La convocatoria ya no se puede modificar',
        text: `${mensajeErrorApi(err, 'La convocatoria cambió de estado.')} La lista se actualizó con su estado actual.`,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
      return;
    }
    const titulo = resultado?.convocatoria?.titulo || modal.convocatoria.titulo;
    const nuevoCierre = resultado?.convocatoria?.fechaCierre || nuevaFecha;
    const notificados = Number(resultado?.usuariosNotificados) || 0;
    const convocatoriaId = resultado?.convocatoria?.id || modal.convocatoria.id;
    cerrarModal();
    recargar();
    Swal.fire({
      ...ALERTA_EXITO,
      title: 'Fecha límite actualizada',
      text: `La nueva fecha límite de «${titulo}» es el ${formatearFechaHora(nuevoCierre)}. Se notificó el cambio a ${notificados} ${
        notificados === 1 ? 'usuario' : 'usuarios'
      }.`,
      showDenyButton: true,
      denyButtonText: 'Ver en página pública',
      denyButtonColor: '#5b5f66',
      customClass: {
        ...ALERTA_EXITO.customClass,
        denyButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
      },
    }).then(({ isDenied }) => {
      if (isDenied) navigate(`/convocatorias-publicas?convocatoria=${convocatoriaId}`);
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

  // Criterio 4: Verificación de intento de envío de propuesta y apertura del formulario de propuesta
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

    // Abre el modal para registrar datos de autor/ponente y enviar la propuesta
    setModalPropuesta(convocatoria);
  };

  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'todos';

  return (
    <MainLayout
      title={isAdmin ? 'Gestión de convocatorias' : 'Convocatorias abiertas'}
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
              SIGEA — {isAdmin ? 'Gestión y recepción de propuestas' : 'Convocatorias vigentes para ponencias'}
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1 tracking-tight">
              {isAdmin ? 'Convocatorias académicas' : 'Convocatorias abiertas'}
            </h2>
            <p className="text-sm text-[#5b5f66] mt-1 max-w-2xl">
              {isAdmin
                ? 'Configura las fechas de apertura y cierre para la recepción de ponencias, pósters y artículos asociados a cada evento.'
                : 'Consulta las convocatorias activas para presentar ponencias. Haz clic en «Enviar propuesta» para registrar tus datos de autor y postularte.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* HU-11, Criterio 1: verificar lo que ven los usuarios externos */}
            <Link
              to="/convocatorias-publicas"
              className="h-11 px-4 rounded-[8px] border border-[#d8dadf] text-sm font-medium text-[#1f2023] hover:bg-[#f7f7f8] inline-flex items-center gap-2 transition-colors"
            >
              <Globe className="w-4 h-4 text-[#5b5f66]" />
              <span>Ver página pública</span>
            </Link>
            {isAdmin && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setModal({ tipo: 'crear', convocatoria: null })}
            >
              <Plus className="w-4 h-4" />
              <span>Crear convocatoria</span>
            </Button>
            )}
          </div>
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
          onModificarFechaCierre={(conv) => setModal({ tipo: 'fecha', convocatoria: conv })}
          onEliminar={eliminar}
          onIntentarEnviar={intentarEnviarPropuesta}
          isAdmin={isAdmin}
        />
      </div>

      {/* Modal Modificar fecha límite (HU-11, Criterio 2) */}
      {modal?.tipo === 'fecha' && (
        <FechaCierreModal
          key={`modal-fecha-${modal.convocatoria.id}`}
          convocatoria={modal.convocatoria}
          onClose={cerrarModal}
          onSubmit={modificarFechaCierre}
        />
      )}

      {/* Modal Crear / Editar Convocatoria */}
      {modal && modal.tipo !== 'fecha' && (
        <ConvocatoriaFormModal
          key={`modal-convocatoria-${modal.convocatoria?.id || 'nueva'}`}
          isOpen={Boolean(modal)}
          convocatoria={modal.convocatoria}
          eventosDisponibles={eventosDisponibles}
          onClose={cerrarModal}
          onSubmit={modal.tipo === 'crear' ? crear : editar}
        />
      )}

      {/* Modal Envío de Propuesta y Registro de Autores/Ponentes (HU-Propuestas) */}
      {modalPropuesta && (
        <PropuestaFormModal
          key={`modal-propuesta-${modalPropuesta.id}`}
          isOpen={Boolean(modalPropuesta)}
          convocatoria={modalPropuesta}
          onClose={() => setModalPropuesta(null)}
          onPropuestaEnviada={() => {
            recargar();
          }}
        />
      )}
    </MainLayout>
  );
}
