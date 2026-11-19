import { useEffect, useId, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

/**
 * @file EscanerQr.jsx
 * @description HU-24 (Criterio 2): lector de QR con la cámara del dispositivo, basado en `html5-qrcode`.
 * La librería se carga solo cuando el organizador activa la cámara. Cada lectura se entrega a `onLectura`;
 * quien lo usa decide qué hacer con las lecturas repetidas.
 * La cámara del navegador solo funciona en HTTPS o en localhost.
 * @module features/asistencia/components/EscanerQr
 */

/** Traduce los errores de la cámara a un mensaje para el organizador. */
function mensajeCamara(err) {
  const texto = String(err?.name || '') + ' ' + String(err?.message || err || '');
  if (/NotAllowed|Permission/i.test(texto)) {
    return 'El navegador no tiene permiso para usar la cámara. Autorízalo en la barra de direcciones y vuelve a intentarlo.';
  }
  if (/NotFound|Requested device not found|no camera/i.test(texto)) return 'No se encontró una cámara en este dispositivo.';
  if (/NotReadable|in use|Could not start/i.test(texto)) return 'La cámara está ocupada por otra aplicación.';
  if (/Failed to fetch dynamically imported module|Cannot find module|html5-qrcode/i.test(texto)) {
    return 'No se pudo cargar el lector de QR. Usa el campo de código mientras tanto.';
  }
  return 'No se pudo iniciar la cámara. Usa el campo de código mientras tanto.';
}

/**
 * @param {Object} props
 * @param {function(string): void} props.onLectura - Recibe el texto de cada QR leído.
 */
export default function EscanerQr({ onLectura }) {
  const idContenedor = `lector-qr-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const lectorRef = useRef(null);
  const onLecturaRef = useRef(onLectura);
  const [estado, setEstado] = useState('inactivo'); // 'inactivo' | 'iniciando' | 'activo' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    onLecturaRef.current = onLectura;
  }, [onLectura]);

  // Al desmontar se libera la cámara.
  useEffect(
    () => () => {
      const lector = lectorRef.current;
      lectorRef.current = null;
      if (lector) {
        Promise.resolve()
          .then(() => lector.stop())
          .catch(() => {})
          .finally(() => {
            try {
              lector.clear();
            } catch {
              // El contenedor ya no existe.
            }
          });
      }
    },
    []
  );

  const iniciar = async () => {
    setError(null);
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setEstado('error');
      setError('La cámara solo funciona si SIGEA se abre con HTTPS (o en localhost).');
      return;
    }
    setEstado('iniciando');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const lector = new Html5Qrcode(idContenedor, { verbose: false });
      lectorRef.current = lector;
      await lector.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (texto) => onLecturaRef.current?.(texto),
        () => {
          // Fotogramas sin QR: se ignoran.
        }
      );
      setEstado('activo');
    } catch (err) {
      const lector = lectorRef.current;
      lectorRef.current = null;
      try {
        lector?.clear();
      } catch {
        // Nada que limpiar.
      }
      setEstado('error');
      setError(mensajeCamara(err));
    }
  };

  const detener = async () => {
    const lector = lectorRef.current;
    lectorRef.current = null;
    if (lector) {
      try {
        await lector.stop();
      } catch {
        // Ya estaba detenido.
      }
      try {
        lector.clear();
      } catch {
        // Nada que limpiar.
      }
    }
    setEstado('inactivo');
  };

  const activo = estado === 'activo';

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-[12px] overflow-hidden bg-ink-900">
        {/* html5-qrcode inserta aquí el video: React no debe tener hijos en este nodo */}
        <div id={idContenedor} className="w-full h-full [&_video]:object-cover [&_video]:w-full! [&_video]:h-full!" />
        {!activo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-white/80">
            <Camera className="w-8 h-8" aria-hidden="true" />
            <p className="text-xs">{estado === 'iniciando' ? 'Iniciando cámara...' : 'Cámara apagada'}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-brand-700 text-center" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-center">
        {activo ? (
          <button
            type="button"
            onClick={detener}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-field-border bg-white text-xs font-medium text-ink-900 hover:bg-surface-muted cursor-pointer"
          >
            <CameraOff className="w-3.5 h-3.5" aria-hidden="true" />
            Detener cámara
          </button>
        ) : (
          <button
            type="button"
            onClick={iniciar}
            disabled={estado === 'iniciando'}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 cursor-pointer disabled:opacity-60"
          >
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            {estado === 'error' ? 'Reintentar cámara' : 'Activar cámara'}
          </button>
        )}
      </div>
    </div>
  );
}
