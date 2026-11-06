import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { Check, Pencil, RotateCw, UserMinus, X } from 'lucide-react';
import EvaluadorForm from './EvaluadorForm';
import { LIMITES_EVALUADOR, nombreEvaluador } from '../comiteEvaluadorUtils';
import { interpretarErrorApi, plural } from '../../rubricas/rubricaUtils';

/**
 * @file ComiteEvaluadorPanel.jsx
 * @description Comité evaluador de una convocatoria (HU-15: RF23).
 * - Criterio 3: registra evaluadores con su área de experticia; quedan disponibles para la asignación de
 *   propuestas (HU-16).
 * - Criterio 4: el correo repetido se rechaza en el formulario.
 * Permite además corregir el área y retirar evaluadores sin propuestas asignadas.
 * El padre debe montarlo con una `key` distinta por convocatoria.
 * @module features/comiteEvaluador/components/ComiteEvaluadorPanel
 */

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  cancelButtonColor: '#5b5f66',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
    cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

const CLASE_BOTON_ICONO =
  'w-9 h-9 inline-flex items-center justify-center rounded-[8px] border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e]';

/**
 * @param {Object} props
 * @param {number} props.convocatoriaId
 * @param {typeof import('../../../api/comiteEvaluadorService').comiteEvaluadorService} props.api
 */
export default function ComiteEvaluadorPanel({ convocatoriaId, api }) {
  const [evaluadores, setEvaluadores] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [edicion, setEdicion] = useState(null); // { id, area, error, guardando }
  const [retirandoId, setRetirandoId] = useState(null);

  useEffect(() => {
    let activo = true;
    api
      .listarEvaluadores(convocatoriaId)
      .then((lista) => {
        if (!activo) return;
        setEvaluadores(Array.isArray(lista) ? lista : []);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(interpretarErrorApi(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, convocatoriaId, version]);

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setErrorCarga(null);
    setEvaluadores(null);
    recargar();
  };

  // Criterio 3: el error se relanza para que el formulario lo muestre en sus campos
  const registrar = async (datos) => {
    setAviso(null);
    const creado = await api.registrarEvaluador(convocatoriaId, datos);
    setAviso(
      `${nombreEvaluador(creado)} se registró en el comité y ya está disponible para asignarle propuestas.` +
        (creado.tieneCuenta ? '' : ' Aún no tiene cuenta en SIGEA: deberá crearla para poder calificar.')
    );
    recargar();
  };

  const iniciarEdicion = (evaluador) => {
    setAviso(null);
    setEdicion({ id: evaluador.comiteEvaluadorId, area: evaluador.areaExperticia || '', error: null, guardando: false });
  };

  const guardarEdicion = async (evaluador) => {
    const area = edicion.area.trim();
    if (!area) {
      setEdicion((e) => ({ ...e, error: 'Indica el área de experticia.' }));
      return;
    }
    if (area === (evaluador.areaExperticia || '').trim()) {
      setEdicion(null);
      return;
    }
    setEdicion((e) => ({ ...e, guardando: true, error: null }));
    try {
      await api.actualizarEvaluador(convocatoriaId, evaluador.comiteEvaluadorId, area);
      setEdicion(null);
      setAviso(`Se actualizó el área de experticia de ${nombreEvaluador(evaluador)}.`);
      recargar();
    } catch (err) {
      const { mensaje, campos } = interpretarErrorApi(err);
      setEdicion((e) => ({ ...e, guardando: false, error: campos.areaExperticia || mensaje }));
    }
  };

  const retirar = async (evaluador) => {
    const nombre = nombreEvaluador(evaluador);
    const { isConfirmed } = await Swal.fire({
      ...ESTILO_SWAL,
      icon: 'question',
      // titleText muestra texto plano: el nombre lo escribe el usuario y `title` se interpretaría como HTML
      titleText: `¿Retirar a ${nombre} del comité?`,
      text: 'Dejará de estar disponible para asignarle propuestas de esta convocatoria.',
      showCancelButton: true,
      confirmButtonText: 'Retirar del comité',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!isConfirmed) return;

    setAviso(null);
    setRetirandoId(evaluador.comiteEvaluadorId);
    try {
      await api.retirarEvaluador(convocatoriaId, evaluador.comiteEvaluadorId);
      setAviso(`${nombre} se retiró del comité evaluador.`);
      recargar();
    } catch (err) {
      Swal.fire({
        ...ESTILO_SWAL,
        icon: 'error',
        title: 'No se pudo retirar del comité',
        text: interpretarErrorApi(err).mensaje,
        confirmButtonText: 'Entendido',
      });
    } finally {
      setRetirandoId(null);
    }
  };

  let resumen = 'Cargando comité evaluador...';
  if (evaluadores) resumen = plural(evaluadores.length, 'evaluador registrado', 'evaluadores registrados');

  return (
    <div className="space-y-5">
      <EvaluadorForm onRegistrar={registrar} />

      {aviso && (
        <p className="text-sm text-[#1f2023] bg-[#f7f7f8] border border-[#e5e7ea] px-3 py-2 rounded-[8px]" role="status">
          {aviso}
        </p>
      )}

      <p className="text-sm text-[#5b5f66]" role="status">
        {resumen}
      </p>

      <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Evaluador</th>
              <th scope="col" className="py-3 px-4">Área de experticia</th>
              <th scope="col" className="py-3 px-4 whitespace-nowrap">Propuestas</th>
              <th scope="col" className="py-3 px-4 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
            {errorCarga && (
              <tr>
                <td colSpan={4} className="py-10 px-4 text-center">
                  <p className="font-semibold text-[#1f2023]">No se pudo cargar el comité evaluador</p>
                  <p className="text-xs text-[#5b5f66] mt-1">{errorCarga}</p>
                  <button
                    type="button"
                    onClick={reintentar}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[#a6192e] font-semibold underline cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Reintentar
                  </button>
                </td>
              </tr>
            )}

            {!errorCarga && !evaluadores && (
              <tr>
                <td colSpan={4} className="py-10 px-4 text-center text-[#5b5f66]" role="status">
                  Cargando comité evaluador...
                </td>
              </tr>
            )}

            {!errorCarga && evaluadores?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 px-4 text-center">
                  <p className="font-semibold text-[#1f2023]">El comité evaluador todavía no tiene miembros</p>
                  <p className="text-xs mt-1 text-[#5b5f66]">Registra al primero con su correo y su área de experticia.</p>
                </td>
              </tr>
            )}

            {!errorCarga &&
              evaluadores?.map((ev) => {
                const nombre = nombreEvaluador(ev);
                const editando = edicion?.id === ev.comiteEvaluadorId;
                const asignadas = Number(ev.propuestasAsignadas) || 0;
                return (
                  <tr key={ev.comiteEvaluadorId}>
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-[#1f2023]">{nombre}</p>
                      <p className="text-xs text-[#5b5f66] mt-0.5">
                        {ev.correo}
                        {ev.afiliacion ? ` · ${ev.afiliacion}` : ''}
                      </p>
                      {!ev.tieneCuenta && (
                        <span
                          className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff7e6] text-[#8a5a12] border border-[#b7791f]/30"
                          title="Debe crear su cuenta en SIGEA para poder calificar las propuestas que le asignen."
                        >
                          Sin cuenta
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      {editando ? (
                        <div>
                          <label htmlFor={`area-${ev.comiteEvaluadorId}`} className="sr-only">
                            Área de experticia de {nombre}
                          </label>
                          <input
                            id={`area-${ev.comiteEvaluadorId}`}
                            value={edicion.area}
                            onChange={(e) => setEdicion((s) => ({ ...s, area: e.target.value, error: null }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                guardarEdicion(ev);
                              }
                              if (e.key === 'Escape') setEdicion(null);
                            }}
                            maxLength={LIMITES_EVALUADOR.areaExperticia}
                            disabled={edicion.guardando}
                            autoFocus
                            className={`w-full h-9 px-3 rounded-[8px] bg-white text-sm border outline-none ${
                              edicion.error
                                ? 'border-[#a6192e] focus:ring-1 focus:ring-[#7a0c1e]'
                                : 'border-[#d8dadf] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e]'
                            }`}
                          />
                          {edicion.error && <p className="text-xs text-[#7a0c1e] font-medium mt-1">{edicion.error}</p>}
                        </div>
                      ) : (
                        ev.areaExperticia || <span className="text-[#9ca0a6]">Sin área</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top whitespace-nowrap">{asignadas}</td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center justify-end gap-2">
                        {editando ? (
                          <>
                            <button
                              type="button"
                              onClick={() => guardarEdicion(ev)}
                              disabled={edicion.guardando}
                              title="Guardar área"
                              aria-label={`Guardar el área de ${nombre}`}
                              className={`${CLASE_BOTON_ICONO} border-[#107e3e]/30 text-[#107e3e] bg-[#e8f5ee]/60 hover:bg-[#e8f5ee]`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEdicion(null)}
                              disabled={edicion.guardando}
                              title="Cancelar"
                              aria-label="Cancelar la edición"
                              className={`${CLASE_BOTON_ICONO} border-[#d8dadf] text-[#5b5f66] bg-white hover:bg-[#f7f7f8]`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(ev)}
                              disabled={Boolean(edicion) || retirandoId !== null}
                              title={`Editar el área de ${nombre}`}
                              aria-label={`Editar el área de ${nombre}`}
                              className={`${CLASE_BOTON_ICONO} border-[#d8dadf] text-[#5b5f66] bg-white hover:bg-[#f7f7f8] hover:text-[#1f2023]`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => retirar(ev)}
                              disabled={asignadas > 0 || Boolean(edicion) || retirandoId !== null}
                              title={
                                asignadas > 0
                                  ? `Tiene ${plural(asignadas, 'propuesta asignada', 'propuestas asignadas')}: reasígnalas antes de retirarlo.`
                                  : `Retirar a ${nombre} del comité`
                              }
                              aria-label={`Retirar a ${nombre} del comité`}
                              className={`${CLASE_BOTON_ICONO} border-[#a6192e]/20 text-[#a6192e] bg-[#fdecec]/50 hover:bg-[#fdecec]`}
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

ComiteEvaluadorPanel.propTypes = {
  convocatoriaId: PropTypes.number.isRequired,
  api: PropTypes.shape({
    listarEvaluadores: PropTypes.func.isRequired,
    registrarEvaluador: PropTypes.func.isRequired,
    actualizarEvaluador: PropTypes.func.isRequired,
    retirarEvaluador: PropTypes.func.isRequired,
  }).isRequired,
};
