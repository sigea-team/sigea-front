/**
 * @file agendaAvisos.js
 * @description HTML de las alertas que muestran las respuestas 409 del backend al programar una actividad (HU-21).
 * Los mensajes incluyen nombres de actividades, salas y ponentes, por eso todo pasa por `escaparHtml`.
 * @module features/agenda/agendaAvisos
 */
import { escaparHtml } from '../../utils/html';

/** Cruces de agenda (CONFLICTO_PROGRAMACION): el backend no permite guardar hasta corregirlos. */
export function htmlConflictosProgramacion(error) {
  const items = (error?.conflictos || [])
    .map((c) => `<li><strong>${escaparHtml(c.tipo)}:</strong> ${escaparHtml(c.mensaje)}</li>`)
    .join('');

  return `
    <div class="text-left text-xs text-[#1f2023] space-y-2">
      <p class="font-medium text-red-600">${escaparHtml(error?.message)}</p>
      <ul class="list-disc list-inside text-red-800 space-y-1 bg-red-50 p-2.5 rounded-lg border border-red-200">
        ${items}
      </ul>
    </div>
  `;
}

/** Advertencias de disponibilidad (CONFIRMACION_REQUERIDA): se puede guardar si el usuario las acepta. */
export function htmlConfirmacionAdvertencias(error) {
  const items = (error?.advertencias || [])
    .map((a) => `<li>${escaparHtml(a.mensaje)}</li>`)
    .join('');

  return `
    <div class="text-left text-xs text-[#1f2023] space-y-2">
      <p class="font-medium text-amber-900">${escaparHtml(error?.message)}</p>
      <ul class="list-disc list-inside text-amber-800 space-y-1 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
        ${items}
      </ul>
      <p class="mt-2 text-[#5b5f66]">¿Deseas confirmar la programación de la actividad aceptando estas advertencias?</p>
    </div>
  `;
}
