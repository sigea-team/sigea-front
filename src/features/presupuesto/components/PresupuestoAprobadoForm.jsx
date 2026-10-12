import { useRef, useState } from 'react';
import { AlertCircle, ArrowUpRight, Check, FileCheck, FileText, UploadCloud, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { formatearPesos, leerNumero } from '../presupuestoUtils';
import {
  compararConPreliminar,
  formatearTamanoArchivo,
  validarPresupuestoAprobado,
} from '../presupuestoAprobadoUtils';

/**
 * @file PresupuestoAprobadoForm.jsx
 * @description Formulario para registrar o actualizar el presupuesto aprobado formalmente (HU-08).
 * - Criterio 1: Compara con el presupuesto preliminar (puede diferir) y registra la versión oficial.
 * - Criterio 2: En actualización, solicita motivo y conserva la versión previa.
 * - Criterio 3: Exige soporte documental obligatorio antes de guardar.
 * @module features/presupuesto/components/PresupuestoAprobadoForm
 */

/**
 * @param {Object} props
 * @param {number} props.totalPreliminar - Monto del presupuesto preliminar para contraste (Criterio 1)
 * @param {Object} [props.aprobadoVigente] - Versión vigente actual si se está realizando una actualización (Criterio 2)
 * @param {boolean} [props.esActualizacion=false]
 * @param {function(Object): Promise<void>} props.onSubmit
 * @param {function(): void} [props.onCancelar]
 * @param {boolean} [props.deshabilitado=false]
 */
export default function PresupuestoAprobadoForm({
  totalPreliminar = 0,
  aprobadoVigente = null,
  esActualizacion = false,
  onSubmit,
  onCancelar,
  deshabilitado = false,
}) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    valorTotalAprobado: aprobadoVigente ? String(aprobadoVigente.valorTotalAprobado) : '',
    resolucionOActa: aprobadoVigente?.resolucionOActa || '',
    justificacion: '',
    evidenciaUrl: aprobadoVigente?.evidenciaUrl || '',
    evidencia: null,
    evidenciaNombre: aprobadoVigente?.evidenciaUrl || '',
    evidenciaTamano: 0,
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  // Comparación dinámica en tiempo real contra el presupuesto preliminar
  const comparativa = compararConPreliminar(form.valorTotalAprobado, totalPreliminar);

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => {
        const nuevos = { ...prev };
        delete nuevos[campo];
        return nuevos;
      });
    }
  };

  const handleCopiarPreliminar = () => {
    if (totalPreliminar > 0) {
      handleChange('valorTotalAprobado', String(totalPreliminar));
    }
  };

  const handleArchivoSeleccionado = (archivo) => {
    if (!archivo) return;
    setForm((prev) => ({
      ...prev,
      evidencia: archivo,
      evidenciaNombre: archivo.name,
      evidenciaUrl: prev.evidenciaUrl || `https://archivos.ufps.edu.co/soporte/${archivo.name}`,
      evidenciaTamano: archivo.size,
    }));
    if (errores.evidencia) {
      setErrores((prev) => {
        const nuevos = { ...prev };
        delete nuevos.evidencia;
        return nuevos;
      });
    }
  };

  const handleRemoverArchivo = () => {
    setForm((prev) => ({
      ...prev,
      evidencia: null,
      evidenciaNombre: '',
      evidenciaUrl: '',
      evidenciaTamano: 0,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleArchivoSeleccionado(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar datos en el cliente (Criterio 3: exige evidencia de aprobación)
    const erroresValidacion = validarPresupuestoAprobado(form, {
      esActualizacion,
      conservarEvidenciaPrevia: false,
    });

    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    try {
      setEnviando(true);
      const montoNumero = leerNumero(form.valorTotalAprobado);

      const payload = {
        valorTotalAprobado: montoNumero,
        evidenciaUrl: (form.evidenciaUrl || form.evidenciaNombre || '').trim(),
        resolucionOActa: form.resolucionOActa.trim(),
        justificacion: form.justificacion.trim(),
        evidencia: form.evidencia,
        evidenciaNombre: form.evidenciaNombre,
      };

      await onSubmit(payload);
    } catch (err) {
      const msj = err?.response?.data?.message || err?.message || 'No se pudo guardar el presupuesto aprobado.';
      setErrores((prev) => ({ ...prev, general: msj }));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Criterio 1: Marco de referencia del Presupuesto Preliminar */}
      <div className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8] space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5b5f66]">
              Referencia preliminar del evento
            </span>
            <p className="text-sm font-semibold text-[#1f2023] mt-0.5">
              Presupuesto preliminar base: {formatearPesos(totalPreliminar)}
            </p>
          </div>
          {totalPreliminar > 0 && (
            <button
              type="button"
              onClick={handleCopiarPreliminar}
              className="text-xs font-semibold text-[#a6192e] hover:text-[#7a0c1e] hover:underline cursor-pointer flex items-center gap-1"
              title="Copiar el monto total del preliminar en el campo de monto aprobado"
            >
              <Check className="w-3.5 h-3.5" />
              Usar monto preliminar
            </button>
          )}
        </div>

        {/* Criterio 1: Muestra en vivo si el monto aprobado difiere del preliminar */}
        {form.valorTotalAprobado && (
          <div
            className={`text-xs px-3 py-1.5 rounded-[8px] flex items-center gap-2 ${
              comparativa.tipo === 'igual'
                ? 'bg-[#e8f3ec] text-[#1e6b3a]'
                : comparativa.tipo === 'mayor'
                ? 'bg-[#fdecec] text-[#7a0c1e]'
                : 'bg-[#edeeef] text-[#1f2023]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{comparativa.etiqueta}</span>
          </div>
        )}
      </div>

      {errores.general && (
        <div className="p-3.5 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errores.general}</span>
        </div>
      )}

      {/* Grid de campos principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Campo Monto Aprobado */}
        <div>
          <Input
            id="valor-total-aprobado"
            label="Monto oficial aprobado (COP)"
            required
            value={form.valorTotalAprobado}
            onChange={(e) => handleChange('valorTotalAprobado', e.target.value)}
            placeholder="Ej. 15.000.000"
            error={errores.valorTotalAprobado}
            helperText={
              form.valorTotalAprobado && !errores.valorTotalAprobado
                ? `Lectura formal: ${formatearPesos(form.valorTotalAprobado)}`
                : 'Monto oficial autorizado para la ejecución del evento'
            }
            disabled={deshabilitado || enviando}
          />
        </div>

        {/* Campo Documento de Aprobación */}
        <div>
          <Input
            id="resolucion-acta"
            label="Acta o Resolución formal"
            value={form.resolucionOActa}
            onChange={(e) => handleChange('resolucionOActa', e.target.value)}
            placeholder="Ej. Resolución No. 042-2026 / Acta 12"
            error={errores.resolucionOActa}
            helperText="Número o código del acto administrativo de aprobación"
            disabled={deshabilitado || enviando}
          />
        </div>
      </div>

      {/* Criterio 3: Soporte Documental / Evidencia de Aprobación (OBLIGATORIO) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1f2023] flex items-center justify-between">
          <span className="flex items-center gap-1">
            Evidencia documental de aprobación
            <span className="text-[#a6192e] font-bold">*</span>
          </span>
          <span className="text-xs text-[#5b5f66] font-normal">PDF, PNG, JPG (máx. 10 MB)</span>
        </label>

        {/* Caja de carga / Drag and drop */}
        {!form.evidenciaNombre ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[12px] p-6 text-center transition-colors cursor-pointer ${
              arrastrando
                ? 'border-[#a6192e] bg-[#fdecec]/30'
                : errores.evidencia
                ? 'border-[#a6192e] bg-[#fdecec]/20'
                : 'border-[#d8dadf] hover:border-[#a6192e] bg-[#f7f7f8]/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Adjuntar evidencia documental de aprobación"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
              onChange={(e) => handleArchivoSeleccionado(e.target.files?.[0])}
              disabled={deshabilitado || enviando}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#1f2023]">
                Haz clic para adjuntar o arrastra aquí el documento soporte
              </p>
              <p className="text-xs text-[#5b5f66]">
                Acta firmada, resolución escaneada o soporte oficial expedido por la institución
              </p>
            </div>
          </div>
        ) : (
          /* Archivo cargado */
          <div className="flex items-center justify-between p-3.5 rounded-[12px] border border-[#e5e7ea] bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[8px] bg-[#e8f3ec] text-[#1e6b3a] flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1f2023] truncate">{form.evidenciaNombre}</p>
                <p className="text-xs text-[#5b5f66]">
                  {formatearTamanoArchivo(form.evidenciaTamano)} • Soporte listo para guardar
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoverArchivo}
              className="p-1.5 text-[#5b5f66] hover:text-[#a6192e] hover:bg-[#fdecec] rounded-full transition-colors cursor-pointer"
              title="Quitar archivo"
              aria-label="Quitar archivo adjunto"
              disabled={deshabilitado || enviando}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Opción de URL directa para la evidencia */}
        <div className="pt-1.5">
          <Input
            id="evidencia-url-input"
            label="O especifica la URL / enlace institucional del soporte"
            value={form.evidenciaUrl}
            onChange={(e) => handleChange('evidenciaUrl', e.target.value)}
            placeholder="https://archivos.ufps.edu.co/presupuestos/acta-2026.pdf"
            helperText="Enlace al repositorio institucional (máx. 255 caracteres)"
            disabled={deshabilitado || enviando}
          />
        </div>

        {/* Mensaje de error para Criterio 3: Soporte exigido */}
        {errores.evidencia && (
          <div className="p-2.5 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-xs flex items-center gap-2 mt-1.5" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errores.evidencia}</span>
          </div>
        )}
      </div>

      {/* Criterio 2: Justificación / Motivo del cambio (resaltado en actualización) */}
      <div className="space-y-1.5">
        <label htmlFor="justificacion-aprobado" className="text-sm font-medium text-[#1f2023] flex items-center gap-1">
          {esActualizacion ? 'Motivo o justificación de la actualización' : 'Observaciones o justificación'}
          {esActualizacion && <span className="text-[#a6192e] font-bold">*</span>}
        </label>
        <textarea
          id="justificacion-aprobado"
          rows={3}
          value={form.justificacion}
          onChange={(e) => handleChange('justificacion', e.target.value)}
          placeholder={
            esActualizacion
              ? 'Explica por qué se actualiza el monto o el soporte oficial (ej. Adición presupuestal para ponencias)'
              : 'Notas u observaciones adicionales sobre la aprobación formal'
          }
          disabled={deshabilitado || enviando}
          className={`w-full rounded-[8px] border px-3 py-2 text-sm text-[#1f2023] placeholder-[#9ca0a6] focus:outline-none focus:ring-2 focus:ring-[#a6192e] transition-colors resize-none ${
            errores.justificacion ? 'border-[#a6192e] bg-[#fdecec]/20' : 'border-[#d8dadf] bg-white'
          }`}
        />
        {errores.justificacion ? (
          <p className="text-xs text-[#a6192e] font-medium">{errores.justificacion}</p>
        ) : (
          <p className="text-xs text-[#5b5f66]">
            {esActualizacion
              ? 'Este motivo quedará registrado en el historial de cambios vinculado a la nueva versión.'
              : 'Información complementaria visible en el registro de la versión oficial.'}
          </p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e7ea]">
        {onCancelar && (
          <Button type="button" variant="outline" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={deshabilitado || enviando}>
          <FileText className="w-4 h-4" />
          <span>{enviando ? 'Guardando...' : esActualizacion ? 'Guardar nueva versión' : 'Guardar versión oficial'}</span>
        </Button>
      </div>
    </form>
  );
}
