import PropTypes from 'prop-types';
import { ClipboardCheck, ArrowRight, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * @file BannerModoEvaluador.jsx
 * @description Banner institucional destacado para usuarios con perfil o rol de Evaluador (HU-17).
 * Se visualiza en el panel principal (Dashboard) para orientar al evaluador sobre sus tareas pendientes.
 * @module features/evaluaciones/components/BannerModoEvaluador
 */

export default function BannerModoEvaluador({
  pendientesCount = 0,
  completadasCount = 0,
  enlaceEvaluaciones = '/evaluaciones',
}) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-[#a6192e]/20 bg-linear-to-r from-[#fdecec] via-white to-[#fff8f8] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#a6192e] text-white text-[10px] font-bold tracking-wide uppercase shadow-2xs">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Perfil de Evaluador Activo</span>
          </div>
          <h2 className="font-serif-title text-xl sm:text-2xl text-[#1f2023] font-bold leading-tight">
            Gestión y Calificación de Propuestas Académicas
          </h2>
          <p className="text-xs sm:text-sm text-[#5b5f66] leading-relaxed">
            Como miembro del comité evaluador, califica las ponencias asignadas aplicando la rúbrica definida. El sistema calculará automáticamente la puntuación ponderada y determinará la aprobación de cada propuesta.
          </p>

          {/* Métricas rápidas */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-[#5b5f66]">
              <Clock className="w-4 h-4 text-[#b54708]" />
              <span>
                <strong className="text-[#1f2023] font-bold">{pendientesCount}</strong> por calificar
              </span>
            </div>
            <span className="text-[#e5e7ea]">•</span>
            <div className="flex items-center gap-1.5 text-xs text-[#5b5f66]">
              <Award className="w-4 h-4 text-[#107e3e]" />
              <span>
                <strong className="text-[#1f2023] font-bold">{completadasCount}</strong> completadas
              </span>
            </div>
          </div>
        </div>

        <Link
          to={enlaceEvaluaciones}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#a6192e] text-white text-xs sm:text-sm font-semibold hover:bg-[#7a0c1e] transition-colors shadow-xs cursor-pointer group"
        >
          <span>Ir a mis evaluaciones</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

BannerModoEvaluador.propTypes = {
  pendientesCount: PropTypes.number,
  completadasCount: PropTypes.number,
  enlaceEvaluaciones: PropTypes.string,
};
