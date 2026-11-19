import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Globe,
  Building,
  Layers,
  MapPin,
  Mic,
  FileText,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Info,
  RotateCw,
  LayoutDashboard,
  LogIn,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import Footer from '../components/ui/Footer';
import UfpsLogo from '../components/ui/UfpsLogo';
import { eventoService } from '../api/eventoService';
import { convocatoriaService } from '../api/convocatoriaService';
import { useAuthStore } from '../store/authStore';
import {
  EVENTOS_BASE_INSTITUCIONALES,
  formatearRangoFechas,
  formatearFecha,
  normalizarModalidad,
} from '../features/home/homeUtils';
import { extraerError } from '../features/eventos/eventoUtils';

/**
 * @file EventoDetallePage.jsx
 * @description Vista pública con la información completa de un evento académico.
 * Permite a cualquier usuario consultar la descripción detallada, fechas, líneas temáticas,
 * y acceder directamente a la agenda pública, lista de conferencistas y convocatorias abiertas.
 * @module pages/EventoDetallePage
 */
export default function EventoDetallePage({
  api = eventoService,
  apiConvocatorias = convocatoriaService,
  eventoId: eventoIdProp,
}) {
  const params = useParams();
  const location = useLocation();
  const eventoId = eventoIdProp ?? params.eventoId;
  const conSesion = Boolean(useAuthStore((state) => state.token));

  // Tomamos datos del state de navegación para renderizado instantáneo
  const eventoPrevio = location.state?.evento;
  const eventoInicial =
    eventoPrevio && String(eventoPrevio.id) === String(eventoId)
      ? eventoPrevio
      : EVENTOS_BASE_INSTITUCIONALES.find((e) => String(e.id) === String(eventoId)) || null;

  const [evento, setEvento] = useState(eventoInicial);
  const [convocatorias, setConvocatorias] = useState(eventoInicial?.convocatorias || []);
  const [cargando, setCargando] = useState(!eventoInicial);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargarInformacion() {
      setCargando(!evento);
      setError(null);

      try {
        let eventoCargado = null;
        if (api?.obtenerEvento) {
          try {
            eventoCargado = await api.obtenerEvento(eventoId);
          } catch (err) {
            // Si el backend responde 404 o falla, buscamos en los institucionales base
            const base = EVENTOS_BASE_INSTITUCIONALES.find((e) => String(e.id) === String(eventoId));
            if (base) {
              eventoCargado = base;
            } else if (eventoInicial) {
              eventoCargado = eventoInicial;
            } else {
              throw err;
            }
          }
        } else if (eventoInicial) {
          eventoCargado = eventoInicial;
        }

        if (!activo) return;
        setEvento(eventoCargado);

        // Cargar convocatorias vinculadas si el cliente está disponible
        if (apiConvocatorias?.listarConvocatoriasPublicadas) {
          try {
            const todasConvs = await apiConvocatorias.listarConvocatoriasPublicadas();
            if (activo && Array.isArray(todasConvs)) {
              const asociadas = todasConvs.filter((c) => String(c.eventoId) === String(eventoId));
              setConvocatorias(asociadas);
            }
          } catch (convErr) {
            console.warn('[EventoDetallePage] No se pudieron cargar convocatorias:', convErr?.message);
          }
        }
      } catch (err) {
        if (!activo) return;
        const { status, mensaje } = extraerError(err);
        setError(status === 404 ? 'El evento solicitado no fue encontrado o no está publicado.' : mensaje);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarInformacion();

    return () => {
      activo = false;
    };
  }, [api, apiConvocatorias, eventoId, version]);

  const modalidadNombre = (evento?.modalidad || '').toLowerCase();
  const esVirtual = modalidadNombre === 'virtual';
  const esHibrido = modalidadNombre.includes('hibrid') || modalidadNombre.includes('híbrid');

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface-muted text-ink-900 font-sans antialiased">
      {/* Barra de cabecera pública */}
      <header className="h-16 px-4 sm:px-8 bg-white border-b border-border flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-2xs">
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-[8px]">
          <UfpsLogo
            variante="vertical"
            className="h-10 w-auto max-w-[40px] object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="leading-tight">
            <p className="text-base font-bold text-brand-600">SIGEA</p>
            <p className="text-[11px] text-ink-600 hidden sm:block">Sistema Integral de Gestión de Eventos Académicos</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/#eventos"
            className="h-9 px-3 rounded-[8px] border border-border bg-white text-xs sm:text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-surface-muted inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Todos los eventos</span>
            <span className="sm:hidden">Eventos</span>
          </Link>

          <Link
            to={conSesion ? '/dashboard' : '/login'}
            className="h-9 px-3.5 rounded-[8px] bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            {conSesion ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{conSesion ? 'Mi Panel' : 'Iniciar sesión'}</span>
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Enlace de retroceso */}
        <div>
          <Link
            to="/#eventos"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la programación de eventos</span>
          </Link>
        </div>

        {/* Estado de carga */}
        {cargando && !evento && (
          <div className="bg-white border border-border rounded-[16px] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-ink-600">Cargando la información detallada del evento...</p>
          </div>
        )}

        {/* Estado de error */}
        {error && !evento && (
          <div className="p-6 rounded-[16px] bg-white border border-red-200 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-ink-900">No se pudo cargar el evento</h2>
              <p className="text-sm text-ink-600 max-w-md mx-auto">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setVersion((v) => v + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* Vista con la información completa */}
        {evento && (
          <div className="space-y-8">
            {/* Cabecera / Hero del evento */}
            <div className="bg-white border border-border rounded-[16px] p-6 sm:p-8 shadow-2xs space-y-6">
              {/* Badges de clasificación */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      esVirtual
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : esHibrido
                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    {esVirtual ? (
                      <Globe className="w-3.5 h-3.5" />
                    ) : esHibrido ? (
                      <Layers className="w-3.5 h-3.5" />
                    ) : (
                      <Building className="w-3.5 h-3.5" />
                    )}
                    <span>{evento.modalidadTexto || normalizarModalidad(evento.modalidad)}</span>
                  </span>

                  <span className="text-xs font-medium text-ink-600 bg-surface-muted px-2.5 py-1 rounded-[6px] border border-border">
                    Semestre {evento.semestre || '2026-2'}
                  </span>

                  {evento.tipo && (
                    <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-[6px]">
                      {evento.tipo}
                    </span>
                  )}
                </div>

                {evento.destacado && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-100 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Evento Institucional Destacado</span>
                  </span>
                )}
              </div>

              {/* Título principal */}
              <div className="space-y-3">
                <h1 className="font-serif-title text-3xl sm:text-4xl text-ink-900 leading-tight">
                  {evento.nombre}
                </h1>

                {/* Fechas y ubicación */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-1 text-sm text-ink-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="font-medium text-ink-900">
                      {formatearRangoFechas(evento.fechaInicio, evento.fechaFin)}
                    </span>
                  </div>

                  {evento.lugar && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-ink-600 shrink-0" />
                      <span>{evento.lugar}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción completa */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-900">
                  Descripción del Evento
                </h2>
                <p className="text-sm sm:text-base text-ink-600 leading-relaxed font-normal whitespace-pre-line">
                  {evento.descripcion || 'Sin descripción detallada registrada para este evento.'}
                </p>
              </div>

              {/* Objetivo general si existe */}
              {evento.objetivo && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-900">
                    Objetivo
                  </h2>
                  <p className="text-sm sm:text-base text-ink-600 leading-relaxed font-normal">
                    {evento.objetivo}
                  </p>
                </div>
              )}

              {/* Líneas Temáticas */}
              {evento.lineasTematicas && evento.lineasTematicas.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-border">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-900">
                    Líneas Temáticas & Ejes de Conocimiento
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {evento.lineasTematicas.map((linea) => (
                      <span
                        key={linea}
                        className="text-xs font-medium text-ink-900 bg-surface-muted border border-border px-3 py-1 rounded-[6px]"
                      >
                        #{linea}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accesos directos a la Agenda y Conferencistas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bloque: Agenda y Programación Oficial */}
              <div className="bg-white border border-border rounded-[16px] p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-brand-600/40 transition-colors">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-[10px] bg-brand-100 text-brand-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif-title text-xl text-ink-900">
                    Agenda & Horarios Oficiales
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-normal">
                    Consulta la programación completa organizada por día, bloque horario, salas y enlaces de conexión si es modalidad virtual.
                  </p>
                </div>

                <Link
                  to={`/eventos/${evento.id}/agenda-publica`}
                  className="h-10 px-4 rounded-[8px] bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Ver Agenda Pública</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Bloque: Conferencistas y Ponentes */}
              <div className="bg-white border border-border rounded-[16px] p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-brand-600/40 transition-colors">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-[10px] bg-brand-100 text-brand-600 flex items-center justify-center">
                    <Mic className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif-title text-xl text-ink-900">
                    Conferencistas Invitados
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-normal">
                    Conoce el perfil, biografía, filiación académica y trayectoria de los expertos nacionales e internacionales ponentes del evento.
                  </p>
                </div>

                <Link
                  to={`/eventos/${evento.id}/conferencistas-publicos`}
                  className="h-10 px-4 rounded-[8px] border border-field-border bg-white hover:bg-surface-muted text-ink-900 font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Mic className="w-4 h-4 text-brand-600" />
                  <span>Ver Conferencistas</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Bloque de Convocatorias Abiertas (Call for Papers) asociadas */}
            {convocatorias.length > 0 && (
              <section className="bg-white border border-border rounded-[16px] p-6 sm:p-8 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider">
                      <FileText className="w-4 h-4" />
                      <span>Call for Papers & Ponencias</span>
                    </div>
                    <h2 className="font-serif-title text-2xl text-ink-900 mt-1">
                      Convocatorias Académicas Asociadas
                    </h2>
                  </div>
                  <Link
                    to="/convocatorias-publicas"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 underline self-start sm:self-auto"
                  >
                    Ver todas las convocatorias
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {convocatorias.map((conv) => (
                    <article
                      key={conv.id}
                      className="border border-border rounded-[12px] p-5 space-y-3 bg-surface-muted/40 hover:bg-surface-muted transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Recepción de Ponencias</span>
                        </div>
                        <h3 className="font-serif-title text-lg text-ink-900">
                          {conv.titulo}
                        </h3>
                        <p className="text-xs text-ink-600 line-clamp-2">
                          {conv.descripcion || 'Postula tu trabajo de investigación a esta convocatoria.'}
                        </p>
                        {conv.fechaCierre && (
                          <p className="text-xs text-ink-600 font-medium">
                            Cierre: <span className="text-brand-700 font-semibold">{formatearFecha(conv.fechaCierre, { incluirHora: true })}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <Link
                          to={`/convocatorias-publicas?convocatoria=${conv.id}`}
                          className="w-full h-9 px-3 rounded-[8px] bg-brand-600 text-white font-medium text-xs inline-flex items-center justify-center gap-1.5 hover:bg-brand-700 transition-colors"
                        >
                          <span>Postular trabajo a esta convocatoria</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Pie de página institucional */}
      <Footer compacto />
    </div>
  );
}

EventoDetallePage.propTypes = {
  api: PropTypes.shape({
    obtenerEvento: PropTypes.func,
  }),
  apiConvocatorias: PropTypes.shape({
    listarConvocatoriasPublicadas: PropTypes.func,
  }),
  eventoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
