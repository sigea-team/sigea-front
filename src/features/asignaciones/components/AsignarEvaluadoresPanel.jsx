import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { AlertTriangle, History, Lock, Repeat, UserCheck, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import BotonAccion from '../../../components/ui/BotonAccion';
import ConflictoBadge from './ConflictoBadge';
import EstadoAsignacionBadge from './EstadoAsignacionBadge';
import HistorialAsignaciones from './HistorialAsignaciones';
import {
  LIMITE_MOTIVO,
  NIVELES_CONFLICTO,
  advertenciasDeSeleccion,
  candidatosReasignacion,
  formatearFechaHoraCorta,
  interpretarErrorAsignacion,
  puedeAsignarPropuesta,
  puedeReasignar,
  puedeSeleccionarEvaluador,
  requiereConfirmacion,
  textoCarga,
  validarMotivo,
} from '../asignacionUtils';

/**
 * @file AsignarEvaluadoresPanel.jsx
 * @description Asignación de una propuesta a los evaluadores del comité (HU-16: RF24).
 * - Criterio 1: se marcan uno o más evaluadores y se asignan; cada uno recibe una notificación y la
 *   propuesta aparece en su bandeja.
 * - Criterio 2: cada evaluador muestra su conflicto de interés. Si es autor, no se puede marcar; si
 *   comparte afiliación con un autor, se advierte y se pide confirmación antes de asignar.
 * - Criterio 3: «Reasignar» cambia el evaluador de una asignación sin calificaciones y el movimiento
 *   queda en el historial.
 * El padre debe montarlo con una `key` distinta por propuesta.
 * @module features/asignaciones/components/AsignarEvaluadoresPanel
 */

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  customClass: { popup: 'rounded-[16px]', confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm' },
};

/**
 * Pide confirmar una asignación con posible conflicto de interés (Criterio 2).
 * @param {Array<string>} advertencias
 * @returns {Promise<boolean>}
 */
async function confirmarConflicto(advertencias) {
  const { isConfirmed } = await Swal.fire({
    ...ESTILO_SWAL,
    icon: 'warning',
    title: 'Posible conflicto de interés',
    text: `${advertencias.join(' ')} ¿Deseas asignar de todos modos? Quedará registrado en el historial.`,
    showCancelButton: true,
    confirmButtonText: 'Asignar de todos modos',
    cancelButtonText: 'Revisar selección',
    reverseButtons: true,
  });
  return isConfirmed;
}

/**
 * @param {Object} props
 * @param {{ propuestaId: number, titulo: string, estado: string }} props.propuesta
 * @param {typeof import('../../../api/asignacionService').asignacionService} props.api
 * @param {function(): void} [props.onCambio] - Se llama después de asignar o reasignar.
 */
export default function AsignarEvaluadoresPanel({ propuesta, api, onCambio }) {
  const [asignaciones, setAsignaciones] = useState(null);
  const [disponibles, setDisponibles] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [version, setVersion] = useState(0);

  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [error, setError] = useState(null);

  const [reasignacion, setReasignacion] = useState(null); // { asignacion, nuevoId, motivo, error }
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(false);

  const propuestaId = propuesta.propuestaId;
  const asignable = puedeAsignarPropuesta(propuesta);

  useEffect(() => {
    let activo = true;
    Promise.all([api.listarAsignaciones(propuestaId), api.listarEvaluadoresDisponibles(propuestaId)])
      .then(([listaAsignaciones, listaDisponibles]) => {
        if (!activo) return;
        setAsignaciones(listaAsignaciones);
        setDisponibles(listaDisponibles);
        setErrorCarga(false);
      })
      .catch(() => {
        if (activo) setErrorCarga(true);
      });
    return () => {
      activo = false;
    };
  }, [api, propuestaId, version]);

  useEffect(() => {
    if (!mostrarHistorial) return undefined;
    let activo = true;
    api
      .listarHistorial(propuestaId)
      .then((lista) => {
        if (!activo) return;
        setHistorial(lista);
        setErrorHistorial(false);
      })
      .catch(() => {
        if (activo) setErrorHistorial(true);
      });
    return () => {
      activo = false;
    };
  }, [api, propuestaId, mostrarHistorial, version]);

  const recargar = () => setVersion((v) => v + 1);

  const advertencias = useMemo(
    () => advertenciasDeSeleccion(disponibles, seleccionados),
    [disponibles, seleccionados]
  );
  const candidatos = useMemo(() => candidatosReasignacion(disponibles), [disponibles]);

  const alternarSeleccion = (comiteEvaluadorId) => {
    setAviso(null);
    setError(null);
    setSeleccionados((actual) =>
      actual.includes(comiteEvaluadorId)
        ? actual.filter((id) => id !== comiteEvaluadorId)
        : [...actual, comiteEvaluadorId]
    );
  };

  const terminarCambio = (mensaje) => {
    setAviso(mensaje);
    recargar();
    if (onCambio) onCambio();
  };

  // Criterio 1 y 2: asignar los evaluadores marcados
  const asignar = async () => {
    if (seleccionados.length === 0) return;
    setAviso(null);
    setError(null);

    let confirmado = false;
    if (advertencias.length > 0) {
      confirmado = await confirmarConflicto(advertencias);
      if (!confirmado) return;
    }

    setEnviando(true);
    try {
      let creadas;
      try {
        creadas = await api.asignarEvaluadores(propuestaId, seleccionados, confirmado);
      } catch (err) {
        // La API detectó una advertencia que la lista no mostraba (p. ej. cambió una afiliación).
        if (!requiereConfirmacion(err) || !(await confirmarConflicto([interpretarErrorAsignacion(err).mensaje]))) {
          throw err;
        }
        creadas = await api.asignarEvaluadores(propuestaId, seleccionados, true);
      }
      const nombres = (creadas || []).map((a) => a.evaluadorNombre).join(', ');
      setSeleccionados([]);
      terminarCambio(
        `Propuesta asignada a ${nombres}. ${creadas?.length === 1 ? 'El evaluador fue notificado' : 'Los evaluadores fueron notificados'} y la verán en su bandeja.`
      );
    } catch (err) {
      if (!requiereConfirmacion(err)) setError(interpretarErrorAsignacion(err).mensaje);
    } finally {
      setEnviando(false);
    }
  };

  // Criterio 3: reasignar una asignación a otro evaluador
  const confirmarReasignacion = async (evento) => {
    evento.preventDefault();
    const { asignacion, nuevoId, motivo } = reasignacion;
    if (!nuevoId) {
      setReasignacion((r) => ({ ...r, error: 'Elige el nuevo evaluador.' }));
      return;
    }
    const errorMotivo = validarMotivo(motivo);
    if (errorMotivo) {
      setReasignacion((r) => ({ ...r, error: errorMotivo }));
      return;
    }

    const candidato = candidatos.find((c) => c.comiteEvaluadorId === Number(nuevoId));
    let confirmado = false;
    if (candidato?.conflicto === NIVELES_CONFLICTO.ADVERTENCIA) {
      confirmado = await confirmarConflicto([candidato.detalleConflicto]);
      if (!confirmado) return;
    }

    setEnviando(true);
    try {
      const actualizada = await api.reasignar(asignacion.asignacionId, {
        comiteEvaluadorId: Number(nuevoId),
        motivo,
        confirmarConflicto: confirmado,
      });
      setReasignacion(null);
      terminarCambio(
        `La evaluación pasó de ${asignacion.evaluadorNombre} a ${actualizada.evaluadorNombre}. Ambos fueron notificados y el cambio quedó en el historial.`
      );
    } catch (err) {
      setReasignacion((r) => (r ? { ...r, error: interpretarErrorAsignacion(err).mensaje } : r));
    } finally {
      setEnviando(false);
    }
  };

  if (errorCarga) {
    return (
      <div className="py-10 text-center">
        <p className="font-semibold text-[#1f2023]">No se pudieron cargar los evaluadores</p>
        <button type="button" onClick={recargar} className="text-xs mt-1 text-[#a6192e] font-semibold underline cursor-pointer">
          Reintentar
        </button>
      </div>
    );
  }

  if (!asignaciones || !disponibles) {
    return (
      <p className="py-10 text-center text-sm text-[#5b5f66]" role="status">
        Cargando evaluadores...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {!asignable.permitido && (
        <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#fdecec] text-[#7a0c1e]" role="note">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed">{asignable.motivo}</p>
        </div>
      )}

      {aviso && (
        <p className="text-sm text-[#1f2023] bg-[#f7f7f8] border border-[#e5e7ea] px-3 py-2 rounded-[8px]" role="status">
          {aviso}
        </p>
      )}

      {/* Asignaciones vigentes */}
      <section aria-labelledby="asignados-titulo">
        <h3 id="asignados-titulo" className="text-sm font-bold text-[#1f2023] mb-2 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#a6192e]" aria-hidden="true" />
          Evaluadores asignados ({asignaciones.length})
        </h3>
        <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                <th scope="col" className="py-3 px-4">Evaluador</th>
                <th scope="col" className="py-3 px-4">Asignada</th>
                <th scope="col" className="py-3 px-4">Estado</th>
                {asignable.permitido && (
                  <th scope="col" className="py-3 px-4 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
              {asignaciones.length === 0 && (
                <tr>
                  <td colSpan={asignable.permitido ? 4 : 3} className="py-8 px-4 text-center text-sm text-[#5b5f66]">
                    La propuesta todavía no tiene evaluadores asignados.
                  </td>
                </tr>
              )}
              {asignaciones.map((a) => {
                const reasignable = puedeReasignar(a);
                return (
                  <tr key={a.asignacionId}>
                    <td className="py-3 px-4 align-middle">
                      <p className="font-semibold">{a.evaluadorNombre}</p>
                      <p className="text-xs text-[#5b5f66] mt-0.5">{a.areaExperticia || a.evaluadorCorreo}</p>
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap text-xs text-[#5b5f66]">
                      {formatearFechaHoraCorta(a.fechaAsignacion)}
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <EstadoAsignacionBadge estado={a.estado} />
                    </td>
                    {asignable.permitido && (
                      <td className="py-3 px-4 align-middle text-right">
                        <BotonAccion
                          icono={Repeat}
                          etiqueta={`Reasignar la evaluación de ${a.evaluadorNombre}`}
                          onClick={() => {
                            setAviso(null);
                            setReasignacion({ asignacion: a, nuevoId: '', motivo: '', error: null });
                          }}
                          disabled={!reasignable.permitido || enviando}
                          motivo={reasignable.motivo}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Criterio 3: formulario de reasignación */}
      {reasignacion && (
        <form
          onSubmit={confirmarReasignacion}
          className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8] space-y-4"
          aria-labelledby="reasignar-titulo"
        >
          <p id="reasignar-titulo" className="text-sm font-bold text-[#1f2023]">
            Reasignar la evaluación de {reasignacion.asignacion.evaluadorNombre}
          </p>
          {candidatos.length === 0 ? (
            <p className="text-sm text-[#5b5f66]">
              No hay otros evaluadores del comité disponibles para esta propuesta.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="reasignar-evaluador"
                label="Nuevo evaluador"
                required
                value={reasignacion.nuevoId}
                onChange={(e) => setReasignacion((r) => ({ ...r, nuevoId: e.target.value, error: null }))}
                placeholder="Elige un evaluador del comité"
                options={candidatos.map((c) => ({
                  value: String(c.comiteEvaluadorId),
                  label: `${c.nombre} · ${textoCarga(c.asignacionesAbiertas)}${
                    c.conflicto === NIVELES_CONFLICTO.ADVERTENCIA ? ' · posible conflicto' : ''
                  }`,
                }))}
              />
              <Input
                id="reasignar-motivo"
                label="Motivo (opcional)"
                value={reasignacion.motivo}
                maxLength={LIMITE_MOTIVO}
                onChange={(e) => setReasignacion((r) => ({ ...r, motivo: e.target.value, error: null }))}
                placeholder="Ej.: sin disponibilidad en las fechas"
              />
            </div>
          )}
          {reasignacion.error && (
            <p className="text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
              {reasignacion.error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setReasignacion(null)} disabled={enviando}>
              Cancelar
            </Button>
            {candidatos.length > 0 && (
              <Button type="submit" loading={enviando}>
                Confirmar reasignación
              </Button>
            )}
          </div>
        </form>
      )}

      {/* Criterio 1 y 2: evaluadores del comité */}
      {asignable.permitido && (
        <section aria-labelledby="comite-titulo">
          <h3 id="comite-titulo" className="text-sm font-bold text-[#1f2023] mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#a6192e]" aria-hidden="true" />
            Comité evaluador de la convocatoria
          </h3>

          {disponibles.length === 0 ? (
            <div className="p-4 rounded-[12px] border border-[#e5e7ea] bg-white text-center">
              <p className="text-sm font-semibold text-[#1f2023]">La convocatoria no tiene evaluadores registrados</p>
              <p className="text-xs text-[#5b5f66] mt-1">Registra primero a los integrantes del comité evaluador.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4 w-10">
                      <span className="sr-only">Seleccionar</span>
                    </th>
                    <th scope="col" className="py-3 px-4">Evaluador</th>
                    <th scope="col" className="py-3 px-4">Carga</th>
                    <th scope="col" className="py-3 px-4">Conflicto de interés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
                  {disponibles.map((e) => {
                    const seleccionable = puedeSeleccionarEvaluador(e);
                    const marcado = seleccionados.includes(e.comiteEvaluadorId);
                    const idCasilla = `evaluador-${e.comiteEvaluadorId}`;
                    return (
                      <tr key={e.comiteEvaluadorId} className={seleccionable.permitido ? '' : 'bg-[#f7f7f8]/60'}>
                        <td className="py-3 px-4 align-top">
                          <input
                            id={idCasilla}
                            type="checkbox"
                            checked={marcado}
                            disabled={!seleccionable.permitido || enviando}
                            onChange={() => alternarSeleccion(e.comiteEvaluadorId)}
                            title={seleccionable.motivo}
                            className="w-4 h-4 mt-0.5 accent-[#a6192e] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="py-3 px-4 align-top">
                          <label htmlFor={idCasilla} className={`font-semibold ${seleccionable.permitido ? 'cursor-pointer' : 'text-[#5b5f66]'}`}>
                            {e.nombre}
                          </label>
                          <p className="text-xs text-[#5b5f66] mt-0.5">{e.areaExperticia || e.correo}</p>
                          {e.yaAsignado && (
                            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#edeeef] text-[#5b5f66] border border-[#d8dadf]">
                              Ya asignado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top whitespace-nowrap text-xs text-[#5b5f66]">
                          {textoCarga(e.asignacionesAbiertas)}
                        </td>
                        <td className="py-3 px-4 align-top">
                          {e.conflicto === NIVELES_CONFLICTO.NINGUNO ? (
                            <span className="text-xs text-[#9ca0a6]">Ninguno</span>
                          ) : (
                            <div className="space-y-1">
                              <ConflictoBadge nivel={e.conflicto} detalle={e.detalleConflicto} />
                              <p className="text-xs text-[#5b5f66] max-w-xs">{e.detalleConflicto}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {advertencias.length > 0 && (
            <div className="flex items-start gap-2 mt-3 p-3 rounded-[8px] bg-[#fdecec] text-[#7a0c1e]" role="note">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs leading-relaxed">
                Posible conflicto de interés: {advertencias.join(' ')} Se te pedirá confirmar antes de asignar.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
              {error}
            </p>
          )}

          {disponibles.length > 0 && (
            <div className="flex items-center justify-between gap-4 mt-3">
              <p className="text-xs text-[#5b5f66]" role="status">
                {seleccionados.length === 0
                  ? 'Marca uno o más evaluadores.'
                  : `${seleccionados.length} ${seleccionados.length === 1 ? 'evaluador seleccionado' : 'evaluadores seleccionados'}`}
              </p>
              <Button type="button" onClick={asignar} disabled={seleccionados.length === 0} loading={enviando && !reasignacion}>
                Asignar seleccionados
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Criterio 3: historial */}
      <section>
        <button
          type="button"
          onClick={() => setMostrarHistorial((v) => !v)}
          aria-expanded={mostrarHistorial}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#a6192e] hover:text-[#7a0c1e] cursor-pointer"
        >
          <History className="w-4 h-4" aria-hidden="true" />
          {mostrarHistorial ? 'Ocultar historial de asignaciones' : 'Ver historial de asignaciones'}
        </button>
        {mostrarHistorial && (
          <div className="mt-3">
            <HistorialAsignaciones
              movimientos={historial}
              error={errorHistorial}
              onReintentar={recargar}
            />
          </div>
        )}
      </section>
    </div>
  );
}

AsignarEvaluadoresPanel.propTypes = {
  propuesta: PropTypes.shape({
    propuestaId: PropTypes.number.isRequired,
    titulo: PropTypes.string,
    estado: PropTypes.string,
  }).isRequired,
  api: PropTypes.object.isRequired,
  onCambio: PropTypes.func,
};
