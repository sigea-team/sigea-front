import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

/**
 * @file AvisoBloqueo.jsx
 * @description Aviso de cuenta bloqueada temporalmente por intentos fallidos (HU-01, Criterio 3).
 * Muestra el mensaje del backend y una cuenta regresiva hasta el desbloqueo. Cuando el
 * tiempo termina invoca `onFinalizado` para que el formulario vuelva a habilitarse.
 * @module features/auth/components/AvisoBloqueo
 */

/** Convierte milisegundos restantes en "mm:ss". */
function formatearRestante(ms) {
  const totalSeg = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

/**
 * @param {Object} props
 * @param {string} props.mensaje      - Mensaje devuelto por el backend.
 * @param {number} props.desbloqueoEn - Instante del desbloqueo, en milisegundos (Date.now()).
 * @param {function(): void} [props.onFinalizado]
 */
export default function AvisoBloqueo({ mensaje, desbloqueoEn, onFinalizado }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const restante = desbloqueoEn - ahora;

  useEffect(() => {
    const intervalo = setInterval(() => {
      const t = Date.now();
      setAhora(t);
      if (t >= desbloqueoEn) {
        clearInterval(intervalo);
        onFinalizado?.();
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [desbloqueoEn, onFinalizado]);

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-sm rounded-[8px] px-4 py-3"
    >
      <Lock className="w-5 h-5 text-[#a6192e] shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p>{mensaje}</p>
        {restante > 0 && (
          <p className="text-xs font-semibold">
            Podrás intentarlo de nuevo en{' '}
            <span className="font-mono text-sm" aria-live="polite">
              {formatearRestante(restante)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
