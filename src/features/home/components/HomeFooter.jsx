import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

/**
 * @file HomeFooter.jsx
 * @description Pie de página institucional público completo de SIGEA y la UFPS Cúcuta.
 * @module features/home/components/HomeFooter
 */
export default function HomeFooter() {
  const anio = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border text-ink-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Columna 1: Marca institucional */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-sm shrink-0">
                UFPS
              </div>
              <div className="leading-tight">
                <span className="font-serif-title text-xl font-bold text-brand-600 tracking-tight">SIGEA</span>
                <p className="text-xs text-ink-600">Sistema Integral de Gestión de Eventos Académicos</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-ink-600 font-normal">
              Plataforma oficial desarrollada para la divulgación científica, gestión de congresos y vinculación con la comunidad universitaria del Programa de Ingeniería de Sistemas.
            </p>

            <div className="pt-2 text-xs text-ink-600 space-y-1">
              <p className="font-semibold text-ink-900">Programa de Ingeniería de Sistemas</p>
              <p>Facultad de Ingeniería · UFPS Cúcuta</p>
              <p>Acreditación Institucional de Alta Calidad</p>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos de Navegación */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-ink-900 uppercase tracking-wider">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#eventos" className="hover:text-brand-600 transition-colors">
                  Eventos y Programación
                </a>
              </li>
              <li>
                <a href="#convocatorias" className="hover:text-brand-600 transition-colors">
                  Convocatorias Abiertas (Call for Papers)
                </a>
              </li>
              <li>
                <Link to="/convocatorias-publicas" className="hover:text-brand-600 transition-colors">
                  Portal Público de Convocatorias
                </Link>
              </li>
              <li>
                <a href="#que-es-sigea" className="hover:text-brand-600 transition-colors">
                  ¿Qué es SIGEA?
                </a>
              </li>
              <li>
                <a href="#beneficios" className="hover:text-brand-600 transition-colors">
                  Beneficios por Rol
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Accesos de Usuario */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-ink-900 uppercase tracking-wider">
              Cuenta
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-brand-600 transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/registro" className="hover:text-brand-600 transition-colors">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link to="/recuperar-password" className="hover:text-brand-600 transition-colors">
                  Recuperar contraseña
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-brand-600 transition-colors">
                  Mi Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto institucional UFPS */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-ink-900 uppercase tracking-wider">
              Sede Principal
            </h4>
            <div className="space-y-2.5 text-xs text-ink-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>Av. Gran Colombia No. 12E-96 Barrio Colsag, San José de Cúcuta, Colombia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                <span>+57 (607) 5776655 Ext. 142</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                <span>ingsistemas@ufps.edu.co</span>
              </div>
              <div className="pt-1">
                <a
                  href="https://ww2.ufps.edu.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600 inline-flex items-center gap-1 font-medium text-brand-600"
                >
                  <span>Portal Institucional UFPS</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior de copyright */}
        <div className="pt-8 mt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-600">
          <p>
            Programa de Ingeniería de Sistemas — Universidad Francisco de Paula Santander (UFPS) Cúcuta &copy; {anio}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span>SIGEA v1.0</span>
            <span>·</span>
            <span>Cúcuta, Norte de Santander</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
