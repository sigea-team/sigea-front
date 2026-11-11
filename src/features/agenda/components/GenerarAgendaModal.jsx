import { useState } from 'react';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  Building,
  CalendarCheck,
  Clock,
  Hand,
  Hourglass,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  User,
  Wand2,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import ActividadPorProgramarModal from './ActividadPorProgramarModal';
import { agendaService } from '../../../api/agendaService';
import { actividadService } from '../../../api/actividadService';
import { extraerError } from '../../eventos/eventoUtils';
import { MODALIDADES_ACTIVIDAD, formatearHora } from '../agendaUtils';
import {
  SUGERENCIA_POR_MOTIVO,
  agruparPorDia,
  etiquetaMotivo,
  formatearDuracion,
  resumenGeneracion,
} from '../agendaPublicacionUtils';

/**
 * @file GenerarAgendaModal.jsx
 * @description Generación automática de la agenda (HU-22, Criterios 1 y 2).
 * 1. Lista las actividades por programar (se agregan, modifican o eliminan aquí).
 * 2. «Calcular propuesta» pide al backend una distribución sin cruces de horario, sala ni ponente, sin guardar nada.
 * 3. «Guardar propuesta» la aplica: las actividades ubicadas pasan a la agenda, marcadas como automáticas, y se
 *    pueden ajustar a mano antes de publicar.
 * 4. Las que no se pudieron ubicar se muestran con el motivo y la opción de asignarlas a mano (Criterio 2).
 * @module features/agenda/components/GenerarAgendaModal
 */

const SWAL_CLASES = {
  popup: 'rounded-[16px]',
  confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
};

/**
 * @param {Object} props
 * @param {Object} props.evento - Evento cuya agenda se genera.
 * @param {Array<Object>} props.porProgramar - Actividades sin horario (de `separarActividades`).
 * @param {number} [props.automaticas] - Cuántas actividades programadas puso una generación anterior.
 * @param {Array<Object>} [props.tiposActividad]
 * @param {Array<Object>} [props.ponentes]
 * @param {Array<Object>} [props.propuestas] - Propuestas con versión definitiva (HU-19).
 * @param {Object} [props.api] - Cliente de HU-22 (inyectable para Storybook).
 * @param {Object} [props.apiActividades] - Cliente de HU-21 (para eliminar).
 * @param {() => void} props.onCambios - Se llama tras guardar algo, para que la pantalla recargue la agenda.
 * @param {(actividad: Object) => void} [props.onAsignarManual] - Abre el formulario de HU-21 con la actividad.
 * @param {() => void} props.onClose
 */
export default function GenerarAgendaModal({
  evento,
  porProgramar = [],
  automaticas = 0,
  tiposActividad = [],
  ponentes = [],
  propuestas = [],
  api = agendaService,
  apiActividades = actividadService,
  onCambios,
  onAsignarManual,
  onClose,
}) {
  const [reubicar, setReubicar] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [formulario, setFormulario] = useState(null); // null | { actividad: Object|null }

  const eventoId = evento?.id;
  const ocupado = calculando || guardando;
  const totalPorUbicar = porProgramar.length + (reubicar ? automaticas : 0);

  const invalidarPropuesta = () => setResultado(null);

  const calcular = async () => {
    setCalculando(true);
    setError('');
    try {
      setResultado(await api.proponer(eventoId, { reubicarAutomaticas: reubicar }));
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setCalculando(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      const r = await api.aplicar(eventoId, { reubicarAutomaticas: reubicar });
      setResultado(r);
      onCambios?.();
      Swal.fire({
        icon: r.pendientes?.length ? 'info' : 'success',
        title: 'Propuesta guardada en la agenda',
        text: `${resumenGeneracion(r)} Revisa y ajusta las actividades antes de publicar la agenda.`,
        confirmButtonColor: '#a6192e',
        customClass: SWAL_CLASES,
      });
    } catch (err) {
      setError(extraerError(err).mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const guardarActividad = async (datos) => {
    if (formulario?.actividad?.id) {
      await api.actualizarPorProgramar(eventoId, formulario.actividad.id, datos);
    } else {
      await api.registrarPorProgramar(eventoId, datos);
    }
    invalidarPropuesta();
    onCambios?.();
  };

  const eliminar = async (act) => {
    const r = await Swal.fire({
      title: '¿Eliminar actividad?',
      text: `Se eliminará «${act.nombre}», que todavía no tiene horario.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
      customClass: SWAL_CLASES,
    });
    if (!r.isConfirmed) return;
    try {
      await apiActividades.eliminarActividad(eventoId, act.id);
      invalidarPropuesta();
      onCambios?.();
    } catch (err) {
      setError(extraerError(err).mensaje);
    }
  };

  const propuestaPorDia = agruparPorDia(resultado?.asignadas || []);
  const pendientes = resultado?.pendientes || [];
  const aplicada = Boolean(resultado?.aplicada);

  return (
    <>
      <ModalShell
        titulo="Generar agenda automáticamente"
        subtitulo={`${evento?.nombre || 'Evento'} · ubica las actividades sin cruces de horario, sala ni ponente (HU-22)`}
        icono={Wand2}
        onClose={onClose}
        ancho="max-w-4xl"
        tituloId="generar-agenda-titulo"
        pie={
          <>
            <Button type="button" variant="outline" onClick={onClose} disabled={ocupado}>
              {aplicada ? 'Cerrar y revisar la agenda' : 'Cerrar'}
            </Button>
            {!aplicada && (
              <Button
                type="button"
                variant="primary"
                onClick={guardar}
                disabled={ocupado || !resultado || resultado.asignadas.length === 0}
                title={!resultado ? 'Primero calcula la propuesta' : undefined}
              >
                <CalendarCheck className="w-4 h-4" />
                {guardando ? 'Guardando...' : 'Guardar propuesta en la agenda'}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <p role="alert" className="p-3 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#a6192e]" />
              {error}
            </p>
          )}

          {/* 1. Actividades por programar */}
          <section className="space-y-3" aria-labelledby="por-programar-lista">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 id="por-programar-lista" className="text-sm font-bold text-[#1f2023] flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-[#a6192e]" />
                  Actividades por programar ({porProgramar.length})
                </h3>
                <p className="text-xs text-[#5b5f66] mt-0.5">
                  Registradas con su duración, sin fecha, horario ni sala.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setFormulario({ actividad: null })} disabled={ocupado}>
                <Plus className="w-4 h-4" />
                Agregar actividad
              </Button>
            </div>

            {porProgramar.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#5b5f66] rounded-[16px] border border-dashed border-[#d8dadf]">
                No hay actividades por programar. Agrégalas aquí con su duración y luego calcula la propuesta.
              </p>
            ) : (
              <ul className="divide-y divide-[#e5e7ea] rounded-[16px] border border-[#e5e7ea] bg-white">
                {porProgramar.map((act) => (
                  <li key={act.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1f2023] truncate">{act.nombre}</p>
                      <p className="text-xs text-[#5b5f66] flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatearDuracion(act.duracionMinutos)}
                        </span>
                        {act.tipoActividadNombre && <span>{act.tipoActividadNombre}</span>}
                        <span>
                          {MODALIDADES_ACTIVIDAD.find((m) => m.value === act.modalidad)?.label || 'Cualquier sala'}
                        </span>
                        {act.ponenteNombre && (
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {act.ponenteNombre}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onAsignarManual && (
                        <button
                          type="button"
                          onClick={() => onAsignarManual(act)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#f2f4f7] rounded-[8px] cursor-pointer"
                          title="Asignarle fecha, horario y sala a mano"
                        >
                          <Hand className="w-3.5 h-3.5" />
                          Asignar a mano
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormulario({ actividad: act })}
                        className="p-1.5 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#f2f4f7] rounded-[8px] cursor-pointer"
                        aria-label={`Modificar «${act.nombre}»`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(act)}
                        className="p-1.5 text-[#a6192e] hover:bg-[#fdecec] rounded-[8px] cursor-pointer"
                        aria-label={`Eliminar «${act.nombre}»`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 2. Calcular */}
          {!aplicada && (
            <section className="p-4 rounded-[16px] bg-[#f7f7f8] border border-[#e5e7ea] flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-start gap-3 text-sm cursor-pointer max-w-xl">
                <input
                  type="checkbox"
                  checked={reubicar}
                  onChange={(e) => {
                    setReubicar(e.target.checked);
                    invalidarPropuesta();
                  }}
                  disabled={automaticas === 0 || ocupado}
                  className="mt-0.5 accent-[#a6192e]"
                />
                <span>
                  <span className="font-medium text-[#1f2023]">
                    Volver a ubicar las {automaticas} actividades que puso una generación anterior
                  </span>
                  <span className="block text-xs text-[#5b5f66] mt-0.5">
                    Las que programaste o ajustaste a mano no se mueven.
                  </span>
                </span>
              </label>
              <Button type="button" variant="primary" onClick={calcular} disabled={ocupado || totalPorUbicar === 0}>
                {calculando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {calculando ? 'Calculando...' : resultado ? 'Volver a calcular' : 'Calcular propuesta'}
              </Button>
            </section>
          )}

          {/* 3. Resultado */}
          {resultado && (
            <section className="space-y-4" aria-live="polite">
              <div
                className={`p-3 rounded-[8px] text-sm ${
                  pendientes.length ? 'bg-[#fdecec] text-[#7a0c1e]' : 'bg-[#f7f7f8] text-[#1f2023] border border-[#e5e7ea]'
                }`}
              >
                <span className="font-semibold">{aplicada ? 'Guardada: ' : 'Propuesta (todavía no se guarda): '}</span>
                {resumenGeneracion(resultado)}
              </div>

              {propuestaPorDia.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#1f2023]">
                    {aplicada ? 'Actividades ubicadas' : 'Distribución propuesta'}
                  </h3>
                  {propuestaPorDia.map((dia) => (
                    <div key={dia.fecha} className="rounded-[16px] border border-[#e5e7ea] bg-white overflow-hidden">
                      <p className="px-4 py-2 bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023]">
                        {dia.fechaTexto}
                      </p>
                      <ul className="divide-y divide-[#e5e7ea]">
                        {dia.items.map((a) => (
                          <li key={a.actividadId} className="px-4 py-2.5 flex items-center gap-4 text-sm">
                            <span className="w-36 shrink-0 font-semibold text-[#a6192e] text-xs whitespace-nowrap">
                              {formatearHora(a.horaInicio)} – {formatearHora(a.horaFin)}
                            </span>
                            <span className="flex-1 min-w-0 font-medium text-[#1f2023] truncate">{a.nombre}</span>
                            <span className="text-xs text-[#5b5f66] inline-flex items-center gap-1 shrink-0">
                              <Building className="w-3.5 h-3.5" />
                              {a.salaNombre}
                            </span>
                            {a.ponenteNombre && (
                              <span className="text-xs text-[#5b5f66] inline-flex items-center gap-1 shrink-0">
                                <User className="w-3.5 h-3.5" />
                                {a.ponenteNombre}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Criterio 2: pendientes de asignación manual */}
              {pendientes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#1f2023] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#a6192e]" />
                    Pendientes de asignación manual ({pendientes.length})
                  </h3>
                  <ul className="space-y-2">
                    {pendientes.map((p) => {
                      const actividad = porProgramar.find((a) => a.id === p.actividadId);
                      return (
                        <li key={p.actividadId} className="p-4 rounded-[16px] border border-[#a6192e]/20 bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#1f2023]">
                                {p.nombre}
                                <span className="ml-2 align-middle inline-block px-2 py-0.5 rounded-full bg-[#fdecec] text-[#7a0c1e] text-[11px] font-semibold">
                                  {etiquetaMotivo(p.motivo)}
                                </span>
                              </p>
                              <p className="text-xs text-[#5b5f66] mt-1">{p.mensaje}</p>
                              {SUGERENCIA_POR_MOTIVO[p.motivo] && (
                                <p className="text-xs text-[#1f2023] mt-1">{SUGERENCIA_POR_MOTIVO[p.motivo]}</p>
                              )}
                            </div>
                            {onAsignarManual && (actividad || aplicada) && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => onAsignarManual(actividad || { id: p.actividadId, nombre: p.nombre,
                                  duracionMinutos: p.duracionMinutos, ponenteId: p.ponenteId })}
                              >
                                <Hand className="w-4 h-4" />
                                Asignar a mano
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      </ModalShell>

      {formulario && (
        <ActividadPorProgramarModal
          actividad={formulario.actividad}
          tiposActividad={tiposActividad}
          ponentes={ponentes}
          propuestas={propuestas}
          onSubmit={guardarActividad}
          onClose={() => setFormulario(null)}
        />
      )}
    </>
  );
}
