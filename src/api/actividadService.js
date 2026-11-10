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
import {
  obtenerActividadesMock,
  guardarActividadesMock,
  reiniciarActividadesMock,
} from '../features/agenda/mocks/agendaMock';
import {
  ordenarCronologicamente,
  validarActividad,
  detectarConflictosActividad,
} from '../features/agenda/agendaUtils';

/**
 * [BACKEND_ENDPOINT] BANDERA DE MODO:
 * Activo en true para consumir los endpoints reales de ActividadController.
 */
export const USE_REAL_BACKEND = true;

/** Prefijo base de la ruta REST para las actividades de un evento */
const rutaBase = (eventoId) => `/eventos/${eventoId}/actividades`;

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
    // HU-22: una actividad por programar no tiene fecha, horas ni sala (llegan en null).
    fecha: item.fecha ?? null,
    horaInicio: item.horaInicio ? normalizarHora(item.horaInicio) : null,
    horaFin: item.horaFin ? normalizarHora(item.horaFin) : null,
    salaId: item.salaId ?? null,
    salaNombre: item.salaNombre || '',
    ponenteId: item.ponenteId || null,
    ponenteNombre: item.ponenteNombre || '',
    propuestaId: item.propuestaId || null,
    lineaTematicaId: item.lineaTematicaId || null,
    modalidad: item.modalidad || 'presencial',
    permiteSimultaneidad: Boolean(item.simultanea ?? item.permiteSimultaneidad),
    simultanea: Boolean(item.simultanea ?? item.permiteSimultaneidad),
    estado: item.estado || 'programada',
    duracionMinutos: item.duracionMinutos ?? null,
    asignacionAutomatica: Boolean(item.asignacionAutomatica),
    advertencias: Array.isArray(item.advertencias) ? item.advertencias : [],
    tieneAdvertencia: Boolean(item.advertencias && item.advertencias.length > 0),
  };
}

export const actividadService = {
  soportaActividades: true,
  usaBackendReal: USE_REAL_BACKEND,

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

    if (USE_REAL_BACKEND) {
      // Sin fallback al mock: si el backend falla, la agenda muestra el error en vez de datos de demostración.
      const params = fecha ? { fecha } : {};
      const { data } = await httpClient.get(rutaBase(eventoId), { params });
      const normalizadas = (Array.isArray(data) ? data : []).map(normalizarActividadResponse);
      return ordenarCronologicamente(normalizadas);
    }

    return this._listarMock(eventoId, fecha);
  },

  /**
   * [BACKEND_ENDPOINT] GET /api/v1/eventos/{eventoId}/actividades/{actividadId}
   * Obtiene el detalle de una actividad específica.
   */
  async obtenerActividad(eventoId, actividadId) {
    if (USE_REAL_BACKEND) {
      const { data } = await httpClient.get(`${rutaBase(eventoId)}/${actividadId}`);
      return normalizarActividadResponse(data);
    }

    const todas = obtenerActividadesMock();
    const encontrada = todas.find((a) => String(a.id) === String(actividadId));
    if (!encontrada) {
      const err = new Error('La actividad solicitada no existe.');
      err.response = { status: 404 };
      throw err;
    }
    return normalizarActividadResponse(encontrada);
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
    if (USE_REAL_BACKEND) {
      try {
        const params = actividadId ? { actividadId } : {};
        const payload = aActividadRequest(datosActividad);
        const { data } = await httpClient.post(`${rutaBase(eventoId)}/validar`, payload, { params });
        return data;
      } catch (err) {
        console.warn('Validación de backend no disponible, usando validación local:', err.message);
      }
    }

    // Validación simulada local
    const actividades = await this.listarActividades(eventoId);
    const resultadoLocal = detectarConflictosActividad(datosActividad, actividades, {
      actividadIdExcluir: actividadId,
    });

    return {
      puedeGuardar: !resultadoLocal.hayConflicto,
      requiereConfirmacion: resultadoLocal.conflictosDisponibilidad.length > 0,
      conflictos: [
        ...resultadoLocal.conflictosHorario.map((c) => ({ tipo: 'HORARIO', mensaje: c.mensaje })),
        ...resultadoLocal.conflictosSala.map((c) => ({ tipo: 'SALA', mensaje: c.mensaje })),
        ...resultadoLocal.conflictosPonente.map((c) => ({ tipo: 'PONENTE', mensaje: c.mensaje })),
      ],
      advertencias: resultadoLocal.conflictosDisponibilidad.map((c) => ({
        tipo: 'FUERA_DISPONIBILIDAD',
        mensaje: c.mensaje,
      })),
    };
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

    if (USE_REAL_BACKEND) {
      try {
        const payload = aActividadRequest(datosActividad);
        const { data } = await httpClient.post(rutaBase(eventoId), payload);
        return normalizarActividadResponse(data);
      } catch (err) {
        // Si el backend responde 409 con conflictos o advertencias, propagar con los detalles
        if (err.response?.status === 409) {
          const respData = err.response.data || {};
          const errDetalle = new Error(respData.message || 'Conflicto al programar la actividad');
          errDetalle.codigo = respData.codigo;
          errDetalle.conflictos = respData.conflictos || [];
          errDetalle.advertencias = respData.advertencias || [];
          errDetalle.response = err.response;
          throw errDetalle;
        }
        // Con backend real no se cae al mock: un 400/403/500 o una caída de red deben verse,
        // si no la pantalla anuncia «Actividad agendada» sin haber guardado nada.
        throw err;
      }
    }

    // Modo Mock
    await new Promise((r) => setTimeout(r, 120));
    const todas = obtenerActividadesMock();
    const nuevoId = todas.length > 0 ? Math.max(...todas.map((a) => Number(a.id) || 0)) + 1 : 1;

    const nueva = {
      ...datosActividad,
      id: nuevoId,
      eventoId: Number(eventoId),
      salaId: Number(datosActividad.salaId),
      ponenteId: datosActividad.ponenteId ? Number(datosActividad.ponenteId) : null,
      permiteSimultaneidad: Boolean(datosActividad.simultanea ?? datosActividad.permiteSimultaneidad),
      simultanea: Boolean(datosActividad.simultanea ?? datosActividad.permiteSimultaneidad),
      estado: datosActividad.estado || 'programada',
      creadoEn: new Date().toISOString(),
    };

    todas.push(nueva);
    guardarActividadesMock(todas);
    return normalizarActividadResponse(nueva);
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

    if (USE_REAL_BACKEND) {
      try {
        const payload = aActividadRequest(datosActividad);
        const { data } = await httpClient.put(`${rutaBase(eventoId)}/${actividadId}`, payload);
        return normalizarActividadResponse(data);
      } catch (err) {
        if (err.response?.status === 409) {
          const respData = err.response.data || {};
          const errDetalle = new Error(respData.message || 'Conflicto al actualizar la actividad');
          errDetalle.codigo = respData.codigo;
          errDetalle.conflictos = respData.conflictos || [];
          errDetalle.advertencias = respData.advertencias || [];
          errDetalle.response = err.response;
          throw errDetalle;
        }
        // Sin fallback al mock: el formulario muestra el error en vez de anunciar cambios no guardados.
        throw err;
      }
    }

    // Modo Mock
    await new Promise((r) => setTimeout(r, 120));
    const todas = obtenerActividadesMock();
    const index = todas.findIndex((a) => String(a.id) === String(actividadId));
    if (index === -1) {
      const err = new Error('No se encontró la actividad a modificar.');
      err.response = { status: 404 };
      throw err;
    }

    const actualizada = {
      ...todas[index],
      ...datosActividad,
      id: Number(actividadId),
      eventoId: Number(eventoId),
      salaId: Number(datosActividad.salaId),
      ponenteId: datosActividad.ponenteId ? Number(datosActividad.ponenteId) : null,
      permiteSimultaneidad: Boolean(datosActividad.simultanea ?? datosActividad.permiteSimultaneidad),
      simultanea: Boolean(datosActividad.simultanea ?? datosActividad.permiteSimultaneidad),
      actualizadoEn: new Date().toISOString(),
    };

    todas[index] = actualizada;
    guardarActividadesMock(todas);
    return normalizarActividadResponse(actualizada);
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
    if (USE_REAL_BACKEND) {
      // Sin fallback al mock: si el borrado falla, el error llega a la pantalla.
      await httpClient.delete(`${rutaBase(eventoId)}/${actividadId}`);
      return { ok: true };
    }

    // Modo Mock
    await new Promise((r) => setTimeout(r, 100));
    const todas = obtenerActividadesMock();
    const filtradas = todas.filter((a) => String(a.id) !== String(actividadId));
    guardarActividadesMock(filtradas);
    return { ok: true };
  },

  /**
   * Método auxiliar para listar actividades desde mock
   * @private
   */
  _listarMock(eventoId, fecha) {
    const todas = obtenerActividadesMock();
    const filtradas = todas.filter((a) => {
      const coincideEvento = !a.eventoId || String(a.eventoId) === String(eventoId);
      const coincideFecha = !fecha || a.fecha === fecha;
      return coincideEvento && coincideFecha;
    });
    return ordenarCronologicamente(filtradas.map(normalizarActividadResponse));
  },

  /**
   * Reinicia los datos mock a los valores iniciales para pruebas.
   */
  reiniciarMock() {
    return reiniciarActividadesMock();
  },
};

export default actividadService;
