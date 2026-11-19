import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import HomeEventoCard from './HomeEventoCard';

/**
 * @file HomeEventosGallery.jsx
 * @description Galería / Carrusel interactivo para mostrar eventos académicos en la homepage.
 * Incluye avance automático temporizado, pausa al interactuar/hover, flechas de navegación
 * izquierda y derecha, soporte para gestos táctiles (swipe) y puntos indicadores de posición.
 * @module features/home/components/HomeEventosGallery
 */
export default function HomeEventosGallery({ eventos = [], onVerDetalle }) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [estaPausadoManual, setEstaPausadoManual] = useState(false);
  const [enHover, setEnHover] = useState(false);
  const [tarjetasVisibles, setTarjetasVisibles] = useState(() => {
    if (typeof window === 'undefined') return 2;
    return window.innerWidth < 768 ? 1 : 2;
  });

  const touchStartX = useRef(null);
  const TIEMPO_AUTOPLAY = 4500; // 4.5 segundos por transición

  // Ajuste reactivo del número de tarjetas visibles según el viewport
  useEffect(() => {
    const handleResize = () => {
      setTarjetasVisibles(window.innerWidth < 768 ? 1 : 2);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const total = eventos.length;
  const maxIndice = Math.max(0, total - tarjetasVisibles);

  // Reiniciar el índice si la lista de eventos filtrados cambia
  useEffect(() => {
    setIndiceActual(0);
  }, [eventos]);

  // Si por cambio de tamaño o filtro el índice queda fuera de rango, corregirlo
  useEffect(() => {
    if (indiceActual > maxIndice) {
      setIndiceActual(maxIndice);
    }
  }, [indiceActual, maxIndice]);

  const avanzar = useCallback(() => {
    if (total <= tarjetasVisibles) return;
    setIndiceActual((prev) => (prev >= maxIndice ? 0 : prev + 1));
  }, [total, tarjetasVisibles, maxIndice]);

  const retroceder = useCallback(() => {
    if (total <= tarjetasVisibles) return;
    setIndiceActual((prev) => (prev <= 0 ? maxIndice : prev - 1));
  }, [total, tarjetasVisibles, maxIndice]);

  // Temporizador para avance automático (se suspende en hover o pausa manual)
  useEffect(() => {
    if (total <= tarjetasVisibles || estaPausadoManual || enHover) {
      return;
    }

    const timer = setInterval(() => {
      avanzar();
    }, TIEMPO_AUTOPLAY);

    return () => clearInterval(timer);
  }, [total, tarjetasVisibles, estaPausadoManual, enHover, avanzar]);

  // Soporte para gestos táctiles (swipe)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        avanzar();
      } else {
        retroceder();
      }
    }
    touchStartX.current = null;
  };

  if (!eventos || eventos.length === 0) return null;

  const hayMultiples = total > tarjetasVisibles;
  const porcentajeDesplazamiento = indiceActual * (100 / tarjetasVisibles);

  // Cantidad de posiciones / páginas para los puntos indicadores
  const numeroPuntos = maxIndice + 1;

  return (
    <div
      className="relative w-full space-y-4"
      onMouseEnter={() => setEnHover(true)}
      onMouseLeave={() => setEnHover(false)}
      onFocus={() => setEnHover(true)}
      onBlur={() => setEnHover(false)}
    >
      {/* Contenedor del Carrusel con Máscara de Desborde */}
      <div
        className="overflow-hidden w-full py-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out -mx-3"
          style={{
            transform: `translateX(-${porcentajeDesplazamiento}%)`,
          }}
        >
          {eventos.map((evento) => (
            <div
              key={evento.id}
              className="shrink-0 px-3 flex flex-col"
              style={{ width: `${100 / tarjetasVisibles}%` }}
            >
              <HomeEventoCard evento={evento} onVerDetalle={onVerDetalle} />
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Controles Inferior: Contador a la izquierda, Indicador de avance en la mitad, Botones en la esquina derecha */}
      {hayMultiples && (
        <div className="relative flex items-center justify-between gap-3 pt-3">
          {/* Izquierda: Contador informativo */}
          <div className="text-xs text-ink-600 font-medium">
            <span className="hidden sm:inline">Mostrando </span>
            {indiceActual + 1}
            {tarjetasVisibles > 1 && total > 1 ? ` - ${Math.min(indiceActual + tarjetasVisibles, total)}` : ''} de {total}
          </div>

          {/* Mitad: Indicadores de avance de la galería (dots) y pausa */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {/* Puntos de navegación directa */}
            <div className="flex items-center gap-1.5 px-1">
              {Array.from({ length: numeroPuntos }).map((_, idx) => {
                const activo = idx === indiceActual;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setIndiceActual(idx)}
                    aria-label={`Ir al grupo de eventos ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                      activo
                        ? 'w-7 h-2 bg-brand-600 shadow-2xs'
                        : 'w-2 h-2 bg-border hover:bg-ink-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Botón para alternar pausa/reanudación del avance automático */}
            <button
              type="button"
              onClick={() => setEstaPausadoManual((prev) => !prev)}
              aria-label={estaPausadoManual ? 'Reanudar avance automático' : 'Pausar avance automático'}
              title={estaPausadoManual ? 'Reanudar avance automático' : 'Pausar avance automático'}
              className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                estaPausadoManual
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-ink-600 border-border hover:text-ink-900 hover:bg-surface-muted'
              }`}
            >
              {estaPausadoManual ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
            </button>
          </div>

          {/* Esquina inferior derecha: Dos pequeños botones para pasar eventos */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={retroceder}
              aria-label="Ver evento anterior"
              title="Ver evento anterior"
              className="w-8 h-8 rounded-full border border-border bg-white text-ink-900 flex items-center justify-center hover:bg-surface-muted hover:border-brand-600/50 transition-colors shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={avanzar}
              aria-label="Ver siguiente evento"
              title="Ver siguiente evento"
              className="w-8 h-8 rounded-full border border-border bg-white text-ink-900 flex items-center justify-center hover:bg-surface-muted hover:border-brand-600/50 transition-colors shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

HomeEventosGallery.propTypes = {
  eventos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      nombre: PropTypes.string.isRequired,
    })
  ).isRequired,
  onVerDetalle: PropTypes.func,
};
