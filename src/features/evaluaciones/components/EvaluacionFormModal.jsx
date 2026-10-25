import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  ClipboardCheck,
  AlertTriangle,
  Info,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Button from '../../../components/ui/Button';
import {
  calcularPuntuacionPonderada,
  determinarClasificacion,
  obtenerConfiguracionClasificacion,
  validarEvaluacionCompleta,
  puedeModificarEvaluacion,
  formatearPuntuacion,
  ESCALA_MINIMA,
  ESCALA_MAXIMA,
} from '../evaluacionUtils';
import { evaluacionService } from '../../../api/evaluacionService';

/**
 * @file EvaluacionFormModal.jsx
 * @description Modal interactivo para registrar y editar evaluaciones de propuestas según rúbrica (HU-17).
 *
 * Satisface:
 *  - Criterio 1: Registro por criterio y cálculo automático de puntuación ponderada.
 *  - Criterio 2: Validación estricta que impide enviar con criterios faltantes.
 *  - Criterio 4: Bloqueo de modificación cuando el periodo de evaluación está cerrado.
 * @module features/evaluaciones/components/EvaluacionFormModal
 */

export default function EvaluacionFormModal({
  asignacion,
  isOpen = false,
  onClose,
  onGuardadoExitoso,
}) {
  if (!isOpen || !asignacion) return null;

  // Criterio 4: verificar si el periodo de evaluación está cerrado para una evaluación ya completada
  const estadoEdicion = puedeModificarEvaluacion(asignacion);
  const esSoloLectura = !estadoEdicion.puedeEditar;

  // Inicializar estado de calificaciones a partir de las evaluaciones de la asignación
  const criterios = asignacion.evaluaciones || [];

  const [calificaciones, setCalificaciones] = useState(() => {
    return criterios.map((c) => ({
      criterioId: c.criterioId || c.id,
      nombre: c.nombreCriterio || c.nombre,
      pesoPorcentual: Number(c.pesoPorcentual || 0),
      calificacion: c.calificacion !== null && c.calificacion !== undefined ? String(c.calificacion) : '',
      observaciones: c.observaciones || '',
    }));
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Cálculo en vivo de la puntuación ponderada y clasificación proyectada (Criterio 1)
  const puntuacionProyectada = useMemo(() => {
    return calcularPuntuacionPonderada(calificaciones, criterios);
  }, [calificaciones, criterios]);

  const clasificacionProyectada = useMemo(() => {
    return determinarClasificacion(puntuacionProyectada);
  }, [puntuacionProyectada]);

  const configClasif = obtenerConfiguracionClasificacion(clasificacionProyectada);

  const handleCambioCalificacion = (criterioId, valor) => {
    if (esSoloLectura) return;

    setCalificaciones((prev) =>
      prev.map((c) => (c.criterioId === criterioId ? { ...c, calificacion: valor } : c))
    );

    if (errores[criterioId]) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia[criterioId];
        return copia;
      });
    }
  };

  const handleCambioObservaciones = (criterioId, observaciones) => {
    if (esSoloLectura) return;
    setCalificaciones((prev) =>
      prev.map((c) => (c.criterioId === criterioId ? { ...c, observaciones } : c))
    );
  };

  const handleAplicarNotaRapida = (criterioId, nota) => {
    if (esSoloLectura) return;
    handleCambioCalificacion(criterioId, String(nota));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Criterio 4: Si el periodo está cerrado, bloquear operación
    if (esSoloLectura) {
      Swal.fire({
        icon: 'warning',
        title: 'Periodo Cerrado',
        text: estadoEdicion.motivo || 'El periodo de evaluación ha cerrado. No es posible modificar esta evaluación.',
        confirmButtonColor: '#a6192e',
      });
      return;
    }

    // Criterio 2: Validar que todos los criterios de la rúbrica estén calificados
    const validacion = validarEvaluacionCompleta(calificaciones, criterios);
    if (!validacion.valido) {
      setErrores(validacion.errores);

      Swal.fire({
        icon: 'error',
        title: 'Criterios sin calificar',
        html: `
          <p class="text-sm text-left mb-2 text-[#5b5f66]">
            Todos los criterios de la rúbrica deben ser calificados obligatoriamente antes de enviar la evaluación (Criterio 2):
          </p>
          <ul class="text-xs text-left list-disc pl-5 space-y-1 font-semibold text-[#b42318]">
            ${validacion.criteriosFaltantes.map((c) => `<li>${c}</li>`).join('')}
          </ul>
        `,
        confirmButtonText: 'Completar criterios',
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]' },
      });
      return;
    }

    // Confirmación del evaluador antes de enviar
    const confirmacion = await Swal.fire({
      title: '¿Confirmar registro de evaluación?',
      html: `
        <p class="text-sm text-[#5b5f66] mb-3">
          Se registrará una puntuación ponderada preliminar de <strong>${formatearPuntuacion(puntuacionProyectada)} / 10.0</strong> (${configClasif.label}).
        </p>
        <p class="text-xs text-[#5b5f66]">
          Si todos los evaluadores asignados completan su revisión, se consolidará el resultado definitivo de la propuesta.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar evaluación',
      cancelButtonText: 'Revisar notas',
      confirmButtonColor: '#a6192e',
      cancelButtonColor: '#5b5f66',
      customClass: { popup: 'rounded-[16px]' },
    });

    if (!confirmacion.isConfirmed) return;

    setGuardando(true);
    try {
      const payload = {
        asignacionId: asignacion.asignacionId,
        calificaciones: calificaciones.map((c) => ({
          criterioId: Number(c.criterioId),
          calificacion: Number(c.calificacion),
          observaciones: c.observaciones?.trim() || null,
        })),
      };

      const resultadoAsignacion = await evaluacionService.registrarEvaluacion(payload);

      // Consultar si la propuesta quedó completa tras el envío
      let resultadoPropuesta = null;
      try {
        resultadoPropuesta = await evaluacionService.obtenerResultado(asignacion.propuestaId);
      } catch {
        // En caso de fallo de red
      }

      await Swal.fire({
        icon: 'success',
        title: 'Evaluación Registrada',
        html: `
          <div class="text-left space-y-2 text-sm text-[#1f2023]">
            <p>Tu evaluación ha sido guardada exitosamente con una puntuación ponderada de <strong>${formatearPuntuacion(puntuacionProyectada)}</strong>.</p>
            ${
              resultadoPropuesta?.completo
                ? `<div class="p-3 bg-[#ecfdf3] border border-[#a6f4c5] text-[#027a48] rounded-[8px] text-xs">
                     <strong>✓ Todas las evaluaciones están completas (Criterio 1):</strong>
                     El sistema calculó la puntuación ponderada final de la propuesta (${formatearPuntuacion(resultadoPropuesta.puntuacionPonderada)}) con clasificación <strong>${resultadoPropuesta.clasificacion}</strong>.
                   </div>`
                : `<div class="p-3 bg-[#fffaeb] border border-[#fedf89] text-[#b54708] rounded-[8px] text-xs">
                     <strong>⏳ Evaluaciones pendientes (Criterio 3):</strong>
                     Otros miembros del comité aún tienen asignaciones pendientes. El resultado final se calculará cuando todos hayan evaluado.
                   </div>`
            }
          </div>
        `,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]' },
      });

      if (onGuardadoExitoso) {
        onGuardadoExitoso(resultadoAsignacion);
      }
      onClose();
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409) {
        // Criterio 4: Periodo de evaluación cerrado en backend
        Swal.fire({
          icon: 'error',
          title: 'Periodo Cerrado (Criterio 4)',
          text: data?.message || 'La evaluación ya fue enviada y el periodo de evaluación está cerrado. No se puede modificar.',
          confirmButtonColor: '#a6192e',
        });
      } else if (status === 400 && data?.criteriosFaltantes) {
        // Criterio 2: Backend devolvió criterios faltantes
        Swal.fire({
          icon: 'error',
          title: 'Criterios incompletos (Criterio 2)',
          text: `Faltan por calificar: ${data.criteriosFaltantes.join(', ')}`,
          confirmButtonColor: '#a6192e',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al registrar',
          text: data?.message || 'Ocurrió un error al guardar la evaluación. Por favor intenta de nuevo.',
          confirmButtonColor: '#a6192e',
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-evaluacion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] shadow-xl w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado del modal */}
        <div className="bg-[#f7f7f8] border-b border-[#e5e7ea] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a6192e] block">
                HU-17 • Rúbrica de Evaluación
              </span>
              <h2 id="modal-evaluacion-title" className="font-serif-title text-xl text-[#1f2023] leading-snug">
                Evaluar Propuesta Académica
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-[#5b5f66] hover:bg-white hover:text-[#1f2023] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#1f2023]">
          {/* Advertencia de Criterio 4: Periodo Cerrado */}
          {esSoloLectura && (
            <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e]">
              <Lock className="w-5 h-5 shrink-0 mt-0.5 text-[#a6192e]" />
              <div>
                <p className="font-semibold text-sm">Evaluación en modo de solo lectura (Criterio 4)</p>
                <p className="text-xs mt-0.5">
                  Esta evaluación ya fue registrada y el periodo de evaluación ha finalizado. De acuerdo con las reglas de SIGEA, no se permite su modificación una vez cerrada la convocatoria.
                </p>
              </div>
            </div>
          )}

          {/* Tarjeta de datos de la propuesta */}
          <div className="bg-[#f7f7f8] border border-[#e5e7ea] rounded-[12px] p-5 space-y-3">
            <div>
              <span className="text-[10px] font-bold text-[#5b5f66] uppercase tracking-wider">
                Título de la ponencia postulada
              </span>
              <h3 className="font-serif-title text-lg text-[#1f2023] font-bold mt-0.5">
                {asignacion.propuestaTitulo}
              </h3>
            </div>

            {asignacion.propuestaResumen && (
              <div>
                <span className="text-[10px] font-bold text-[#5b5f66] uppercase tracking-wider">
                  Resumen de la propuesta
                </span>
                <p className="text-xs text-[#5b5f66] mt-0.5 leading-relaxed bg-white p-3 rounded-[8px] border border-[#e5e7ea]">
                  {asignacion.propuestaResumen}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-[#5b5f66]">
              {asignacion.convocatoriaTitulo && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#a6192e] shrink-0" />
                  <span className="truncate">{asignacion.convocatoriaTitulo}</span>
                </div>
              )}
              {Array.isArray(asignacion.autores) && asignacion.autores.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#a6192e] shrink-0" />
                  <span className="truncate">{asignacion.autores.join(', ')}</span>
                </div>
              )}
              {asignacion.fechaCierre && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#a6192e] shrink-0" />
                  <span>
                    Cierre: <strong>{new Date(asignacion.fechaCierre).toLocaleDateString()}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resumen dinámico en vivo: Puntuación Ponderada y Clasificación (Criterio 1) */}
          <div className="bg-white border-2 border-[#a6192e]/20 rounded-[12px] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#e5e7ea]">
              <div>
                <span className="text-[10px] font-bold text-[#a6192e] uppercase tracking-wider block">
                  Cálculo Ponderado en Tiempo Real (Criterio 1)
                </span>
                <p className="font-serif-title text-2xl text-[#1f2023] font-bold mt-0.5">
                  {puntuacionProyectada !== null ? `${formatearPuntuacion(puntuacionProyectada)} / 10.0` : '— / 10.0'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5b5f66]">Clasificación proyectada:</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${configClasif.badgeClass}`}
                >
                  {configClasif.label}
                </span>
              </div>
            </div>

            {/* Barra de progreso visual con umbrales */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] text-[#5b5f66] font-semibold">
                <span>0.0 (Rechazada)</span>
                <span>5.0 (Ajustes)</span>
                <span>7.0 (Aprobada)</span>
                <span>10.0</span>
              </div>
              <div className="h-2.5 w-full bg-[#f7f7f8] border border-[#e5e7ea] rounded-full overflow-hidden relative">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((puntuacionProyectada || 0) / 10) * 100))}%`,
                    backgroundColor: configClasif.color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Formulario de criterios de la rúbrica */}
          <form id="form-evaluacion" onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-base text-[#1f2023]">
                Criterios de la Rúbrica ({calificaciones.length})
              </h4>
              <span className="text-xs text-[#5b5f66]">
                Todos los criterios son de calificación obligatoria (0.0 a 10.0)
              </span>
            </div>

            <div className="space-y-4">
              {calificaciones.map((criterio, index) => {
                const cid = String(criterio.criterioId);
                const tieneError = Boolean(errores[cid]);
                const notaNum = Number(criterio.calificacion);
                const ponderacionCriterio =
                  !isNaN(notaNum) && notaNum >= 0 && notaNum <= 10
                    ? ((notaNum * criterio.pesoPorcentual) / 100).toFixed(2)
                    : null;

                return (
                  <div
                    key={cid}
                    className={`rounded-[12px] border p-4 sm:p-5 transition-all ${
                      tieneError
                        ? 'border-[#b42318] bg-[#fffbfa]'
                        : 'border-[#e5e7ea] bg-white hover:border-[#a6192e]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] text-xs font-bold text-[#1f2023] flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <h5 className="font-bold text-sm text-[#1f2023]">
                            {criterio.nombre}
                          </h5>
                        </div>
                        {criterio.descripcion && (
                          <p className="text-xs text-[#5b5f66] pl-8">
                            {criterio.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Badge con el peso porcentual */}
                      <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] text-xs font-bold text-[#a6192e]">
                          Peso: {criterio.pesoPorcentual}%
                        </span>
                        {ponderacionCriterio && (
                          <span className="text-[11px] font-semibold text-[#107e3e]">
                            +{ponderacionCriterio} pts
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Controles de calificación */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 pl-0 sm:pl-8">
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-[#1f2023] mb-1">
                          Calificación (0.0 – 10.0) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min={ESCALA_MINIMA}
                            max={ESCALA_MAXIMA}
                            value={criterio.calificacion}
                            onChange={(e) => handleCambioCalificacion(criterio.criterioId, e.target.value)}
                            disabled={esSoloLectura || guardando}
                            placeholder="Ej: 8.5"
                            className={`w-full rounded-[8px] border px-3 py-2 text-sm font-semibold outline-hidden transition-all ${
                              tieneError
                                ? 'border-[#b42318] bg-white text-[#b42318] focus:border-[#b42318] focus:ring-2 focus:ring-[#b42318]/20'
                                : 'border-[#e5e7ea] bg-white text-[#1f2023] focus:border-[#a6192e] focus:ring-2 focus:ring-[#a6192e]/20'
                            }`}
                          />
                        </div>

                        {/* Botones de calificación rápida */}
                        {!esSoloLectura && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {[0, 5, 7, 8.5, 10].map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => handleAplicarNotaRapida(criterio.criterioId, v)}
                                className="px-1.5 py-0.5 text-[10px] font-medium bg-[#f7f7f8] hover:bg-[#fdecec] hover:text-[#a6192e] border border-[#e5e7ea] rounded-sm transition-colors cursor-pointer"
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-8">
                        <label className="block text-xs font-semibold text-[#1f2023] mb-1">
                          Observaciones y retroalimentación para el autor (Opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={criterio.observaciones}
                          onChange={(e) => handleCambioObservaciones(criterio.criterioId, e.target.value)}
                          disabled={esSoloLectura || guardando}
                          placeholder="Añade comentarios técnicos, sugerencias o justificación de la nota..."
                          className="w-full rounded-[8px] border border-[#e5e7ea] px-3 py-2 text-xs text-[#1f2023] outline-hidden focus:border-[#a6192e] focus:ring-2 focus:ring-[#a6192e]/20 resize-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Mensaje de error si falta calificar */}
                    {tieneError && (
                      <p className="text-xs text-[#b42318] font-semibold mt-2 pl-8 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{errores[cid]}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </form>
        </div>

        {/* Pie del modal con acciones */}
        <div className="bg-[#f7f7f8] border-t border-[#e5e7ea] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#5b5f66]">
            {esSoloLectura ? (
              <span className="inline-flex items-center gap-1 text-[#b42318] font-semibold">
                <Lock className="w-3.5 h-3.5" />
                Periodo de evaluación cerrado
              </span>
            ) : (
              <span>Revisa todas tus notas antes de confirmar el envío</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={guardando}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>

            {!esSoloLectura && (
              <Button
                type="submit"
                form="form-evaluacion"
                variant="primary"
                size="md"
                loading={guardando}
                disabled={guardando}
                className="w-full sm:w-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar y Enviar Evaluación</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

EvaluacionFormModal.propTypes = {
  asignacion: PropTypes.object,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onGuardadoExitoso: PropTypes.func,
};
