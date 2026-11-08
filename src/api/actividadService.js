/**
 * ==============================================================================================
 * [BACKEND_ENDPOINT] HU-21: GESTIÓN Y PROGRAMACIÓN DE ACTIVIDADES DE LA AGENDA
 * ==============================================================================================
 * Conectado con ActividadController (/api/v1/eventos/{eventoId}/actividades).
 * Endpoints implementados en el backend:
 * - GET    /api/v1/eventos/{eventoId}/actividades            -> Listar agenda cronológica
 * - GET    /api/v1/eventos/{eventoId}/actividades/{id}       -> Detalle de una actividad
 * - POST   /api/v1/eventos/{eventoId}/actividades/validar    -> Validar sin guardar (conflictos y advertencias)
 * - POST   /api/v1/eventos/{eventoId}/actividades            -> Programar actividad
 * - PUT    /api/v1/eventos/{eventoId}/actividades/{id}       -> Modificar actividad (revalida conflictos)
 * - DELETE /api/v1/eventos/{eventoId}/actividades/{id}       -> Eliminar actividad
 * ==============================================================================================
 * @module api/actividadService
 */

import { httpClient } from './httpClient';
import { ordenarCronologicamente, validarActividad } from '../features/agenda/agendaUtils';

/** Prefijo base de la ruta REST para las actividades de un evento */
const rutaBase = (eventoId) => `/eventos/${eventoId}/actividades`;

/**
 * Convierte un error de la API en uno que la interfaz pueda mostrar. Conserva el código, los
 * conflictos y las advertencias que envía el backend (por ejemplo, en un 409).
 * @param {Error} err - Error original de la petición.
 * @param {string} porDefecto - Mensaje si el backend no envió uno.
 * @returns {Error}
 */
function aErrorActividad(err, porDefecto) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  let mensaje = porDefecto;
  if (data && typeof data === 'object' && data.message) {
    mensaje = data.message;
  } else if (status === 403) {
    mensaje = 'No tienes permiso para realizar esta operación.';
  } else if (!err?.response) {
    mensaje = `${porDefecto} No se pudo conectar con el servidor.`;
  }

  const error = new Error(mensaje, { cause: err });
  error.status = status;
  error.codigo = data?.codigo;
  error.conflictos = data?.conflictos || [];
  error.advertencias = data?.advertencias || [];
  error.response = err?.response;
  return error;
}

/**
 * Normaliza una hora al formato "HH:mm" esperado por el backend LocalTime.
 * @param {string} h - "09:00" o "09:00:00"
 * @returns {string} - "09:00"
 */
function normalizarHora(h) {
  if (!h || typeof h !== 'string') return '00:00';
  return h.slice(0, 5);
}

/**
 * Transforma los datos del formulario frontend al DTO `ActividadRequest` del backend.
 * @param {Object} datos
 * @returns {Object}
 */
export function aActividadRequest(datos) {
  return {
    nombre: (datos.nombre || '').trim(),
    tipoActividadId: datos.tipoActividadId ? Number(datos.tipoActividadId) : null,
    fecha: datos.fecha,
    horaInicio: normalizarHora(datos.horaInicio),
    horaFin: normalizarHora(datos.horaFin),
    salaId: Number(datos.salaId),
    ponenteId: datos.ponenteId ? Number(datos.ponenteId) : null,
    propuestaId: datos.propuestaId ? Number(datos.propuestaId) : null,
    lineaTematicaId: datos.lineaTematicaId ? Number(datos.lineaTematicaId) : null,
    modalidad: datos.modalidad || 'presencial',
    simultanea: Boolean(datos.simultanea ?? datos.permiteSimultaneidad),
    confirmarAdvertencias: Boolean(datos.confirmarAdvertencias),
  };
}

/**
 * Normaliza el DTO `ActividadResponse` del backend al modelo usado en los componentes frontend.
 * @param {Object} item
 * @returns {Object}
 */
export function normalizarActividadResponse(item) {
  if (!item) return item;
  return {
    ...item,
    id: item.id,
    eventoId: item.eventoId,
    nombre: item.nombre,
    tipoActividadId: item.tipoActividadId,
    tipoActividadNombre: item.tipoActividadNombre || '',
    fecha: item.fecha,
    horaInicio: normalizarHora(item.horaInicio),
    horaFin: normalizarHora(item.horaFin),
    salaId: item.salaId,
    salaNombre: item.salaNombre || '',
    ponenteId: item.ponenteId || null,
    ponenteNombre: item.ponenteNombre || '',
    propuestaId: item.propuestaId || null,
    lineaTematicaId: item.lineaTematicaId || null,
    modalidad: item.modalidad || 'presencial',
    permiteSimultaneidad: Boolean(item.simultanea ?? item.permiteSimultaneidad),
    simultanea: Boolean(item.simultanea ?? item.permiteSimultaneidad),
    estado: item.estado || 'programada',
    advertencias: Array.isArray(item.advertencias) ? item.advertencias : [],
    tieneAdvertencia: Boolean(item.advertencias && item.advertencias.length > 0),
  };
}

export const actividadService = {
  soportaActividades: true,

  /**
   * [BACKEND_ENDPOINT] GET /api/v1/eventos/{eventoId}/actividades?fecha=
   * Criterio 1: Lista todas las actividades de un evento en estricto orden cronológico.
   *
   * @param {number|string} eventoId - Identificador del evento
   * @param {string} [fecha] - Fecha opcional (AAAA-MM-DD)
   * @returns {Promise<Array<Object>>}
   */
  async listarActividades(eventoId, fecha = null) {
    if (!eventoId) return [];

    try {
      const params = fecha ? { fecha } : {};
      const { data } = await httpClient.get(rutaBase(eventoId), { params });
      const normalizadas = (Array.isArray(data) ? data : []).map(normalizarActividadResponse);
      return ordenarCronologicamente(normalizadas);
    } catch (err) {
      throw aErrorActividad(err, 'No fue posible cargar la agenda del evento.');
    }
  },

  /**
   * [BACKEND_ENDPOINT] GET /api/v1/eventos/{eventoId}/actividades/{actividadId}
   * Obtiene el detalle de una actividad específica.
   */
  async obtenerActividad(eventoId, actividadId) {
    try {
      const { data } = await httpClient.get(`${rutaBase(eventoId)}/${actividadId}`);
      return normalizarActividadResponse(data);
    } catch (err) {
      throw aErrorActividad(err, 'No fue posible obtener la actividad.');
    }
  },

  /**
   * [BACKEND_ENDPOINT] POST /api/v1/eventos/{eventoId}/actividades/validar
   * Criterio 2: Revisa cruces de horario, sala y ponente antes de confirmar.
   *
   * @param {number|string} eventoId
   * @param {Object} datosActividad
   * @param {number|string|null} [actividadId] - Para revalidación al editar (Criterio 5)
   * @returns {Promise<{ puedeGuardar: boolean, requiereConfirmacion: boolean, conflictos: Array, advertencias: Array }>}
   */
  async validarEnBackend(eventoId, datosActividad, actividadId = null) {
    try {
      const params = actividadId ? { actividadId } : {};
      const payload = aActividadRequest(datosActividad);
      const { data } = await httpClient.post(`${rutaBase(eventoId)}/validar`, payload, { params });
      return data;
    } catch (err) {
      throw aErrorActividad(err, 'No fue posible validar la actividad.');
    }
  },

  /**
   * [BACKEND_ENDPOINT] POST /api/v1/eventos/{eventoId}/actividades
   * Criterios 1 a 4: Registra una nueva actividad en la agenda del evento.
   *
   * @param {number|string} eventoId
   * @param {Object} datosActividad
   * @returns {Promise<Object>}
   */
  async crearActividad(eventoId, datosActividad) {
    const validacion = validarActividad(datosActividad);
    if (!validacion.esValido) {
      const err = new Error('Faltan datos obligatorios para programar la actividad.');
      err.errores = validacion.errores;
      err.status = 400;
      throw err;
    }

    try {
      const payload = aActividadRequest(datosActividad);
      const { data } = await httpClient.post(rutaBase(eventoId), payload);
      return normalizarActividadResponse(data);
    } catch (err) {
      throw aErrorActividad(err, 'No fue posible programar la actividad.');
    }
  },

  /**
   * [BACKEND_ENDPOINT] PUT /api/v1/eventos/{eventoId}/actividades/{actividadId}
   * Criterio 5: Modifica horario, sala o ponente revalidando cruces con el resto de la agenda.
   *
   * @param {number|string} eventoId
   * @param {number|string} actividadId
   * @param {Object} datosActividad
   * @returns {Promise<Object>}
   */
  async actualizarActividad(eventoId, actividadId, datosActividad) {
    const validacion = validarActividad(datosActividad);
    if (!validacion.esValido) {
      const err = new Error('Faltan datos obligatorios para actualizar la actividad.');
      err.errores = validacion.errores;
      err.status = 400;
      throw err;
    }

    try {
      const payload = aActividadRequest(datosActividad);
      const { data } = await httpClient.put(`${rutaBase(eventoId)}/${actividadId}`, payload);
      return normalizarActividadResponse(data);
    } catch (err) {
      throw aErrorActividad(err, 'No fue posible actualizar la actividad.');
    }
  },

  /**
   * [BACKEND_ENDPOINT] DELETE /api/v1/eventos/{eventoId}/actividades/{actividadId}
   * Elimina una actividad programada en la agenda del evento.
   *
   * @param {number|string} eventoId
   * @param {number|string} actividadId
   * @returns {Promise<{ ok: boolean }>}
   */
  async eliminarActividad(eventoId, actividadId) {
    try {
      await httpClient.delete(`${rutaBase(eventoId)}/${actividadId}`);
      return { ok: true };
    } catch (err) {
      throw aErrorActividad(err, 'No fue posible eliminar la actividad.');
    }
  },
};

export default actividadService;
