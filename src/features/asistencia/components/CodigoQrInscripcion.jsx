import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Copy, Download, Mail, QrCode, RefreshCw } from 'lucide-react';
import { asistenciaService } from '../../../api/asistenciaService';
import { mensajeError, nombreArchivoQr } from '../asistenciaUtils';

/**
 * @file CodigoQrInscripcion.jsx
 * @description HU-24: el participante ve su código QR de inscripción (Criterio 1), lo descarga o lo copia, y pide
 * que se lo reenvíen por correo (Criterio 4). El reenvío siempre manda el mismo código.
 * La imagen se pide con axios como Blob porque el endpoint exige el token.
 * @module features/asistencia/components/CodigoQrInscripcion
 */

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

const botonSecundario =
  'inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-field-border bg-white text-xs font-medium text-ink-900 hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * @param {Object} props
 * @param {number|string} props.eventoId
 * @param {string} [props.eventoNombre] - Para el nombre del archivo descargado.
 * @param {string} [props.codigoInicial] - Código que ya trae la inscripción (`codigoQr`); si falta se consulta.
 * @param {typeof asistenciaService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 */
export default function CodigoQrInscripcion({ eventoId, eventoNombre = '', codigoInicial, api = asistenciaService }) {
  const [codigo, setCodigo] = useState(codigoInicial || '');
  const [urlImagen, setUrlImagen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorImagen, setErrorImagen] = useState(null);
  const [reenviando, setReenviando] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!eventoId) return undefined;
    let activo = true;
    let urlCreada = null;
    Promise.allSettled([
      codigoInicial ? Promise.resolve({ codigo: codigoInicial }) : api.obtenerMiCodigoQr(eventoId),
      api.obtenerImagenMiQr(eventoId, 320),
    ])
      .then(([resCodigo, resImagen]) => {
        if (!activo) return;
        if (resCodigo.status === 'fulfilled' && resCodigo.value?.codigo) setCodigo(resCodigo.value.codigo);
        if (resImagen.status === 'fulfilled' && resImagen.value) {
          urlCreada = URL.createObjectURL(resImagen.value);
          setUrlImagen(urlCreada);
          setErrorImagen(null);
        } else {
          setUrlImagen(null);
          setErrorImagen(mensajeError(resImagen.reason, 'No se pudo cargar la imagen del código QR.'));
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
      if (urlCreada) URL.revokeObjectURL(urlCreada);
    };
  }, [eventoId, codigoInicial, api, version]);

  const reintentar = () => {
    setCargando(true);
    setVersion((v) => v + 1);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      Swal.fire({ icon: 'success', title: 'Código copiado', timer: 1400, showConfirmButton: false, ...ESTILO_SWAL });
    } catch {
      Swal.fire({ icon: 'info', title: 'Tu código', text: codigo, confirmButtonText: 'Entendido', ...ESTILO_SWAL });
    }
  };

  // Criterio 4: reenvío sin generar un código distinto.
  const reenviar = async () => {
    setReenviando(true);
    try {
      const r = await api.reenviarMiQr(eventoId);
      if (r?.codigo) setCodigo(r.codigo);
      await Swal.fire({
        icon: r?.enviado ? 'success' : 'warning',
        title: r?.enviado ? 'Te reenviamos tu código QR' : 'No se pudo enviar el correo',
        text: r?.enviado
          ? `Lo enviamos a ${r.correoDestino}. Es el mismo código de tu inscripción.`
          : r?.mensaje || 'Intenta más tarde. Tu código no cambió y lo puedes ver aquí.',
        confirmButtonText: 'Entendido',
        ...ESTILO_SWAL,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo reenviar el código',
        text: mensajeError(err, 'Intenta de nuevo en unos minutos.'),
        confirmButtonText: 'Entendido',
        ...ESTILO_SWAL,
      });
    } finally {
      setReenviando(false);
    }
  };

  return (
    <section className="rounded-[12px] border border-border bg-white p-4" aria-labelledby="mi-qr-titulo">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="w-40 h-40 shrink-0 self-center rounded-[10px] border border-border bg-white flex items-center justify-center overflow-hidden">
          {cargando ? (
            <div className="w-full h-full animate-pulse bg-surface-muted" role="status" aria-label="Cargando código QR" />
          ) : urlImagen ? (
            <img src={urlImagen} alt="Tu código QR de inscripción" className="w-full h-full object-contain" />
          ) : (
            <div className="px-3 text-center">
              <QrCode className="w-8 h-8 mx-auto text-ink-300" aria-hidden="true" />
              <p className="text-[11px] text-ink-600 mt-1">{errorImagen}</p>
              <button type="button" onClick={reintentar} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 underline cursor-pointer">
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 id="mi-qr-titulo" className="font-semibold text-ink-900">Tu código QR de asistencia</h3>
            <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">
              Preséntalo al ingresar a cada actividad en la que estés inscrito: es el mismo para todas. También lo
              enviamos a tu correo al confirmar la inscripción.
            </p>
          </div>

          {codigo && (
            <p className="text-[11px] text-ink-600">
              Código: <span className="font-mono text-ink-900 break-all select-all">{codigo}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {urlImagen && (
              <a href={urlImagen} download={nombreArchivoQr(eventoNombre)} className={botonSecundario}>
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Descargar
              </a>
            )}
            {codigo && (
              <button type="button" onClick={copiar} className={botonSecundario}>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                Copiar código
              </button>
            )}
            <button type="button" onClick={reenviar} disabled={reenviando} className={botonSecundario}>
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              {reenviando ? 'Enviando...' : 'Reenviar a mi correo'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
