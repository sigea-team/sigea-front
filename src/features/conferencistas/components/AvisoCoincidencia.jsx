import { Link2, UserCheck } from 'lucide-react';
import { textoCoincidencia } from '../conferencistaUtils';

/**
 * @file AvisoCoincidencia.jsx
 * @description Aviso de conferencista ya registrado (HU-12, Criterio 3). Aparece cuando el documento
 * o el correo escritos pertenecen a una persona existente: en lugar de crear un duplicado, ofrece
 * asociarla directamente al evento actual.
 * @module features/conferencistas/components/AvisoCoincidencia
 */

/**
 * @param {Object} props
 * @param {Object} props.coincidencia - CoincidenciaConferencistaResponse
 * @param {function(): void} [props.onAsociar] - Si no se envía (o ya está en el evento), no se muestra el botón.
 */
export default function AvisoCoincidencia({ coincidencia, onAsociar }) {
  if (!coincidencia) return null;
  const yaAsociado = Boolean(coincidencia.yaAsociadoAlEvento);

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-[12px] border border-border bg-surface-muted text-ink-900"
      role="alert"
    >
      <UserCheck className="w-5 h-5 shrink-0 text-brand-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900">Este conferencista ya existe en SIGEA</p>
        <p className="text-sm leading-relaxed mt-0.5">{textoCoincidencia(coincidencia)}</p>
        <p className="text-xs mt-1 text-ink-600">
          {coincidencia.tipoDocumento} {coincidencia.numeroDocumento} · {coincidencia.correo}
        </p>
      </div>
      {!yaAsociado && onAsociar && (
        <button
          type="button"
          onClick={onAsociar}
          className="h-10 px-4 shrink-0 rounded-[8px] bg-brand-600 text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600"
        >
          <Link2 className="w-4 h-4" />
          Asociar a este evento
        </button>
      )}
    </div>
  );
}
