import { AlertTriangle, Clock, Building, User, Info } from 'lucide-react';

/**
 * @file AlertaConflictoAgenda.jsx
 * @description Componente visual para advertir de conflictos de horario, sala, ponente o disponibilidad (HU-21).
 */
export default function AlertaConflictoAgenda({ resultadoConflicto, permiteSimultaneidad }) {
  if (!resultadoConflicto) return null;

  const {
    hayConflicto,
    conflictosHorario = [],
    conflictosSala = [],
    conflictosPonente = [],
    conflictosDisponibilidad = [],
  } = resultadoConflicto;

  if (!hayConflicto && !permiteSimultaneidad) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      {/* Aviso informativo de simultaneidad intencional (Criterio 3) */}
      {permiteSimultaneidad && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-950">
              Actividad marcada como simultánea (Criterio 3)
            </p>
            <p className="text-blue-800 mt-0.5">
              Se permite desarrollarse en el mismo horario que otras actividades paralelas,
              verificando que cuenten con ponentes independientes y que utilicen salas diferentes,
              salvo que la sala esté configurada para actividades simultáneas.
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Conflicto de Sala (Criterio 2 y 3) */}
      {conflictosSala.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
          <Building className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-950 uppercase tracking-wide text-[11px]">
              Conflicto de Sala Detectado (Criterio 2)
            </p>
            <ul className="mt-1 space-y-1 text-red-800 list-disc list-inside">
              {conflictosSala.map((c, i) => (
                <li key={i}>{c.mensaje}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Alerta de Conflicto de Ponente (Criterio 2 y 3) */}
      {conflictosPonente.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
          <User className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-purple-950 uppercase tracking-wide text-[11px]">
              Conflicto de Ponente Detectado (Criterio 2)
            </p>
            <ul className="mt-1 space-y-1 text-purple-800 list-disc list-inside">
              {conflictosPonente.map((c, i) => (
                <li key={i}>{c.mensaje}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Alerta de Cruce de Horario General (Criterio 2) */}
      {conflictosHorario.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-950 uppercase tracking-wide text-[11px]">
              Cruce de Horario no Planificado (Criterio 2)
            </p>
            <ul className="mt-1 space-y-1 text-amber-800 list-disc list-inside">
              {conflictosHorario.map((c, i) => (
                <li key={i}>{c.mensaje}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-amber-950 font-medium">
              💡 Si esta actividad debe ocurrir al mismo tiempo (ej. track o taller paralelo), marca la casilla de «Actividad simultánea intencional».
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Disponibilidad horaria no registrada (HU-20 / HU-21) */}
      {conflictosDisponibilidad.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-orange-950 uppercase tracking-wide text-[11px]">
              Aviso de Disponibilidad
            </p>
            <ul className="mt-1 space-y-1 text-orange-800 list-disc list-inside">
              {conflictosDisponibilidad.map((c, i) => (
                <li key={i}>{c.mensaje}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
