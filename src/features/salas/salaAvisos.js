/**
 * @file salaAvisos.js
 * @description Mensajes de error de la API y avisos de conflictos de disponibilidad (HU-20, Criterio 5),
 * compartidos por la página de salas y el modal de salas del evento.
 * @module features/salas/salaAvisos
 */
import Swal from 'sweetalert2';

/** Mensaje legible de un error de la API. */
export function mensajeApi(err, porDefecto) {
  const data = err?.response?.data;
  if (data && typeof data === 'object' && data.message) return data.message;
  if (err?.response?.status === 403) return 'No tienes permiso para realizar esta operación.';
  if (err && !err.response && err.message) return err.message;
  return porDefecto;
}

/** Ejecuta una llamada a la API y, si falla, lanza un Error con el mensaje del backend (lo muestran los modales). */
export async function conMensajeApi(llamada, porDefecto) {
  try {
    return await llamada();
  } catch (err) {
    throw new Error(mensajeApi(err, porDefecto), { cause: err });
  }
}

/** Escapa texto para insertarlo en el HTML de una alerta. */
function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = String(texto ?? '');
  return div.innerHTML;
}

/** Avisa del resultado de guardar una disponibilidad, listando las actividades en conflicto si las hay. */
export function avisarDisponibilidad(resultado, tituloOk, textoOk) {
  const conflictos = resultado?.conflictos || [];
  if (conflictos.length === 0) {
    return Swal.fire({ icon: 'success', title: tituloOk, text: textoOk, confirmButtonColor: '#a6192e' });
  }
  const items = conflictos
    .map((c) => {
      const horario = `${c.fecha} ${String(c.horaInicio).slice(0, 5)}-${String(c.horaFin).slice(0, 5)}`;
      const motivo = c.descripcionConflicto || 'queda fuera de la disponibilidad';
      return `<li>${escaparHtml(c.nombreActividad || 'Actividad')} (${escaparHtml(horario)}): ${escaparHtml(motivo)}</li>`;
    })
    .join('');
  return Swal.fire({
    icon: 'warning',
    title: 'Guardado con conflictos',
    html: `<p class="text-sm mb-2">La disponibilidad se guardó, pero estas actividades quedan en conflicto:</p><ul class="text-xs text-left list-disc pl-5 space-y-1">${items}</ul>`,
    confirmButtonColor: '#a6192e',
  });
}
