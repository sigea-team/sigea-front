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
    <section id="beneficios" className="py-16 sm:py-24 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
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
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-surface-muted border border-border rounded-[12px] max-w-2xl mx-auto">
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
        <div className="bg-surface-muted border border-border rounded-[16px] p-6 sm:p-10 shadow-2xs max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-4">
            <div className="w-14 h-14 rounded-[12px] bg-brand-100 text-brand-600 flex items-center justify-center">
              <IconoActivo className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-semibold text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full inline-block">
                {rolActivo.tag}
              </span>
              <h3 className="font-serif-title text-2xl text-ink-900 mt-2">
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

          <div className="md:col-span-7 bg-white border border-border rounded-[12px] p-6 space-y-4 shadow-2xs">
            <h4 className="text-xs font-semibold text-ink-900 uppercase tracking-wider text-ink-600">
              Lo que puedes hacer en la plataforma:
            </h4>

            <ul className="space-y-3">
              {rolActivo.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex items-start gap-3 text-xs sm:text-sm text-ink-900 font-normal">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rejilla rápida complementaria para los demás roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFICIOS_POR_ROL.map((item) => {
            const Icono = iconosPorRol[item.id] || Users;
            return (
              <div
                key={item.id}
                onClick={() => setRolSeleccionado(item.id)}
                className={`p-5 rounded-[12px] border transition-all cursor-pointer text-left ${
                  item.id === rolSeleccionado
                    ? 'bg-brand-100/40 border-brand-600/40 shadow-xs'
                    : 'bg-white border-border hover:border-brand-600/30 hover:bg-surface-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                    <Icono className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-ink-900 leading-tight">{item.rol}</h4>
                    <span className="text-[11px] text-ink-600">{item.tag}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
