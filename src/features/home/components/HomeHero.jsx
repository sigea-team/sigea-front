import { Link } from 'react-router-dom';
import { CalendarDays, FileText, ArrowRight, ShieldCheck, Award, Users, BookOpen } from 'lucide-react';

/**
 * @file HomeHero.jsx
 * @description Sección de cabecera principal de impacto (Hero Section) para la vista pública de SIGEA.
 * Presenta el sistema, el programa de Ingeniería de Sistemas UFPS y las acciones inmediatas para el visitante.
 * @module features/home/components/HomeHero
 */
export default function HomeHero() {
  const metricas = [
    {
      icono: CalendarDays,
      valor: '+15',
      etiqueta: 'Eventos & Ediciones',
      detalle: 'Congresos, simposios y hackatones anuales',
    },
    {
      icono: ShieldCheck,
      valor: '100%',
      etiqueta: 'Evaluación a Doble Ciego',
      detalle: 'Rigor científico con rúbricas cuantitativas',
    },
    {
      icono: Users,
      valor: '+500',
      etiqueta: 'Investigadores y Autores',
      detalle: 'Comunidad universitaria conectada',
    },
    {
      icono: Award,
      valor: 'Digital',
      etiqueta: 'Certificación Verificable',
      detalle: 'Constancias oficiales con código institucional',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white border-b border-border min-h-screen flex flex-col justify-center py-16 sm:py-20 lg:py-24">
      {/* Elementos decorativos sutiles institucionales */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-brand-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="font-serif-title text-4xl sm:text-5xl lg:text-6xl text-ink-900 leading-[1.15] tracking-tight">
            Sistema Integral de Gestión de{' '}
            <span className="text-brand-600">Eventos Académicos</span>
          </h1>

          {/* Subtítulo Sans */}
          <p className="text-base sm:text-lg lg:text-xl text-ink-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Plataforma oficial del <strong>Programa de Ingeniería de Sistemas</strong> para la divulgación científica,
            gestión de congresos, simposios y hackatones universitarias. Consulta programaciones,
            participa en conferencias y postula artículos a convocatorias abiertas.
          </p>

          {/* Botones de acción directa (CTAs) */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <a
              href="#eventos"
              className="h-12 px-6 rounded-[8px] bg-brand-600 text-white hover:bg-brand-700 font-medium text-sm sm:text-base inline-flex items-center gap-2.5 shadow-sm transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <CalendarDays className="w-5 h-5" />
              <span>Ver Eventos y Programación</span>
            </a>

            <a
              href="#convocatorias"
              className="h-12 px-6 rounded-[8px] bg-white border border-field-border text-ink-900 hover:bg-surface-muted font-medium text-sm sm:text-base inline-flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <FileText className="w-5 h-5 text-brand-600" />
              <span>Convocatorias Abiertas</span>
            </a>

            <Link
              to="/registro"
              className="h-12 px-6 rounded-[8px] bg-brand-100 text-brand-700 hover:bg-brand-100/80 font-medium text-sm sm:text-base inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <span>Crear cuenta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Subnota institucional */}
          <p className="text-xs text-ink-600/80 flex items-center justify-center gap-2 pt-2">
            <BookOpen className="w-3.5 h-3.5 text-brand-600" />
            <span>Facultad de Ingeniería · Acreditación Institucional de Alta Calidad</span>
          </p>
        </div>

        {/* Tarjetas de Métricas e Indicadores Clave */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metricas.map((metrica) => {
            const Icono = metrica.icono;
            return (
              <div
                key={metrica.etiqueta}
                className="bg-white border border-border rounded-[16px] p-6 shadow-2xs hover:shadow-sm transition-shadow flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-[8px] bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                  <Icono className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ink-900 tracking-tight">{metrica.valor}</div>
                  <h3 className="text-sm font-semibold text-ink-900 mt-0.5">{metrica.etiqueta}</h3>
                  <p className="text-xs text-ink-600 mt-1 leading-snug">{metrica.detalle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
