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
    <div className="relative overflow-hidden rounded-[16px] border border-brand-600 bg-brand-100 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-2xs">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Perfil de Evaluador Activo</span>
          </div>
          <h2 className="font-serif-title text-xl sm:text-2xl text-ink-900 font-bold leading-tight">
            Gestión y Calificación de Propuestas Académicas
          </h2>
          <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
            Como miembro del comité evaluador, califica las ponencias asignadas aplicando la rúbrica definida. El sistema calculará automáticamente la puntuación ponderada y determinará la aprobación de cada propuesta.
          </p>

          {/* Métricas rápidas */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-ink-600">
              <Clock className="w-4 h-4 text-brand-700" />
              <span>
                <strong className="text-ink-900 font-bold">{pendientesCount}</strong> por calificar
              </span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5 text-xs text-ink-600">
              <Award className="w-4 h-4 text-brand-600" />
              <span>
                <strong className="text-ink-900 font-bold">{completadasCount}</strong> completadas
              </span>
            </div>
          </div>
        </div>

        <Link
          to={enlaceEvaluaciones}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs cursor-pointer group"
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
