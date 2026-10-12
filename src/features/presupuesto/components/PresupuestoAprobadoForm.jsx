import { useState } from 'react';
import { AlertCircle, ArrowUpRight, Check, ExternalLink, FileText, Link as LinkIcon } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { formatearPesos, leerNumero } from '../presupuestoUtils';
import {
  compararConPreliminar,
  validarPresupuestoAprobado,
} from '../presupuestoAprobadoUtils';

/**
 * @file PresupuestoAprobadoForm.jsx
 * @description Formulario para registrar o actualizar el presupuesto aprobado formalmente (HU-08).
 * - Criterio 1: Compara con el presupuesto preliminar (puede diferir) y registra la versión oficial.
 * - Criterio 2: En actualización, solicita motivo y conserva la versión previa.
 * - Criterio 3: Exige el enlace o URL del soporte documental obligatorio antes de guardar.
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
  const [form, setForm] = useState({
    valorTotalAprobado: aprobadoVigente ? String(aprobadoVigente.valorTotalAprobado) : '',
    resolucionOActa: aprobadoVigente?.resolucionOActa || '',
    justificacion: '',
    evidenciaUrl: aprobadoVigente?.evidenciaUrl || '',
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar datos en el cliente (Criterio 3: exige URL de la evidencia de aprobación)
    const erroresValidacion = validarPresupuestoAprobado(form, {
      esActualizacion,
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
        evidenciaUrl: form.evidenciaUrl.trim(),
        resolucionOActa: form.resolucionOActa.trim(),
        justificacion: form.justificacion.trim(),
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

      {/* Criterio 3: Enlace / URL de la Evidencia de Aprobación (OBLIGATORIO) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="evidencia-url" className="text-sm font-medium text-[#1f2023] flex items-center gap-1">
            Enlace o URL de la evidencia documental
            <span className="text-[#a6192e] font-bold">*</span>
          </label>
          {form.evidenciaUrl.trim() && (
            <a
              href={form.evidenciaUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#a6192e] hover:text-[#7a0c1e] hover:underline inline-flex items-center gap-1"
              title="Abrir enlace en una pestaña nueva para verificarlo"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Probar enlace
            </a>
          )}
        </div>
        <Input
          id="evidencia-url"
          name="evidenciaUrl"
          required
          value={form.evidenciaUrl}
          onChange={(e) => handleChange('evidenciaUrl', e.target.value)}
          placeholder="https://archivos.ufps.edu.co/presupuestos/acta-aprobacion-2026.pdf"
          error={errores.evidenciaUrl}
          helperText="Enlace al documento oficial alojado en la nube (Google Drive institucional, OneDrive, SharePoint o repositorio UFPS; máx. 255 caracteres)."
          rightElement={<LinkIcon className="w-4 h-4 text-[#5b5f66]" />}
          disabled={deshabilitado || enviando}
        />
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
