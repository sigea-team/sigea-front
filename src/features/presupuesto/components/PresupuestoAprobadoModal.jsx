import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ArrowRight,
  ExternalLink,
  FileCheck,
  Lock,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import EstadoEventoBadge from '../../eventos/components/EstadoEventoBadge';
import { extraerError } from '../../eventos/eventoUtils';
import { presupuestoAprobadoService } from '../../../api/presupuestoAprobadoService';
import { formatearFechaHora, formatearPesos } from '../presupuestoUtils';
import { compararConPreliminar } from '../presupuestoAprobadoUtils';
import PresupuestoAprobadoForm from './PresupuestoAprobadoForm';
import HistorialPresupuestoAprobado from './HistorialPresupuestoAprobado';

/**
 * @file PresupuestoAprobadoModal.jsx
 * @description Modal principal para la gestión del Presupuesto Aprobado formalmente (HU-08: RF07).
 * - Criterio 1: Dado que existe presupuesto preliminar, registra el presupuesto aprobado (puede diferir)
 *   junto con su evidencia documental como versión oficial vinculada al evento.
 * - Criterio 2: Dado que ya existe un presupuesto aprobado, al actualizar conserva la versión anterior
 *   y guarda la nueva, con historial de cambios completo.
 * - Criterio 3: Exige soporte / evidencia documental obligatoria antes de confirmar el registro.
 * @module features/presupuesto/components/PresupuestoAprobadoModal
 */

const PESTANAS = [
  { clave: 'oficial', titulo: 'Presupuesto oficial' },
  { clave: 'historial', titulo: 'Historial de versiones' },
];

const ALERTA_EXITO = {
  icon: 'success',
  confirmButtonText: 'Entendido',
  confirmButtonColor: '#a6192e',
  customClass: { popup: 'rounded-[16px]', confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm' },
};

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - { id, nombre, semestre, estado }
 * @param {typeof presupuestoAprobadoService} [props.api] - Cliente de la API (simulado en Storybook)
 * @param {'oficial'|'historial'} [props.pestanaInicial='oficial']
 * @param {function(): void} props.onClose
 * @param {function(): void} [props.onAbrirPreliminar] - Para navegar al preliminar si no existe
 * @param {function(): void} [props.onPresupuestoActualizado] - Notifica al padre (ej. EventosPage)
 */
export default function PresupuestoAprobadoModal({
  isOpen,
  evento,
  api = presupuestoAprobadoService,
  pestanaInicial = 'oficial',
  onClose,
  onAbrirPreliminar,
  onPresupuestoActualizado,
}) {
  const [pestana, setPestana] = useState(pestanaInicial);
  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [version, setVersion] = useState(0);

  const eventoId = evento?.id;

  // Cargar estado de presupuesto aprobado y preliminar
  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    api
      .consultarPresupuestoAprobado(eventoId)
      .then((data) => {
        if (!activo) return;
        setDatos(data);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(extraerError(err).mensaje);
      });

    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, version, api]);

  const cargando = !datos && !errorCarga;

  if (!isOpen || !evento) return null;

  const recargar = () => {
    setDatos(null);
    setErrorCarga(null);
    setVersion((v) => v + 1);
  };

  const aprobadoVigente = datos?.aprobadoVigente;
  const tienePreliminar = Boolean(datos?.tienePreliminar && datos?.totalPreliminar > 0);
  const totalPreliminar = datos?.totalPreliminar ?? 0;
  const versiones = datos?.versiones || [];
  const editable = Boolean(datos?.editable);

  // Registro por primera vez (Criterio 1)
  const handleRegistrar = async (payload) => {
    await api.registrarPresupuestoAprobado(evento.id, payload);
    setModoEdicion(false);
    recargar();
    if (onPresupuestoActualizado) onPresupuestoActualizado();
    Swal.fire({
      ...ALERTA_EXITO,
      title: '¡Presupuesto aprobado registrado!',
      text: `Se guardó la versión oficial por ${formatearPesos(payload.valorTotalAprobado)} con su evidencia documental.`,
    });
  };

  // Actualización de versión (Criterio 2)
  const handleActualizar = async (payload) => {
    await api.actualizarPresupuestoAprobado(evento.id, payload);
    setModoEdicion(false);
    recargar();
    if (onPresupuestoActualizado) onPresupuestoActualizado();
    Swal.fire({
      ...ALERTA_EXITO,
      title: '¡Nueva versión registrada!',
      text: `Se actualizó el monto oficial a ${formatearPesos(payload.valorTotalAprobado)}. La versión anterior fue archivada en el historial.`,
    });
  };

  // Comparación de versión vigente contra el preliminar
  const comparativa = aprobadoVigente
    ? compararConPreliminar(aprobadoVigente.valorTotalAprobado, totalPreliminar)
    : null;

  return (
    <ModalShell
      titulo="Presupuesto aprobado formalmente"
      subtitulo={evento.semestre ? `${evento.nombre} (${evento.semestre})` : evento.nombre}
      icono={ShieldCheck}
      onClose={onClose}
      ancho="max-w-4xl"
      tituloId="presupuesto-aprobado-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Banner de estado del evento y badge institucional */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-[12px] border border-[#e5e7ea] bg-white flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <EstadoEventoBadge estado={evento.estado} />
              {aprobadoVigente ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f3ec] text-[#1e6b3a] border border-[#1e6b3a]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Presupuesto oficial vigente (v{aprobadoVigente.version})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fdecec] text-[#a6192e] border border-[#a6192e]/20">
                  Pendiente de aprobación formal
                </span>
              )}
            </div>
            <p className="text-xs text-[#5b5f66]">
              {aprobadoVigente
                ? `Aprobado ${aprobadoVigente.aprobadoPorNombre ? `por ${aprobadoVigente.aprobadoPorNombre}` : aprobadoVigente.aprobadoPor?.nombreCompleto ? `por ${aprobadoVigente.aprobadoPor.nombreCompleto}` : ''} el ${formatearFechaHora(aprobadoVigente.fechaAprobacion)}`
                : 'Monto oficial que regirá la ejecución financiera del evento'}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">Monto oficial autorizado</p>
            <p className="font-serif-title text-2xl sm:text-3xl text-[#a6192e] tabular-nums leading-tight">
              {aprobadoVigente ? formatearPesos(aprobadoVigente.valorTotalAprobado) : '—'}
            </p>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div
          role="tablist"
          aria-label="Presupuesto aprobado"
          className="flex gap-6 border-b border-[#e5e7ea]"
        >
          {PESTANAS.map((p) => {
            const activa = p.clave === pestana;
            return (
              <button
                key={p.clave}
                id={`aprobado-pestana-${p.clave}`}
                type="button"
                role="tab"
                aria-selected={activa}
                aria-controls={`aprobado-panel-${p.clave}`}
                onClick={() => {
                  setPestana(p.clave);
                  setModoEdicion(false);
                }}
                className={`-mb-px pb-3 pt-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] rounded-t-[4px] ${
                  activa
                    ? 'border-[#a6192e] text-[#a6192e]'
                    : 'border-transparent text-[#5b5f66] hover:text-[#1f2023]'
                }`}
              >
                {p.titulo}
                {p.clave === 'historial' && versiones.length > 0 && (
                  <span className="ml-2 text-xs py-0.5 px-2 rounded-full bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]">
                    {versiones.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel de Contenido */}
        <div id={`aprobado-panel-${pestana}`} role="tabpanel" aria-labelledby={`aprobado-pestana-${pestana}`}>
          {cargando && (
            <p className="text-sm text-[#5b5f66] py-12 text-center" role="status">
              Cargando información del presupuesto aprobado...
            </p>
          )}

          {!cargando && errorCarga && (
            <div className="py-10 text-center">
              <p className="font-semibold text-[#1f2023]">No se pudo cargar la información</p>
              <p className="text-sm text-[#5b5f66] mt-1">{errorCarga}</p>
              <button
                type="button"
                onClick={recargar}
                className="text-xs mt-2 text-[#a6192e] font-semibold underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargando && !errorCarga && pestana === 'oficial' && (
            <div className="space-y-6">
              {/* Criterio 1: Validación de que existe presupuesto preliminar */}
              {!tienePreliminar ? (
                <div className="p-6 rounded-[16px] border border-[#a6192e]/20 bg-[#fdecec] text-[#7a0c1e] space-y-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-base">Se requiere un presupuesto preliminar registrado</h4>
                      <p className="text-sm mt-1 leading-relaxed text-[#7a0c1e]/90">
                        Para poder registrar formalmente el presupuesto aprobado (Criterio 1), el evento debe contar
                        previamente con un presupuesto preliminar estimado.
                      </p>
                    </div>
                  </div>
                  {onAbrirPreliminar && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={onAbrirPreliminar}
                        className="text-xs"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Ir al presupuesto preliminar</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : !aprobadoVigente || modoEdicion ? (
                /* Formulario de registro (Criterio 1) o actualización (Criterio 2) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e5e7ea]">
                    <h3 className="text-sm font-semibold text-[#1f2023]">
                      {modoEdicion
                        ? `Actualizar presupuesto oficial (Crear versión ${aprobadoVigente.version + 1})`
                        : 'Registrar presupuesto aprobado formalmente'}
                    </h3>
                    {modoEdicion && (
                      <button
                        type="button"
                        onClick={() => setModoEdicion(false)}
                        className="text-xs text-[#5b5f66] hover:text-[#1f2023] underline cursor-pointer"
                      >
                        Cancelar edición y volver a la versión vigente
                      </button>
                    )}
                  </div>

                  <PresupuestoAprobadoForm
                    totalPreliminar={totalPreliminar}
                    aprobadoVigente={modoEdicion ? aprobadoVigente : null}
                    esActualizacion={modoEdicion}
                    onSubmit={modoEdicion ? handleActualizar : handleRegistrar}
                    onCancelar={modoEdicion ? () => setModoEdicion(false) : undefined}
                    deshabilitado={!editable}
                  />
                </div>
              ) : (
                /* Vista de Detalle de la Versión Oficial Vigente (Criterio 1 y Criterio 2) */
                <div className="space-y-5">
                  <div className="p-6 rounded-[16px] border border-[#e5e7ea] bg-white space-y-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap border-b border-[#e5e7ea] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-[#1f2023]">
                            Versión oficial vigente {aprobadoVigente.version ? `(v${aprobadoVigente.version})` : ''}
                          </h3>
                          {aprobadoVigente.resolucionOActa && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-[6px] bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]">
                              {aprobadoVigente.resolucionOActa}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5b5f66] mt-1">
                          Registrado el {formatearFechaHora(aprobadoVigente.fechaAprobacion)}
                          {(aprobadoVigente.aprobadoPorNombre || aprobadoVigente.aprobadoPor?.nombreCompleto) &&
                            ` por ${aprobadoVigente.aprobadoPorNombre || aprobadoVigente.aprobadoPor?.nombreCompleto}`}
                        </p>
                      </div>

                      {editable ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setModoEdicion(true)}
                          className="shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Actualizar presupuesto</span>
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-[#5b5f66]">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Solo lectura (evento {evento.estado})</span>
                        </div>
                      )}
                    </div>

                    {/* Comparativa con preliminar (Criterio 1) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">
                          Monto oficial aprobado
                        </span>
                        <p className="font-serif-title text-2xl text-[#a6192e] tabular-nums mt-1">
                          {formatearPesos(aprobadoVigente.valorTotalAprobado)}
                        </p>
                        {comparativa && (
                          <p className="text-xs font-medium text-[#5b5f66] mt-1.5 flex items-center gap-1">
                            <ArrowRight className="w-3.5 h-3.5" />
                            {comparativa.etiqueta}
                          </p>
                        )}
                      </div>

                      <div className="p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">
                          Presupuesto preliminar base
                        </span>
                        <p className="font-serif-title text-2xl text-[#1f2023] tabular-nums mt-1">
                          {formatearPesos(totalPreliminar)}
                        </p>
                        <p className="text-xs text-[#5b5f66] mt-1.5">
                          Estimación previa antes de la aprobación formal
                        </p>
                      </div>
                    </div>

                    {/* Soporte Documental (Criterio 1 & Criterio 3) */}
                    <div className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8] flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[8px] bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#5b5f66]">
                            Evidencia documental oficial
                          </p>
                          <p className="text-sm font-semibold text-[#1f2023] truncate max-w-md">
                            {aprobadoVigente.evidenciaUrl || 'Soporte documental registrado'}
                          </p>
                        </div>
                      </div>

                      {aprobadoVigente.evidenciaUrl && (
                        <a
                          href={aprobadoVigente.evidenciaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#d8dadf] bg-white text-xs font-semibold text-[#1f2023] hover:bg-[#f7f7f8] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#a6192e]" />
                          <span>Consultar soporte</span>
                        </a>
                      )}
                    </div>

                    {/* Observaciones o justificación */}
                    {aprobadoVigente.justificacion && (
                      <div className="text-sm p-4 rounded-[12px] bg-white border border-[#e5e7ea]">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#5b5f66] mb-1">
                          Justificación / Observaciones
                        </p>
                        <p className="text-[#1f2023] leading-relaxed">{aprobadoVigente.justificacion}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pestaña de Historial de Cambios (Criterio 2) */}
          {!cargando && !errorCarga && pestana === 'historial' && (
            <HistorialPresupuestoAprobado
              versiones={versiones}
              editable={editable}
              onNuevaActualizacion={() => {
                setPestana('oficial');
                setModoEdicion(true);
              }}
            />
          )}
        </div>
      </div>
    </ModalShell>
  );
}
