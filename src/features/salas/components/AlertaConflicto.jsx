import { AlertTriangle, Clock, Users } from 'lucide-react';
import { formatearHora } from '../salaUtils';

/**
 * @file AlertaConflicto.jsx
 * @description Panel visual de advertencia para conflictos de aforo o de horario
 * en la programación de salas y ponentes (HU-20: Criterios 4 y 5).
 */
export default function AlertaConflicto({
  titulo = 'Advertencia de conflicto detectado',
  subtitulo,
  tipo = 'horario', // 'horario' | 'aforo'
  actividades = [],
  nuevoAforo,
  motivos = [],
  className = '',
}) {
  return (
    <div
      className={`rounded-[12px] border border-brand-600 bg-brand-100 p-4 text-brand-700 shadow-xs ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-brand-100 text-brand-600 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-brand-700">{titulo}</h4>
          {subtitulo && <p className="text-xs text-brand-700 mt-0.5">{subtitulo}</p>}

          {motivos.length > 0 && (
            <ul className="mt-2.5 space-y-1 text-xs text-brand-700 list-disc list-inside">
              {motivos.map((motivo, idx) => (
                <li key={idx} className="leading-relaxed">
                  {motivo}
                </li>
              ))}
            </ul>
          )}

          {tipo === 'aforo' && actividades.length > 0 && (
            <div className="mt-3 bg-surface rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-brand-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Actividades con inscripciones activas que superan el aforo ({nuevoAforo}):
              </p>
              <ul className="divide-y divide-border text-xs">
                {actividades.map((act) => (
                  <li key={act.id} className="py-1.5 flex items-center justify-between gap-2">
                    <span className="font-medium text-brand-700 truncate">{act.nombre}</span>
                    <span className="shrink-0 text-brand-700 font-semibold">
                      {act.inscripcionesActivas ?? act.asistentesInscritos} inscritos
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tipo === 'horario' && actividades.length > 0 && (
            <div className="mt-3 bg-surface rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-brand-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Actividades programadas que quedan fuera del nuevo horario:
              </p>
              <ul className="divide-y divide-border text-xs">
                {actividades.map((act) => (
                  <li key={act.id} className="py-1.5 flex items-center justify-between gap-2">
                    <span className="font-medium text-brand-700 truncate">{act.nombre}</span>
                    <span className="shrink-0 text-brand-700 font-semibold whitespace-nowrap">
                      {act.fecha} ({formatearHora(act.horaInicio)} – {formatearHora(act.horaFin)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

