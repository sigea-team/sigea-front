import { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';
import {
  ACCEPT_DOCUMENTOS,
  MAXIMO_DOCUMENTOS,
  TAMANO_MAXIMO_MB,
  TEXTO_FORMATOS,
  clasificarArchivos,
  formatearTamano,
} from '../documentoUtils';

/**
 * @file DocumentosUploader.jsx
 * @description Selector de documentos de la propuesta (HU-14, Criterios 1 y 2).
 * Permite elegir o arrastrar archivos, los valida antes de enviarlos (formato, tamaño, vacío y cantidad
 * máxima por versión) e indica el motivo de cada archivo rechazado. El primer archivo de la lista será
 * el documento principal de la versión.
 * @module features/propuestas/components/DocumentosUploader
 */

/**
 * @param {Object} props
 * @param {Array<File>} props.archivos - Archivos elegidos (estado controlado por el padre).
 * @param {function(Array<File>): void} props.onChange - Recibe la nueva lista de archivos.
 * @param {number} [props.yaIncluidos=0] - Documentos que la versión ya tiene (conservados de la anterior).
 * @param {string} [props.error] - Error del formulario (p. ej. "debe adjuntar al menos un documento").
 * @param {boolean} [props.obligatorio=false]
 * @param {boolean} [props.deshabilitado=false]
 * @param {string} [props.etiqueta='Documentos de la propuesta']
 */
export default function DocumentosUploader({
  archivos,
  onChange,
  yaIncluidos = 0,
  error,
  obligatorio = false,
  deshabilitado = false,
  etiqueta = 'Documentos de la propuesta',
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [rechazados, setRechazados] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);

  const agregar = (lista) => {
    const { validos, rechazados: malos } = clasificarArchivos(Array.from(lista || []), yaIncluidos + archivos.length);
    setRechazados(malos);
    if (validos.length > 0) onChange([...archivos, ...validos]);
  };

  const quitar = (indice) => {
    onChange(archivos.filter((_, i) => i !== indice));
    setRechazados([]);
  };

  const alSoltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (!deshabilitado) agregar(e.dataTransfer?.files);
  };

  const cupoAgotado = yaIncluidos + archivos.length >= MAXIMO_DOCUMENTOS;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
          {etiqueta}
          {obligatorio && <span className="text-brand-600"> *</span>}
        </label>
        <p className="text-xs text-ink-600 mt-0.5">
          Formatos {TEXTO_FORMATOS} · máximo {TAMANO_MAXIMO_MB} MB por archivo · hasta {MAXIMO_DOCUMENTOS} documentos por versión.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!deshabilitado && !cupoAgotado) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={`rounded-[12px] border border-dashed px-4 py-6 text-center transition-colors ${
          arrastrando ? 'border-brand-600 bg-brand-100' : error ? 'border-brand-600' : 'border-field-border bg-surface-muted'
        }`}
      >
        <Upload className="w-6 h-6 mx-auto text-ink-600" aria-hidden="true" />
        <p className="text-sm text-ink-900 mt-2">
          Arrastra los archivos aquí o{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={deshabilitado || cupoAgotado}
            className="font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer disabled:text-ink-300 disabled:no-underline disabled:cursor-not-allowed"
          >
            selecciónalos
          </button>
        </p>
        {cupoAgotado && (
          <p className="text-xs text-ink-600 mt-1">Ya alcanzaste el máximo de {MAXIMO_DOCUMENTOS} documentos.</p>
        )}
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_DOCUMENTOS}
          className="sr-only"
          disabled={deshabilitado || cupoAgotado}
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {archivos.length > 0 && (
        <ul className="divide-y divide-border rounded-[12px] border border-border bg-white">
          {archivos.map((archivo, i) => (
            <li key={`${archivo.name}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
              <FileText className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-900 truncate">{archivo.name}</p>
                <p className="text-xs text-ink-600">
                  {formatearTamano(archivo.size)}
                  {i === 0 && yaIncluidos === 0 && ' · documento principal'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => quitar(i)}
                disabled={deshabilitado}
                className="p-1.5 rounded-full text-ink-600 hover:text-brand-600 hover:bg-brand-100 cursor-pointer disabled:cursor-not-allowed"
                aria-label={`Quitar ${archivo.name}`}
                title="Quitar archivo"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(error || rechazados.length > 0) && (
        <div className="flex items-start gap-2 bg-brand-100 border border-brand-600 text-brand-700 text-xs rounded-[8px] p-3" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" aria-hidden="true" />
          <div className="space-y-1">
            {error && <p>{error}</p>}
            {rechazados.map((r) => (
              <p key={`${r.nombre}-${r.motivo}`}>
                <strong>{r.nombre}:</strong> {r.motivo}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

DocumentosUploader.propTypes = {
  archivos: PropTypes.arrayOf(PropTypes.object).isRequired,
  onChange: PropTypes.func.isRequired,
  yaIncluidos: PropTypes.number,
  error: PropTypes.string,
  obligatorio: PropTypes.bool,
  deshabilitado: PropTypes.bool,
  etiqueta: PropTypes.string,
};
