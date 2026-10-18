import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, CheckCheck, Info, RotateCw } from 'lucide-react';
import { notificacionService } from '../../../api/notificacionService';
import { useAuthStore } from '../../../store/authStore';
import {
  INTERVALO_CONTEO_MS,
  LIMITE_PANEL,
  rutaDeNotificacion,
  textoContador,
  tiempoRelativo,
} from '../notificacionUtils';

/**
 * @file NotificacionesCampana.jsx
 * @description Campana de notificaciones del Topbar (HU-11, Criterio 2).
 * - Muestra el número de notificaciones sin leer y lo refresca cada minuto, solo mientras la pestaña
 *   está visible (Page Visibility API); al volver a la pestaña se actualiza de inmediato.
 * - Al abrirla lista las más recientes; al hacer clic en una la marca como leída y,
 *   si está relacionada con una convocatoria, lleva a su vista pública.
 * - Permite marcar todas como leídas.
 * Solo consulta el backend si hay sesión iniciada (o si se le pasa una API, p. ej. en Storybook).
 * @module features/notificaciones/components/NotificacionesCampana
 */

/**
 * @param {Object} props
 * @param {typeof notificacionService} [props.api] - Cliente de API (inyectable para Storybook o pruebas).
 * @param {boolean} [props.abiertaInicial=false] - Abre el panel al montar (útil en Storybook).
 */
export default function NotificacionesCampana({ api: apiProp, abiertaInicial = false }) {
  const api = apiProp || notificacionService;
  const token = useAuthStore((state) => state.token);
  const habilitada = Boolean(apiProp || token);
  const navigate = useNavigate();

  const [abierta, setAbierta] = useState(abiertaInicial);
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const contenedorRef = useRef(null);

  const actualizarConteo = useCallback(() => {
    if (!habilitada) return;
    api
      .contarNoLeidas()
      .then((cantidad) => setNoLeidas(cantidad))
      .catch(() => {
        // Si falla el conteo se conserva el último valor; no se interrumpe al usuario.
      });
  }, [api, habilitada]);

  const cargarLista = useCallback(() => {
    if (!habilitada) return;
    setCargando(true);
    setError(null);
    api
      .listarNotificaciones({ limite: LIMITE_PANEL })
      .then((lista) => setNotificaciones(Array.isArray(lista) ? lista : []))
      .catch(() => setError('No se pudieron cargar las notificaciones.'))
      .finally(() => setCargando(false));
  }, [api, habilitada]);

  // Conteo inicial y refresco periódico. Con la pestaña oculta no se consulta el backend
  // (evita llamadas de pestañas inactivas); al volver a ella se actualiza de inmediato.
  useEffect(() => {
    if (!habilitada) return undefined;
    const pestanaVisible = () => typeof document === 'undefined' || !document.hidden;

    if (pestanaVisible()) actualizarConteo();
    const intervalo = setInterval(() => {
      if (pestanaVisible()) actualizarConteo();
    }, INTERVALO_CONTEO_MS);
    const alCambiarVisibilidad = () => {
      if (pestanaVisible()) actualizarConteo();
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, [actualizarConteo, habilitada]);

  // Al abrir el panel se cargan las notificaciones más recientes.
  useEffect(() => {
    if (abierta) cargarLista();
  }, [abierta, cargarLista]);

  // Cierre con clic fuera del panel o con Escape.
  useEffect(() => {
    if (!abierta) return undefined;
    const alClicFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierta(false);
    };
    const alPresionarTecla = (e) => {
      if (e.key === 'Escape') setAbierta(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alPresionarTecla);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alPresionarTecla);
    };
  }, [abierta]);

  const abrirNotificacion = async (notificacion) => {
    if (!notificacion.leida) {
      try {
        await api.marcarComoLeida(notificacion.id);
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n))
        );
        setNoLeidas((prev) => Math.max(0, prev - 1));
      } catch {
        // Si no se pudo marcar, igual se permite navegar al recurso.
      }
    }
    const ruta = rutaDeNotificacion(notificacion);
    if (ruta) {
      setAbierta(false);
      navigate(ruta);
    }
  };

  const marcarTodas = async () => {
    try {
      await api.marcarTodasComoLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {
      setError('No se pudieron marcar las notificaciones como leídas.');
    }
  };

  const etiquetaBoton = noLeidas > 0 ? `Notificaciones (${noLeidas} sin leer)` : 'Notificaciones';

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="p-2 rounded-full text-[#5b5f66] hover:bg-[#f7f7f8] hover:text-[#1f2023] transition-colors relative cursor-pointer"
        title={etiquetaBoton}
        aria-label={etiquetaBoton}
        aria-haspopup="true"
        aria-expanded={abierta}
      >
        <Bell className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#a6192e] text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {textoContador(noLeidas)}
          </span>
        )}
      </button>

      {abierta && (
        <div
          className="absolute right-0 mt-2 w-[380px] bg-white rounded-[16px] border border-[#e5e7ea] shadow-2xl z-40 overflow-hidden"
          role="dialog"
          aria-label="Notificaciones"
        >
          <div className="px-4 py-3 border-b border-[#e5e7ea] flex items-center justify-between bg-[#f7f7f8]/50">
            <div>
              <p className="text-sm font-semibold text-[#1f2023]">Notificaciones</p>
              <p className="text-xs text-[#5b5f66]">
                {noLeidas > 0 ? `${noLeidas} sin leer` : 'Estás al día'}
              </p>
            </div>
            <button
              type="button"
              onClick={marcarTodas}
              disabled={noLeidas === 0}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#a6192e] hover:underline disabled:text-[#9ca0a6] disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como leídas
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {cargando && notificaciones.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-[#5b5f66]" role="status">
                Cargando notificaciones...
              </p>
            )}

            {error && (
              <div className="m-3 p-3 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#a6192e] shrink-0" />
                  {error}
                </span>
                <button
                  type="button"
                  onClick={cargarLista}
                  className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  Reintentar
                </button>
              </div>
            )}

            {!cargando && !error && notificaciones.length === 0 && (
              <div className="px-4 py-10 text-center">
                <Bell className="w-6 h-6 text-[#9ca0a6] mx-auto" />
                <p className="text-sm font-semibold text-[#1f2023] mt-2">No tienes notificaciones</p>
                <p className="text-xs text-[#5b5f66] mt-1">Aquí verás los avisos de convocatorias y eventos.</p>
              </div>
            )}

            <ul className="divide-y divide-[#e5e7ea]">
              {notificaciones.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrirNotificacion(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 transition-colors cursor-pointer hover:bg-[#f7f7f8] ${
                      n.leida ? '' : 'bg-[#fdecec]/40'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        n.leida ? 'bg-[#f7f7f8] text-[#9ca0a6]' : 'bg-[#fdecec] text-[#a6192e]'
                      }`}
                    >
                      <CalendarClock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            n.leida ? 'text-[#5b5f66] font-medium' : 'text-[#1f2023] font-semibold'
                          }`}
                        >
                          {n.titulo}
                        </p>
                        {!n.leida && (
                          <span className="w-2 h-2 rounded-full bg-[#a6192e] shrink-0 mt-1.5" aria-label="Sin leer"></span>
                        )}
                      </div>
                      <p className="text-xs text-[#5b5f66] mt-1 line-clamp-3">{n.mensaje}</p>
                      <p className="text-[11px] text-[#9ca0a6] mt-1">{tiempoRelativo(n.fechaCreacion)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

NotificacionesCampana.propTypes = {
  api: PropTypes.shape({
    listarNotificaciones: PropTypes.func.isRequired,
    contarNoLeidas: PropTypes.func.isRequired,
    marcarComoLeida: PropTypes.func.isRequired,
    marcarTodasComoLeidas: PropTypes.func.isRequired,
  }),
  abiertaInicial: PropTypes.bool,
};
