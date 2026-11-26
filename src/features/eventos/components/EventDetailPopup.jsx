import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Globe,
  Pencil,
  CalendarDays,
  Tag,
  MapPin,
  Hash,
  Tags,
  Users,
  Mic,
  Building,
  CalendarClock,
  ClipboardList,
  Award,
  Wallet,
  ShieldCheck,
  TrendingUp,
  History,
  CopyPlus,
  Archive,
  Trash2,
  ShieldAlert,
  Eye,
  CalendarCheck,
  Target,
  FileText,
  Layers,
} from 'lucide-react';
import EstadoEventoBadge from './EstadoEventoBadge';
import EventoArchivadoBadge from '../../memoria/components/EventoArchivadoBadge';
import { etiquetaModalidad, formatearRango } from '../eventoUtils';
import { inscripcionesAbiertas } from '../../inscripciones/inscripcionUtils';

/**
 * @file EventDetailPopup.jsx
 * @description Modal emergente de información completa y opciones para un evento seleccionado.
 * Cumple estrictamente con las reglas de color de COLOR_STYLES.md:
 * - Marco superior: brand-600 (#a6192e).
 * - Superficies: surface (#ffffff) y surface-muted (#f7f7f8).
 * - Bordes: border (#e5e7ea) y field-border (#d8dadf).
 * - Botones: primario brand-600, secundario surface con borde field-border, peligro en brand-100/brand-700.
 * @module features/eventos/components/EventDetailPopup
 */

/** Botón de acción interactivo dentro del popup. */
function BotonAccion({ icono: Icono, children, onClick, variant = 'default', disabled = false, motivo }) {
  const estilos = {
    primary: 'bg-brand-600 text-surface hover:bg-brand-700 border-transparent',
    default: 'bg-surface border-field-border text-ink-900 hover:bg-surface-muted',
    danger: 'bg-surface border-border text-brand-700 hover:bg-brand-100',
    disabled: 'bg-surface-muted border-border text-ink-300 cursor-not-allowed',
  };

  const clase = disabled ? estilos.disabled : estilos[variant] || estilos.default;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabled && motivo ? motivo : undefined}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${clase} ${
        disabled ? '' : 'cursor-pointer'
      }`}
    >
      {Icono && (
        <Icono
          className={`w-4 h-4 shrink-0 ${
            disabled ? 'text-ink-300' : variant === 'danger' ? 'text-brand-600' : 'text-ink-600'
          }`}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 text-left min-w-0">
        <span className="block leading-snug truncate">{children}</span>
        {disabled && motivo && (
          <span className="block text-xs font-normal text-ink-600 mt-0.5 leading-tight">{motivo}</span>
        )}
      </div>
    </button>
  );
}

/** Agrupación temática de acciones. */
function SeccionAcciones({ titulo, children }) {
  return (
    <div className="space-y-1.5 pt-3 first:pt-0">
      {titulo && (
        <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1">
          {titulo}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.evento - Evento seleccionado con toda su información.
 * @param {string} [props.nombreBase] - Nombre del evento base cuando es edición.
 * @param {number} [props.derivadas] - Cantidad de ediciones derivadas.
 * @param {boolean} [props.isAdmin] - Si el usuario actual es administrador.
 * @param {boolean} [props.puedeEliminarHistorico]
 * @param {function(): void} props.onClose
 * @param {function(Object): void} props.onPublicar
 * @param {function(string, Object): void} props.onAccion - (tipo, evento) => void
 */
export default function EventDetailPopup({
  isOpen,
  evento,
  nombreBase,
  derivadas = 0,
  isAdmin,
  puedeEliminarHistorico,
  onClose,
  onPublicar,
  onAccion,
}) {
  const cerrarBtnRef = useRef(null);

  // Foco inicial accesible
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cerrarBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Evitar scroll en el fondo mientras el modal esté visible
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !evento) return null;

  const editable = evento.estado === 'en_configuracion';
  const puedePublicar = editable && !evento.archivado;
  const puedeEditar = editable && !evento.archivado;

  const ejecutarAccion = (tipo) => () => {
    onClose();
    onAccion(tipo, evento);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle completo de ${evento.nombre}`}
    >
      {/* Fondo oscurecido con opacidad estándar permitida por el manual */}
      <div
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor principal del popup */}
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] bg-surface rounded-[16px] border border-border border-t-4 border-t-brand-600 shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del popup */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border bg-surface">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                {evento.tipo || 'Evento académico'}
              </span>
              <EstadoEventoBadge estado={evento.estado} />
              {evento.archivado && <EventoArchivadoBadge />}
            </div>
            <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
              {evento.nombre}
            </h2>
            {evento.esEdicion && nombreBase && (
              <p className="text-xs text-ink-600 flex items-center gap-1">
                <span className="font-medium text-brand-600">Edición derivada</span> de «{nombreBase}»
              </p>
            )}
          </div>
          <button
            ref={cerrarBtnRef}
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-600 hover:bg-surface-muted hover:text-ink-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 shrink-0 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Cuerpo del popup con la información completa */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ficha técnica resumida */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-muted border border-border rounded-[12px] p-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600 block mb-1">
                Fechas
              </span>
              <p className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-brand-600 shrink-0" aria-hidden="true" />
                <span>{formatearRango(evento.fechaInicio, evento.fechaFin)}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600 block mb-1">
                Modalidad
              </span>
              <p className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" aria-hidden="true" />
                <span>{etiquetaModalidad(evento.modalidad)}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600 block mb-1">
                Semestre
              </span>
              <p className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-ink-300 shrink-0" aria-hidden="true" />
                <span>{evento.semestre || 'No definido'}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600 block mb-1">
                Tipo
              </span>
              <p className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-ink-300 shrink-0" aria-hidden="true" />
                <span>{evento.tipo || 'General'}</span>
              </p>
            </div>
          </div>

          {/* Objetivo del evento */}
          {evento.objetivo ? (
            <div className="bg-surface border border-border rounded-[12px] p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4" aria-hidden="true" />
                Objetivo del evento
              </h4>
              <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-line">
                {evento.objetivo}
              </p>
            </div>
          ) : (
            <div className="bg-surface-muted border border-border rounded-[12px] p-3 text-xs text-ink-600 italic">
              Sin objetivo específico registrado.
            </div>
          )}

          {/* Descripción general */}
          {evento.descripcion && (
            <div className="bg-surface border border-border rounded-[12px] p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-600" aria-hidden="true" />
                Descripción general
              </h4>
              <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">
                {evento.descripcion}
              </p>
            </div>
          )}

          {/* Información de ediciones si aplica */}
          {!evento.esEdicion && derivadas > 0 && (
            <div className="bg-surface-muted border border-border rounded-[12px] p-3 flex items-center justify-between text-xs text-ink-600">
              <span className="flex items-center gap-1.5 font-medium text-ink-900">
                <Layers className="w-4 h-4 text-brand-600" aria-hidden="true" />
                Evento base con {derivadas} {derivadas === 1 ? 'edición creada' : 'ediciones creadas'}
              </span>
              <button
                type="button"
                onClick={ejecutarAccion('historial')}
                className="text-brand-600 hover:text-brand-700 font-semibold cursor-pointer underline"
              >
                Ver historial de ediciones →
              </button>
            </div>
          )}

          {/* ——— PANEL DE ACCIONES Y GESTIÓN ——— */}
          <div className="border-t border-border pt-4 space-y-4">
            <h4 className="font-serif-title text-base font-semibold text-ink-900">
              Acciones y opciones disponibles
            </h4>

            {/* Acciones directas para Administrador */}
            {isAdmin && puedePublicar && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPublicar(evento);
                  }}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand-600 text-surface text-sm font-medium hover:bg-brand-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer shadow-xs"
                >
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  Publicar evento
                </button>
                {puedeEditar && (
                  <button
                    type="button"
                    onClick={ejecutarAccion('editar')}
                    className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-[8px] bg-surface border border-field-border text-ink-900 text-sm font-medium hover:bg-surface-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-ink-600" aria-hidden="true" />
                    Editar evento
                  </button>
                )}
              </div>
            )}

            {/* Acción para Participantes */}
            {!isAdmin && (
              <button
                type="button"
                onClick={ejecutarAccion('inscripcion')}
                className={`w-full h-11 inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer ${
                  inscripcionesAbiertas(evento)
                    ? 'bg-brand-600 text-surface hover:bg-brand-700 shadow-xs'
                    : 'bg-surface border border-field-border text-ink-900 hover:bg-surface-muted'
                }`}
              >
                <CalendarCheck className="w-4 h-4" aria-hidden="true" />
                {inscripcionesAbiertas(evento) ? 'Inscribirme al evento' : 'Ver información de inscripción'}
              </button>
            )}

            {/* Secciones agrupadas de gestión (anteriormente desplegable Más) */}
            {isAdmin && (
              <div className="space-y-4 divide-y divide-border pt-1">
                {evento.archivado ? (
                  <>
                    <SeccionAcciones titulo="Memoria histórica">
                      <BotonAccion icono={Eye} onClick={ejecutarAccion('memoria')}>
                        Ver memoria histórica
                      </BotonAccion>
                      <BotonAccion icono={Award} onClick={ejecutarAccion('certificados')}>
                        Certificados emitidos
                      </BotonAccion>
                    </SeccionAcciones>

                    <SeccionAcciones titulo="Ediciones">
                      <BotonAccion icono={History} onClick={ejecutarAccion('historial')}>
                        Historial de ediciones
                      </BotonAccion>
                      <BotonAccion icono={CopyPlus} onClick={ejecutarAccion('edicion')}>
                        Crear nueva edición
                      </BotonAccion>
                    </SeccionAcciones>

                    <SeccionAcciones titulo="Zona de eliminación">
                      <BotonAccion
                        icono={ShieldAlert}
                        variant={puedeEliminarHistorico ? 'danger' : 'disabled'}
                        disabled={!puedeEliminarHistorico}
                        motivo="Requiere la autorización especial MEMORIA_HISTORICA_ELIMINAR."
                        onClick={ejecutarAccion('eliminarHistorico')}
                      >
                        Eliminar con autorización especial
                      </BotonAccion>
                    </SeccionAcciones>
                  </>
                ) : (
                  <>
                    <SeccionAcciones titulo="Configuración del evento">
                      {(evento.estado === 'habilitado' || evento.estado === 'en_ejecucion') && (
                        <BotonAccion icono={CalendarDays} onClick={ejecutarAccion('fechas')}>
                          Modificar fechas
                        </BotonAccion>
                      )}
                      <BotonAccion icono={Tags} onClick={ejecutarAccion('parametros')}>
                        Tipos y líneas temáticas
                      </BotonAccion>
                      <BotonAccion icono={Users} onClick={ejecutarAccion('comite')}>
                        Comité organizador
                      </BotonAccion>
                      <BotonAccion icono={Mic} onClick={ejecutarAccion('conferencistas')}>
                        Conferencistas
                      </BotonAccion>
                      <BotonAccion icono={Building} onClick={ejecutarAccion('salas')}>
                        Salas y espacios
                      </BotonAccion>
                      <BotonAccion icono={CalendarClock} onClick={ejecutarAccion('agenda')}>
                        Agenda y actividades
                      </BotonAccion>
                    </SeccionAcciones>

                    <SeccionAcciones titulo="Participantes y Certificación">
                      <BotonAccion icono={ClipboardList} onClick={ejecutarAccion('encuestas')}>
                        Encuestas de satisfacción
                      </BotonAccion>
                      <BotonAccion icono={Award} onClick={ejecutarAccion('certificados')}>
                        Gestión de certificados
                      </BotonAccion>
                    </SeccionAcciones>

                    <SeccionAcciones titulo="Gestión Presupuestal">
                      <BotonAccion icono={Wallet} onClick={ejecutarAccion('presupuesto')}>
                        Presupuesto preliminar
                      </BotonAccion>
                      <BotonAccion icono={ShieldCheck} onClick={ejecutarAccion('presupuestoAprobado')}>
                        Presupuesto aprobado
                      </BotonAccion>
                      <BotonAccion icono={TrendingUp} onClick={ejecutarAccion('ejecucion')}>
                        Gastos y ejecución
                      </BotonAccion>
                    </SeccionAcciones>

                    <SeccionAcciones titulo="Ediciones">
                      <BotonAccion icono={History} onClick={ejecutarAccion('historial')}>
                        Historial de ediciones
                      </BotonAccion>
                      <BotonAccion icono={CopyPlus} onClick={ejecutarAccion('edicion')}>
                        Crear nueva edición
                      </BotonAccion>
                    </SeccionAcciones>

                    <SeccionAcciones titulo="Memoria y Cierre">
                      <BotonAccion
                        icono={Archive}
                        disabled={!puedeCerrarFormalmente(evento)}
                        motivo="Disponible una vez concluido el último día del evento."
                        onClick={ejecutarAccion('cierre')}
                      >
                        Cierre formal del evento
                      </BotonAccion>
                    </SeccionAcciones>

                    <SeccionAcciones titulo="Zona de eliminación">
                      <BotonAccion
                        icono={Trash2}
                        variant={editable ? 'danger' : 'disabled'}
                        disabled={!editable}
                        motivo="Solo se puede eliminar mientras el evento esté en configuración."
                        onClick={ejecutarAccion('eliminar')}
                      >
                        Eliminar evento
                      </BotonAccion>
                    </SeccionAcciones>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Verifica si un evento puede cerrarse formalmente. */
function puedeCerrarFormalmente(evento) {
  if (!evento?.fechaFin) return false;
  if (!['cerrado', 'en_ejecucion'].includes(evento.estado)) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  return evento.fechaFin <= hoy;
}
