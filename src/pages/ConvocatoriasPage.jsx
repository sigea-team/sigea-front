import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  Send,
  Lock,
  RotateCw,
  Info,
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { convocatoriaService } from '../api/convocatoriaService';
import EstadoConvocatoriaBadge from '../features/convocatorias/components/EstadoConvocatoriaBadge';
import ConvocatoriaFormModal from '../features/convocatorias/components/ConvocatoriaFormModal';
import {
  esBorradorEditable,
  formatearFechaHora,
  puedeEnviarPropuesta,
} from '../features/convocatorias/convocatoriaUtils';

const OPCIONES_FILTRO_ESTADO = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'ABIERTA', label: 'Abierta' },
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

function BotonAccion({ icono: Icono, etiqueta, onClick, disabled, motivo, peligro = false }) {
  const titulo = disabled && motivo ? motivo : etiqueta;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      aria-label={titulo}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-[8px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] ${
        disabled
          ? 'border-[#e5e7ea] text-[#9ca0a6] cursor-not-allowed bg-white/50'
          : peligro
          ? 'border-[#a6192e]/20 text-[#a6192e] bg-[#fdecec]/50 hover:bg-[#fdecec] cursor-pointer'
          : 'border-[#d8dadf] text-[#5b5f66] bg-white hover:bg-[#f7f7f8] hover:text-[#1f2023] cursor-pointer'
      }`}
    >
      <Icono className="w-4 h-4" />
    </button>
  );
}

export default function ConvocatoriasPage({ api = convocatoriaService, usuarioProp, onSelectNav }) {
  const [convocatorias, setConvocatorias] = useState([]);
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
    api
      .listarConvocatorias()
      .then((data) => {
        if (!activo) return;
        setConvocatorias(Array.isArray(data) ? data : []);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(err.message || 'Error al cargar las convocatorias.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [api, version]);

  const recargar = () => setVersion((v) => v + 1);
  const cerrarModal = () => setModal(null);

  const convocatoriasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return convocatorias.filter((c) => {
      if (filtroEstado !== 'todos' && c.estado !== filtroEstado) return false;
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

        {/* Alerta de Error de carga si la hubiere */}
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

        {/* Tabla de Convocatorias */}
        <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-5">Convocatoria / Evento</th>
                  <th scope="col" className="py-3.5 px-5">Periodo de recepción</th>
                  <th scope="col" className="py-3.5 px-5">Estado</th>
                  <th scope="col" className="py-3.5 px-5">Envío de propuesta</th>
                  <th scope="col" className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
                {cargando && convocatorias.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 px-5 text-center text-[#5b5f66]" role="status">
                      Cargando convocatorias...
                    </td>
                  </tr>
                )}

                {!cargando && !errorCarga && convocatoriasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 px-5 text-center">
                      <p className="font-semibold text-base text-[#1f2023]">
                        {busqueda || filtroEstado !== 'todos'
                          ? 'Ninguna convocatoria coincide con los criterios de búsqueda'
                          : 'Todavía no hay convocatorias registradas'}
                      </p>
                      <p className="text-xs mt-1 text-[#5b5f66]">
                        {busqueda || filtroEstado !== 'todos'
                          ? 'Prueba con otros términos de búsqueda.'
                          : 'Usa «Crear convocatoria» para configurar la primera.'}
                      </p>
                    </td>
                  </tr>
                )}

                {convocatoriasFiltradas.map((convocatoria) => {
                  const editable = esBorradorEditable(convocatoria);
                  const validacionEnvio = puedeEnviarPropuesta(convocatoria);

                  return (
                    <tr key={convocatoria.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                      {/* Convocatoria / Evento */}
                      <td className="py-4 px-5 align-middle max-w-sm">
                        <p className="font-semibold text-[#1f2023] leading-snug">{convocatoria.titulo}</p>
                        <p className="text-xs text-[#a6192e] font-medium mt-1">
                          {convocatoria.eventoNombre}
                        </p>
                        <p className="text-xs text-[#5b5f66] mt-1 line-clamp-2">
                          {convocatoria.descripcion}
                        </p>
                      </td>

                      {/* Periodo de recepción */}
                      <td className="py-4 px-5 align-middle whitespace-nowrap text-xs text-[#1f2023]">
                        <div className="space-y-1">
                          <p>
                            <span className="text-[#5b5f66]">Apertura:</span>{' '}
                            <strong>{formatearFechaHora(convocatoria.fechaApertura)}</strong>
                          </p>
                          <p>
                            <span className="text-[#5b5f66]">Cierre:</span>{' '}
                            <strong>{formatearFechaHora(convocatoria.fechaCierre)}</strong>
                          </p>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <EstadoConvocatoriaBadge
                          estado={convocatoria.estado}
                          fechaCierre={convocatoria.fechaCierre}
                        />
                      </td>

                      {/* Simulación de Envío para Autor (Criterio 4) */}
                      <td className="py-4 px-5 align-middle whitespace-nowrap">
                        <Button
                          type="button"
                          variant={validacionEnvio.permitido ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => intentarEnviarPropuesta(convocatoria)}
                          disabled={!validacionEnvio.permitido}
                          title={validacionEnvio.motivo || 'Enviar propuesta'}
                          className="text-xs"
                        >
                          {validacionEnvio.permitido ? (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar propuesta</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-[#a6192e]" />
                              <span>Recepción cerrada</span>
                            </>
                          )}
                        </Button>
                      </td>

                      {/* Acciones de administración */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {/* Criterio 3: Editar en borrador */}
                          <BotonAccion
                            icono={Pencil}
                            etiqueta="Editar convocatoria"
                            onClick={() => setModal({ tipo: 'editar', convocatoria })}
                            disabled={!editable}
                            motivo="Solo se pueden editar convocatorias en estado borrador."
                          />

                          {/* Eliminar borrador */}
                          <BotonAccion
                            icono={Trash2}
                            etiqueta="Eliminar convocatoria"
                            onClick={() => eliminar(convocatoria)}
                            disabled={!editable}
                            motivo="Solo se pueden eliminar convocatorias en estado borrador."
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

      {/* Modal Crear / Editar */}
      {modal && (
        <ConvocatoriaFormModal
          key={`modal-convocatoria-${modal.convocatoria?.id || 'nueva'}`}
          isOpen={Boolean(modal)}
          convocatoria={modal.convocatoria}
          onClose={cerrarModal}
          onSubmit={modal.tipo === 'crear' ? crear : editar}
        />
      )}
    </MainLayout>
  );
}
