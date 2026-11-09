import Swal from 'sweetalert2';
import { extraerError } from '../eventos/eventoUtils';
import { escaparHtml } from '../../utils/html';

/**
 * @file accionesAgenda.js
 * @description Acciones de la HU-22 compartidas por `AgendaPage` y `AgendaModal`.
 * @module features/agenda/accionesAgenda
 */

const CLASES = {
  popup: 'rounded-[16px]',
  confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
};

/**
 * Pide confirmación y devuelve la actividad a «por programar» (quita fecha, horario y sala; conserva la duración).
 * Si la agenda ya está publicada, el backend avisa a los inscritos (Criterio 5).
 * @param {{ desprogramar: Function }} api - Cliente de HU-22.
 * @param {number|string} eventoId
 * @param {{ id: number, nombre: string }} actividad
 * @param {() => void} onListo - Se llama si se desprogramó (para recargar la agenda).
 * @returns {Promise<boolean>} true si se desprogramó.
 */
export async function confirmarDesprogramar(api, eventoId, actividad, onListo) {
  const r = await Swal.fire({
    title: '¿Devolver a por programar?',
    html:
      `«${escaparHtml(actividad.nombre)}» quedará sin fecha, horario ni sala y conservará su duración. ` +
      'Podrás ubicarla otra vez con «Generar agenda» o a mano.' +
      '<br/><span style="font-size:12px;color:#5b5f66">Si la agenda ya está publicada, se avisará a los inscritos.</span>',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, devolver',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#a6192e',
    cancelButtonColor: '#5b5f66',
    customClass: CLASES,
  });
  if (!r.isConfirmed) return false;
  try {
    await api.desprogramar(eventoId, actividad.id);
    onListo?.();
    Swal.fire({ icon: 'success', title: 'Actividad por programar', timer: 1800, showConfirmButton: false });
    return true;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'No se pudo devolver a por programar',
      text: extraerError(err).mensaje,
      confirmButtonColor: '#a6192e',
      customClass: CLASES,
    });
    return false;
  }
}
