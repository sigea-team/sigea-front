import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  PenTool,
  Mic,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import { BENEFICIOS_POR_ROL } from '../homeUtils';

/**
 * @file HomeRolesSection.jsx
 * @description Sección de Beneficios por Rol en SIGEA (Objetivos 2 y 3).
 * Explica a cada tipo de usuario qué puede hacer una vez registrado e impulsa la conversión.
 * @module features/home/components/HomeRolesSection
 */
export default function HomeRolesSection() {
  const [rolSeleccionado, setRolSeleccionado] = useState('asistente');

  const iconosPorRol = {
    asistente: GraduationCap,
    autor: PenTool,
    conferencista: Mic,
    evaluador: ClipboardCheck,
  };

  const rolActivo = BENEFICIOS_POR_ROL.find((r) => r.id === rolSeleccionado) || BENEFICIOS_POR_ROL[0];
  const IconoActivo = iconosPorRol[rolActivo.id] || Users;

  return (
    <section id="beneficios" className="min-h-screen py-16 sm:py-24 bg-white border-b border-border flex flex-col justify-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Encabezado */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Experiencia a Tu Medida</span>
          </div>
          <h2 className="font-serif-title text-3xl sm:text-4xl text-ink-900 tracking-tight">
            ¿Por qué registrarte en <span className="text-brand-600">SIGEA</span>?
          </h2>
          <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
            Descubre todas las funciones y ventajas que obtienes al formar parte de la plataforma
            según tu perfil de participación académica.
          </p>
        </div>

        {/* Selector de Pestañas por Rol */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-surface-muted border border-border rounded-[12px] w-full max-w-3xl mx-auto">
          {BENEFICIOS_POR_ROL.map((item) => {
            const Icono = iconosPorRol[item.id] || Users;
            const activo = item.id === rolSeleccionado;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRolSeleccionado(item.id)}
                className={`flex-1 min-w-[130px] h-11 px-3 rounded-[8px] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activo
                    ? 'bg-white text-brand-600 shadow-xs border border-border/60'
                    : 'text-ink-600 hover:text-ink-900 hover:bg-white/60'
                }`}
              >
                <Icono className={`w-4 h-4 ${activo ? 'text-brand-600' : 'text-ink-600'}`} />
                <span>{item.rol.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Tarjeta de Detalle del Rol Activo */}
        <div className="w-full bg-surface-muted border border-border rounded-[16px] p-6 sm:p-10 lg:p-12 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="md:col-span-5 space-y-4">
            <div className="w-14 h-14 rounded-[12px] bg-brand-100 text-brand-600 flex items-center justify-center">
              <IconoActivo className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-semibold text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full inline-block">
                {rolActivo.tag}
              </span>
              <h3 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-2">
                {rolActivo.rol}
              </h3>
            </div>

            <p className="text-sm text-ink-600 leading-relaxed font-normal">
              {rolActivo.descripcion}
            </p>

            <div className="pt-2">
              <Link
                to={rolActivo.ctaRuta}
                className="h-11 px-5 rounded-[8px] bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors shadow-2xs inline-flex items-center gap-2"
              >
                <span>{rolActivo.ctaTexto}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-7 bg-white border border-border rounded-[14px] p-6 sm:p-8 space-y-4 shadow-2xs">
            <h4 className="text-xs font-semibold text-ink-900 uppercase tracking-wider text-ink-600">
              Lo que puedes hacer en la plataforma:
            </h4>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {rolActivo.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex items-start gap-3 text-xs sm:text-sm text-ink-900 font-normal bg-surface-muted/60 p-3.5 rounded-[10px] border border-border/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>


      </div>
    </section>
  );
}
