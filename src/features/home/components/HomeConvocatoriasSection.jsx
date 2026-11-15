import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatearFecha } from '../homeUtils';
import { estadoRecepcion } from '../../convocatorias/convocatoriaUtils';
import { useAuthStore } from '../../../store/authStore';

/**
 * @file HomeConvocatoriasSection.jsx
 * @description Sección de Convocatorias Abiertas (Call for Papers) en la Home de SIGEA (Objetivo 3).
 * Invita a autores, investigadores y estudiantes a postular trabajos y ponencias.
 * @module features/home/components/HomeConvocatoriasSection
 */
export default function HomeConvocatoriasSection({ convocatorias = [], cargando = false }) {
  const conSesion = Boolean(useAuthStore((state) => state.token));

  // Filtrar solo convocatorias con recepción abierta o próximas
  const convocatoriasVigentes = convocatorias.filter((c) => {
    const estado = estadoRecepcion(c);
    return estado === 'abierta' || estado === 'proxima';
  });

  return (
    <section id="convocatorias" className="py-16 sm:py-20 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Call for Papers & Ponencias</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl text-ink-900 tracking-tight">
              Convocatorias Académicas Abiertas
            </h2>
            <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
              Postula tus artículos científicos, proyectos de investigación formativa y experiencias tecnológicas.
              Las propuestas son evaluadas a doble ciego por el comité evaluador bajo rúbricas institucionales.
            </p>
          </div>

          <Link
            to="/convocatorias-publicas"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 group self-start md:self-auto shrink-0"
          >
            <span>Ver todas las convocatorias</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Contenido: Listado o Estados de Carga / Vacío */}
        {cargando ? (
          <div className="bg-surface-muted border border-border rounded-[16px] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-ink-600">Cargando convocatorias abiertas del backend...</p>
          </div>
        ) : convocatoriasVigentes.length === 0 ? (
          <div className="bg-surface-muted border border-border rounded-[16px] p-10 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-ink-900">No hay convocatorias con recepción abierta en este momento</h3>
              <p className="text-sm text-ink-600 max-w-lg mx-auto">
                Las fechas límite anteriores han concluido o el comité está preparando nuevas aperturas para el próximo periodo.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/convocatorias-publicas"
                className="h-10 px-5 rounded-[8px] bg-brand-600 text-white font-medium text-sm inline-flex items-center gap-2 hover:bg-brand-700 transition-colors"
              >
                <span>Consultar histórico de convocatorias</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {convocatoriasVigentes.slice(0, 6).map((conv) => {
              const recepcion = estadoRecepcion(conv);
              const estaAbierta = recepcion === 'abierta';

              return (
                <div
                  key={conv.id}
                  className="bg-white border border-border hover:border-brand-600/40 rounded-[16px] p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Badge de estado de recepción */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          estaAbierta
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {estaAbierta ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{estaAbierta ? 'Recepción Abierta' : 'Apertura Próxima'}</span>
                      </span>

                      <span className="text-[11px] text-ink-600 font-medium truncate max-w-[140px]">
                        {conv.eventoNombre || 'Evento UFPS'}
                      </span>
                    </div>

                    {/* Título de la convocatoria */}
                    <h3 className="font-serif-title text-lg sm:text-xl text-ink-900 group-hover:text-brand-600 transition-colors leading-snug">
                      {conv.titulo}
                    </h3>

                    {/* Descripción resumida */}
                    <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-normal line-clamp-3">
                      {conv.descripcion || 'Convocatoria académica oficial para recepción de propuestas y ponencias.'}
                    </p>

                    {/* Fechas de cronograma */}
                    <div className="space-y-1.5 pt-2 border-t border-border/80 text-xs text-ink-600">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-600">Apertura:</span>
                        <span className="font-medium text-ink-900">
                          {formatearFecha(conv.fechaApertura)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-600 font-medium text-brand-700">Cierre de recepción:</span>
                        <span className="font-semibold text-brand-600">
                          {formatearFecha(conv.fechaCierre, { incluirHora: true })}
                        </span>
                      </div>
                    </div>

                    {/* Requisitos breves */}
                    {conv.requisitos && (
                      <div className="p-2.5 rounded-[8px] bg-surface-muted border border-border text-xs text-ink-600">
                        <div className="flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                          <p className="line-clamp-2 leading-tight">
                            <strong className="text-ink-900 font-medium">Requisitos:</strong> {conv.requisitos}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones de la convocatoria */}
                  <div className="pt-3 border-t border-border flex items-center gap-2">
                    <Link
                      to={conSesion ? '/mis-propuestas' : `/registro?redirect=/convocatorias-publicas`}
                      className="flex-1 h-10 px-4 rounded-[8px] bg-brand-600 text-white hover:bg-brand-700 font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{conSesion ? 'Enviar Propuesta' : 'Postular Trabajo'}</span>
                    </Link>

                    <Link
                      to={`/convocatorias-publicas?convocatoria=${conv.id}`}
                      className="h-10 px-3.5 rounded-[8px] border border-field-border bg-white text-ink-900 hover:bg-surface-muted font-medium text-xs sm:text-sm inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      title="Ver requisitos completos y bases"
                    >
                      Bases
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Banner de invitación para autores */}
        <div className="bg-gradient-to-r from-brand-100/50 to-white border border-brand-100 rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Publicación de Memorias y Revistas Indexadas</span>
            </div>
            <h3 className="font-serif-title text-xl text-ink-900">
              ¿Deseas someter tu artículo de investigación o trabajo de grado?
            </h3>
            <p className="text-sm text-ink-600 max-w-2xl font-normal">
              Regístrate en SIGEA como Autor, completa los metadatos de tu propuesta y sube el PDF de tu manuscrito.
              Podrás interactuar con los evaluadores y recibir observaciones para la versión definitiva.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/registro"
              className="h-11 px-6 rounded-[8px] bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors shadow-xs inline-flex items-center gap-2"
            >
              <span>Registrarse como Autor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
