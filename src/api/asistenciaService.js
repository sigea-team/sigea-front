import { httpClient } from './httpClient';

/**
 * @file asistenciaService.js
 * @description Cliente de la API del código QR de inscripción y del registro de asistencia (HU-24).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Endpoints del backend (CodigoQrController y AsistenciaController):
 * - GET  /api/v1/eventos/{eventoId}/inscripciones/mi-inscripcion/qr                  -> Mi código QR (Criterio 1)
 * - GET  /api/v1/eventos/{eventoId}/inscripciones/mi-inscripcion/qr/imagen?tamano=   -> Imagen PNG de mi QR
 * - POST /api/v1/eventos/{eventoId}/inscripciones/mi-inscripcion/qr/reenviar         -> Reenviar mi QR (Criterio 4)
 * - POST /api/v1/eventos/{eventoId}/inscripciones/{inscripcionId}/qr/reenviar        -> El organizador reenvía un QR
 * - POST /api/v1/eventos/{eventoId}/actividades/{actividadId}/asistencias            -> Registrar con el QR (Criterio 2)
 * - POST /api/v1/eventos/{eventoId}/actividades/{actividadId}/asistencias/manual     -> Registro manual
 * - GET  /api/v1/eventos/{eventoId}/actividades/{actividadId}/asistencias            -> Asistencias de la actividad
 * Para el registro manual se combinan dos endpoints de HU-23 (permiso INSCRIPCIONES_GESTIONAR o admin):
 * - GET  /api/v1/eventos/{eventoId}/actividades/{actividadId}/inscripciones          -> Inscritos en la actividad
 * - GET  /api/v1/eventos/{eventoId}/inscripciones                                    -> Inscripciones al evento (nombres)
 *
 * Rechazos del registro (Criterio 3), en `codigo`: QR_INVALIDO (404), QR_NO_VIGENTE, QR_OTRO_EVENTO,
 * NO_INSCRITO_ACTIVIDAD, ACTIVIDAD_NO_DISPONIBLE, EVENTO_NO_DISPONIBLE y ASISTENCIA_DUPLICADA (409, trae
 * `asistenciaExistente`).
 * @module api/asistenciaService
 */

const rutaEvento = (eventoId) => `/eventos/${eventoId}`;
const rutaMiQr = (eventoId) => `${rutaEvento(eventoId)}/inscripciones/mi-inscripcion/qr`;
const rutaAsistencias = (eventoId, actividadId) => `${rutaEvento(eventoId)}/actividades/${actividadId}/asistencias`;

/**
 * Código QR de la inscripción del usuario autenticado en el evento.
 * @param {number|string} eventoId
 * @returns {Promise<{ qrId: number, inscripcionId: number, eventoId: number, eventoNombre: string,
 *   participanteNombre: string, participanteCorreo: string, codigo: string, fechaGeneracion: string,
 *   vigente: boolean }>}
 */
export async function obtenerMiCodigoQr(eventoId) {
  const { data } = await httpClient.get(rutaMiQr(eventoId));
  return data;
}

/**
 * Imagen PNG del QR del usuario. Se pide con axios (no con `<img src>`) porque el endpoint exige el token.
 * @param {number|string} eventoId
 * @param {number} [tamano=320] - Ancho y alto en píxeles; el backend lo ajusta al rango 120-1024.
 * @returns {Promise<Blob>}
 */
export async function obtenerImagenMiQr(eventoId, tamano = 320) {
  const { data } = await httpClient.get(`${rutaMiQr(eventoId)}/imagen`, {
    params: { tamano },
    responseType: 'blob',
  });
  return data;
}

/**
 * Reenvía por correo el QR del usuario. Siempre es el mismo código (Criterio 4).
 * @param {number|string} eventoId
 * @returns {Promise<{ inscripcionId: number, correoDestino: string, codigo: string, enviado: boolean,
 *   fechaReenvio: string, mensaje: string }>}
 */
export async function reenviarMiQr(eventoId) {
  const { data } = await httpClient.post(`${rutaMiQr(eventoId)}/reenviar`);
  return data;
}

/**
 * El organizador reenvía el QR de una inscripción del evento.
 * @param {number|string} eventoId
 * @param {number|string} inscripcionId
 * @returns {Promise<Object>} Igual que {@link reenviarMiQr}.
 */
export async function reenviarQrInscripcion(eventoId, inscripcionId) {
  const { data } = await httpClient.post(`${rutaEvento(eventoId)}/inscripciones/${inscripcionId}/qr/reenviar`);
  return data;
}

/**
 * Registra la asistencia con el texto leído del QR (Criterio 2).
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @param {string} codigo
 * @returns {Promise<Object>} AsistenciaResponse
 */
export async function registrarPorQr(eventoId, actividadId, codigo) {
  const { data } = await httpClient.post(rutaAsistencias(eventoId, actividadId), { codigo });
  return data;
}

/**
 * Registra la asistencia sin QR, a partir de la inscripción al evento.
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @param {number|string} inscripcionId
 * @returns {Promise<Object>} AsistenciaResponse
 */
export async function registrarManual(eventoId, actividadId, inscripcionId) {
  const { data } = await httpClient.post(`${rutaAsistencias(eventoId, actividadId)}/manual`, {
    inscripcionId: Number(inscripcionId),
  });
  return data;
}

/**
 * Asistencias registradas en la actividad, con el total de inscritos.
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @returns {Promise<{ actividadId: number, actividadNombre: string, inscritos: number, asistentes: number,
 *   asistencias: Array<Object> }>}
 */
export async function listarAsistencias(eventoId, actividadId) {
  const { data } = await httpClient.get(rutaAsistencias(eventoId, actividadId));
  return {
    ...data,
    asistencias: Array.isArray(data?.asistencias) ? data.asistencias : [],
  };
}

/**
 * Inscritos de la actividad (solo ids de inscripción) y las inscripciones al evento (con el nombre).
 * Se combinan en {@link module:features/asistencia/asistenciaUtils.combinarInscritos}.
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @returns {Promise<{ inscritosActividad: Array<Object>, inscripcionesEvento: Array<Object> }>}
 */
export async function listarInscritosParaAsistencia(eventoId, actividadId) {
  const [actividad, evento] = await Promise.all([
    httpClient.get(`${rutaEvento(eventoId)}/actividades/${actividadId}/inscripciones`),
    httpClient.get(`${rutaEvento(eventoId)}/inscripciones`),
  ]);
  return {
    inscritosActividad: Array.isArray(actividad.data) ? actividad.data : [],
    inscripcionesEvento: Array.isArray(evento.data) ? evento.data : [],
  };
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const asistenciaService = {
  obtenerMiCodigoQr,
  obtenerImagenMiQr,
  reenviarMiQr,
  reenviarQrInscripcion,
  registrarPorQr,
  registrarManual,
  listarAsistencias,
  listarInscritosParaAsistencia,
};

export default asistenciaService;
