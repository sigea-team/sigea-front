import {
  ShieldCheck,
  CalendarCheck,
  FileCheck2,
  Award,
  GraduationCap,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

/**
 * @file HomeAboutSection.jsx
 * @description Sección explicativa e institucional: ¿Qué es SIGEA?, el Programa de Ingeniería
 * de Sistemas y el respaldo de la Universidad Francisco de Paula Santander (UFPS) (Objetivo 2).
 * @module features/home/components/HomeAboutSection
 */
export default function HomeAboutSection() {
  const pilares = [
    {
      icono: ShieldCheck,
      titulo: 'Arbitraje a Doble Ciego',
      descripcion:
        'Evaluación rigurosa de propuestas por pares académicos. Los evaluadores califican mediante rúbricas cuantitativas y cualitativas preestablecidas garantizando total imparcialidad.',
    },
    {
      icono: CalendarCheck,
      titulo: 'Agenda Inteligente sin Cruces',
      descripcion:
        'Motor de programación algorítmica que distribuye las ponencias, conferencias y talleres optimizando la disponibilidad de salas y horarios sin colisiones.',
    },
    {
      icono: FileCheck2,
      titulo: 'Ciclo Editorial y Versiones',
      descripcion:
        'Flujo continuo para que los autores reciban observaciones, atiendan correcciones y sometan su versión definitiva aprobada lista para memorias o publicación.',
    },
    {
      icono: Award,
      titulo: 'Certificación Digital Verificable',
      descripcion:
        'Emisión y validación instantánea de certificados de asistencia, ponencias y organización con firmas oficiales y mecanismos de verificación institucional.',
    },
  ];

  const destacadosPrograma = [
    'Acreditación Institucional de Alta Calidad por el Ministerio de Educación Nacional.',
    'Grupos y semilleros de investigación clasificados en MinCiencias en IA, Software y Redes.',
    'Formación integral con alta tasa de empleabilidad internacional y proyectos de base tecnológica.',
    'Articulación constante con el ecosistema empresarial e industrial de la frontera colombo-venezolana.',
  ];

  return (
    <section id="que-es-sigea" className="py-16 sm:py-24 bg-surface-muted border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Bloque 1: ¿Qué es SIGEA? */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Plataforma Institucional</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl text-ink-900 tracking-tight leading-tight">
              ¿Qué es <span className="text-brand-600">SIGEA</span>?
            </h2>
            <p className="text-base text-ink-600 font-normal leading-relaxed">
              El <strong>Sistema Integral de Gestión de Eventos Académicos (SIGEA)</strong> es la plataforma
              tecnológica oficial diseñada para planificar, coordinar, arbitrar y certificar todas las actividades
              académicas, científicas y de extensión universitaria.
            </p>
            <p className="text-sm text-ink-600 font-normal leading-relaxed">
              Desde el lanzamiento del llamado a ponencias (Call for Papers) hasta la publicación de la agenda
              definitiva y la expedición de certificados, SIGEA unifica a organizadores, evaluadores, autores
              y asistentes en un único entorno ágil y transparente.
            </p>

            <div className="pt-2">
              <div className="p-4 rounded-[12px] bg-white border border-border shadow-2xs space-y-2">
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider block">
                  Propósito Institucional
                </span>
                <p className="text-xs text-ink-600 leading-normal font-normal">
                  Democratizar el acceso al conocimiento generado en la universidad, garantizando la trazabilidad
                  académica y fortaleciendo la divulgación del talento informático y científico regional.
                </p>
              </div>
            </div>
          </div>

          {/* Rejilla de los 4 Pilares */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {pilares.map((pilar) => {
              const Icono = pilar.icono;
              return (
                <div
                  key={pilar.titulo}
                  className="bg-white border border-border rounded-[16px] p-6 shadow-2xs hover:shadow-sm transition-all space-y-3"
                >
                  <div className="w-11 h-11 rounded-[8px] bg-brand-100 text-brand-600 flex items-center justify-center">
                    <Icono className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif-title text-lg text-ink-900 leading-snug">
                    {pilar.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-600 font-normal leading-relaxed">
                    {pilar.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloque 2: Programa de Ingeniería de Sistemas & UFPS Cúcuta */}
        <div className="bg-white border border-border rounded-[16px] p-8 sm:p-12 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>Respaldo Institucional</span>
            </div>
            <h3 className="font-serif-title text-2xl sm:text-3xl text-ink-900 leading-snug">
              Programa de Ingeniería de Sistemas — UFPS Cúcuta
            </h3>
            <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
              La <strong>Universidad Francisco de Paula Santander (UFPS)</strong>, fundada en 1962 en San José de Cúcuta,
              es la principal casa de estudios superiores del oriente colombiano. Su Programa de Ingeniería de Sistemas
              es referente en formación científica, innovación en ingeniería de software, arquitectura de datos y computación aplicada.
            </p>

            <ul className="space-y-2.5 pt-2">
              {destacadosPrograma.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-900 font-normal">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 bg-surface-muted border border-border rounded-[12px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                UFPS
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink-900">Campus Universitario Central</h4>
                <p className="text-xs text-ink-600">San José de Cúcuta, Norte de Santander</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-ink-600 pt-2 border-t border-border">
              <p>
                <strong className="text-ink-900 font-medium">Ubicación:</strong> Avenida Gran Colombia No. 12E-96 Barrio Colsag
              </p>
              <p>
                <strong className="text-ink-900 font-medium">Facultad:</strong> Facultad de Ingeniería
              </p>
              <p>
                <strong className="text-ink-900 font-medium">Comité de Eventos:</strong> comite.eventos.sistemas@ufps.edu.co
              </p>
            </div>

            <a
              href="https://ww2.ufps.edu.co"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-10 rounded-[8px] border border-field-border bg-white text-ink-900 font-medium text-xs hover:bg-surface-muted inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Portal Web UFPS Oficial</span>
              <ExternalLink className="w-3.5 h-3.5 text-ink-600" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
