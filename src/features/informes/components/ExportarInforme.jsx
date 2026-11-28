import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, RotateCw } from 'lucide-react';
import { FORMATOS, interpretarErrorInforme } from '../informeUtils';
import { descargarBlob } from '../../certificados/certificadoUtils';

/**
 * @file ExportarInforme.jsx
 * @description Botones para exportar un informe a PDF o Excel (HU-30, Criterios 3 y 4). Envía los mismos parámetros
 * del informe generado, descarga el archivo con el nombre que da el backend y, si la exportación falla por un motivo
 * técnico, muestra el error con «Reintentar» (los mismos parámetros y formato; nada queda a medias en el servidor).
 * También se usa en el dashboard de indicadores (HU-29) para descargar los indicadores del evento.
 * @module features/informes/components/ExportarInforme
 */

/**
 * @param {Object} props
 * @param {Object} props.parametros - Cuerpo de `POST /informes/exportar`.
 * @param {{ exportarInforme: function(Object, string): Promise<{ archivo: Blob, nombre: string }> }} props.api
 * @param {string} [props.titulo] - Texto antes de los botones.
 * @param {boolean} [props.compacto] - Botones pequeños (encabezado del dashboard).
 * @param {boolean} [props.deshabilitado]
 * @param {string} [props.motivoDeshabilitado]
 * @param {function(Blob, string): void} [props.descargar] - Por defecto descarga el archivo en el navegador.
 */
export default function ExportarInforme({
  parametros,
  api,
  titulo = 'Exportar',
  compacto = false,
  deshabilitado = false,
  motivoDeshabilitado,
  descargar = descargarBlob,
}) {
  const [enCurso, setEnCurso] = useState(null);
  const [error, setError] = useState(null);
  const [descargado, setDescargado] = useState(null);

  const exportar = async (formato) => {
    setEnCurso(formato);
    setError(null);
    setDescargado(null);
    try {
      const { archivo, nombre } = await api.exportarInforme(parametros, formato);
      descargar(archivo, nombre);
      setDescargado(nombre);
    } catch (err) {
      setError({ ...interpretarErrorInforme(err, { exportando: true, formato }), formato });
    } finally {
      setEnCurso(null);
    }
  };

  const tamano = compacto ? 'h-9 px-3 text-xs' : 'h-11 px-5 text-sm';

  return (
    <div className={`flex flex-col gap-2 ${compacto ? 'items-end' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`font-medium text-ink-600 ${compacto ? 'text-xs' : 'text-sm'}`}>{titulo}:</span>
        {Object.values(FORMATOS).map((formato) => (
          <button
            key={formato.id}
            type="button"
            onClick={() => exportar(formato.id)}
            disabled={deshabilitado || enCurso !== null}
            title={deshabilitado ? motivoDeshabilitado : `Descargar el informe en ${formato.etiqueta}`}
            aria-busy={enCurso === formato.id}
            className={`inline-flex items-center justify-center gap-2 rounded-[8px] border border-field-border bg-surface font-medium text-ink-900 transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-300 cursor-pointer ${tamano}`}
          >
            {enCurso === formato.id ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            {enCurso === formato.id ? `Generando ${formato.etiqueta}…` : formato.etiqueta}
          </button>
        ))}
      </div>

      {deshabilitado && motivoDeshabilitado && <p className="text-xs text-ink-600">{motivoDeshabilitado}</p>}

      <div aria-live="polite" className="contents">
        {descargado && !error && (
          <p className="flex items-center gap-1.5 text-xs text-ink-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-ink-600" aria-hidden="true" />
            Se descargó «{descargado}».
          </p>
        )}
      </div>

      {error && (
        <div
          className={`flex items-start gap-3 rounded-[12px] border border-brand-600/30 bg-brand-100/60 p-3 text-brand-700 ${compacto ? 'max-w-md text-xs' : 'text-sm'}`}
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="space-y-2">
            <p className="font-semibold">{error.titulo}</p>
            {error.mensaje && <p>{error.mensaje}</p>}
            {error.reintentable && (
              <button
                type="button"
                onClick={() => exportar(error.formato)}
                disabled={enCurso !== null}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-brand-600 px-3 text-xs font-medium text-surface hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                Reintentar {FORMATOS[error.formato]?.etiqueta}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
