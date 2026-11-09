import { useState } from 'react';
import PropTypes from 'prop-types';
import { Download, FileText, Lock, User } from 'lucide-react';
import { formatearFechaHoraCorta } from '../../asignaciones/asignacionUtils';
import { formatearTamano } from '../documentoUtils';

/**
 * @file HistorialVersiones.jsx
 * @description Historial de versiones de una propuesta (HU-14, Criterio 4): muestra todas las versiones,
 * de la más reciente a la más antigua, con su fecha, el autor del cambio, la nota del cambio, los datos de
 * la propuesta en esa versión y sus documentos descargables. Marca la versión definitiva (RF29).
 * @module features/propuestas/components/HistorialVersiones
 */

/**
 * @param {Object} props
 * @param {Array<Object>} props.versiones - VersionPropuestaResponse del backend (de la más antigua a la más reciente).
 * @param {function(Object): Promise<void>} props.onDescargar - Descarga un documento.
 */
export default function HistorialVersiones({ versiones, onDescargar }) {
  const [descargando, setDescargando] = useState(null);
  const [errorDescarga, setErrorDescarga] = useState(null);

  if (!versiones || versiones.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-semibold text-ink-900">La propuesta todavía no tiene versiones registradas</p>
        <p className="text-xs mt-1 text-ink-600">Las versiones se crean al enviar la propuesta con sus documentos.</p>
      </div>
    );
  }

  const descargar = async (doc) => {
    setDescargando(doc.id);
    setErrorDescarga(null);
    try {
      await onDescargar(doc);
    } catch {
      setErrorDescarga(`No se pudo descargar «${doc.nombreOriginal}». Intenta de nuevo.`);
    } finally {
      setDescargando(null);
    }
  };

  const ordenadas = [...versiones].sort((a, b) => b.numeroVersion - a.numeroVersion);
  const ultima = ordenadas[0]?.numeroVersion;

  return (
    <div className="space-y-4">
      {errorDescarga && (
        <p className="bg-brand-100 border border-brand-600 text-brand-700 text-xs rounded-[8px] p-3" role="alert">
          {errorDescarga}
        </p>
      )}

      <ol className="space-y-4">
        {ordenadas.map((v) => (
          <li
            key={v.id ?? v.numeroVersion}
            className={`rounded-[12px] border bg-white p-4 ${v.esDefinitiva ? 'border-brand-600' : 'border-border'}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink-900">Versión {v.numeroVersion}</span>
              {v.numeroVersion === ultima && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-muted text-ink-900 border border-field-border">
                  Actual
                </span>
              )}
              {v.esDefinitiva && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-100 text-brand-700 border border-brand-600">
                  <Lock className="w-3 h-3" aria-hidden="true" />
                  Definitiva
                </span>
              )}
              <span className="ml-auto text-xs text-ink-600">{formatearFechaHoraCorta(v.fechaCreacion)}</span>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-ink-600 mt-1">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              {v.autorCambioNombre || 'Usuario no registrado'}
              {v.autorCambioCorreo && <span className="text-ink-300">· {v.autorCambioCorreo}</span>}
            </p>

            {v.notaCambio && (
              <p className="text-sm text-ink-900 mt-3 border-l-2 border-field-border pl-3">{v.notaCambio}</p>
            )}

            <dl className="mt-3 grid grid-cols-1 gap-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-ink-600 shrink-0">Título:</dt>
                <dd className="text-ink-900">{v.titulo || '—'}</dd>
              </div>
              {v.palabrasClave && (
                <div className="flex gap-2">
                  <dt className="text-ink-600 shrink-0">Palabras clave:</dt>
                  <dd className="text-ink-900">{v.palabrasClave}</dd>
                </div>
              )}
            </dl>

            {v.documentos?.length > 0 && (
              <ul className="mt-3 divide-y divide-border rounded-[8px] border border-border">
                {v.documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-3 px-3 py-2">
                    <FileText className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-900 truncate">{doc.nombreOriginal}</p>
                      <p className="text-xs text-ink-600">
                        {formatearTamano(doc.tamanoBytes)}
                        {doc.principal && ' · principal'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => descargar(doc)}
                      disabled={descargando === doc.id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer disabled:text-ink-300 disabled:cursor-wait"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      {descargando === doc.id ? 'Descargando...' : 'Descargar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

HistorialVersiones.propTypes = {
  versiones: PropTypes.arrayOf(PropTypes.object),
  onDescargar: PropTypes.func.isRequired,
};
