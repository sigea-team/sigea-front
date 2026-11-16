import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ExternalLink } from 'lucide-react';
import UfpsLogo from './UfpsLogo';

/**
 * @file Footer.jsx
 * @description Footer global institucional de SIGEA. Se usa tanto en las páginas internas
 * (dashboard, convocatorias, etc.) como en la página pública (Home).
 * Incluye marca SIGEA, enlaces de navegación, contacto UFPS y copyright.
 * @module components/ui/Footer
 */
export default function Footer({ className = '', compacto = false }) {
  const anio = new Date().getFullYear();

  /* Versión compacta: solo copyright (para las páginas internas que ya tienen sidebar) */
  if (compacto) {
    return (
      <footer className={`bg-surface-page border-t border-border py-4 px-8 text-center sm:text-left ${className}`}>
        <p className="text-xs sm:text-sm text-ink-600 font-normal">
          Programa de Ingeniería de Sistemas — Universidad Francisco de Paula Santander (UFPS) Cúcuta &copy; {anio}
        </p>
      </footer>
    );
  }

  /* Versión completa: se usa en la Home y en páginas públicas */
  return (
    <footer className={`bg-white border-t border-border text-ink-600 font-sans ${className}`}>
      <div className="w-full px-6 sm:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Columna 1: Marca institucional */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <UfpsLogo
                variante="vertical"
                className="h-12 w-auto max-w-[48px] object-contain shrink-0"
              />
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
                <Link to="/" className="hover:text-brand-600 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/convocatorias-publicas" className="hover:text-brand-600 transition-colors">
                  Portal Público de Convocatorias
                </Link>
              </li>
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
            </ul>
          </div>

          {/* Columna 3: Accesos de la Plataforma */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-ink-900 uppercase tracking-wider">
              Plataforma
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/dashboard" className="hover:text-brand-600 transition-colors">
                  Mi Panel
                </Link>
              </li>
              <li>
                <Link to="/cuenta" className="hover:text-brand-600 transition-colors">
                  Mi Cuenta
                </Link>
              </li>
              <li>
                <Link to="/mis-propuestas" className="hover:text-brand-600 transition-colors">
                  Mis Propuestas
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
