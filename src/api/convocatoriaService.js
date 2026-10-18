/**
 * @file convocatoriaService.js
 * @description Servicio API para la gestión de convocatorias (HU Crear convocatorias).
 * Conecta con el backend si está disponible y provee respaldo en memoria (localStorage/mock)
 * para garantizar la funcionalidad inmediata en frontend.
 * @module api/convocatoriaService
 */

import { httpClient } from './httpClient';

const STORAGE_KEY = 'sigea_convocatorias_mock';

const MOCK_INICIAL = [
  {
    id: 1,
    eventoId: 101,
    eventoNombre: 'Semana de la Ingeniería de Sistemas 2026-2',
    titulo: 'Convocatoria de Ponencias y Artículos de Investigación 2026',
    descripcion:
      'Invitamos a docentes, investigadores y estudiantes a presentar sus avances y ponencias en inteligencia artificial, ingeniería de software y seguridad informática.',
    requisitos:
      '1. Formato IEEE dos columnas.\n2. Máximo 6 páginas.\n3. Resumen en español e inglés.\n4. Identificación clara de autor principal, coautores y ponentes.',
    fechaApertura: '2026-01-01T08:00',
    fechaCierre: '2026-12-31T23:59',
    estado: 'PUBLICADA', // Convocatoria activa para envío de propuestas
    creadoEn: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 2,
    eventoId: 102,
    eventoNombre: 'Encuentro de Semilleros de Investigación UFPS',
    titulo: 'Convocatoria Posters Científicos y Proyectos de Grado',
    descripcion:
      'Espacio para la socialización de proyectos de semillero en fases preliminar y de resultados finales.',
    requisitos:
      '1. Afiliación activa a semillero de investigación avalado.\n2. Poster en dimensiones estándar 90x120cm.\n3. Resumen estructurado de máximo 500 palabras.',
    fechaApertura: '2026-09-01T08:00',
    fechaCierre: '2026-12-15T18:00',
    estado: 'PUBLICADA',
    creadoEn: '2026-09-01T08:00:00.000Z',
  },
];

function cargarMock() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_INICIAL));
      return [...MOCK_INICIAL];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_INICIAL];
  } catch (e) {
    return [...MOCK_INICIAL];
  }
}

function guardarMock(lista) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch (e) {
    // ignore
  }
}

/**
 * Lista todas las convocatorias registradas.
 * Si el usuario no es administrador o el backend responde 403 / error,
 * recurre al catálogo local para que los ponentes puedan ver convocatorias y enviar propuestas.
 * @param {boolean} [esAdmin=true]
 * @returns {Promise<Array<Object>>}
 */
export async function listarConvocatorias(esAdmin = true) {
  if (!esAdmin) {
    return cargarMock();
  }

  try {
    const { data } = await httpClient.get('/convocatorias');
    if (Array.isArray(data) && data.length > 0) {
      guardarMock(data);
      return data;
    }
    return cargarMock();
  } catch (err) {
    console.warn('[convocatoriaService] Fallback a datos locales por restricción del backend:', err?.response?.status || err?.message);
    return cargarMock();
  }
}

/**
 * Consulta una convocatoria por su ID.
 * @param {number|string} id
 */
export async function obtenerConvocatoria(id) {
  try {
    const { data } = await httpClient.get(`/convocatorias/${id}`);
    return data;
  } catch {
    const lista = cargarMock();
    return lista.find((c) => String(c.id) === String(id)) || null;
  }
}

/**
 * Guarda una nueva convocatoria en estado BORRADOR (Criterio 1).
 * @param {Object} convocatoria
 */
export async function crearConvocatoria(convocatoria) {
  const payload = {
    eventoId: Number(convocatoria.eventoId),
    titulo: convocatoria.titulo,
    descripcion: convocatoria.descripcion,
    requisitos: convocatoria.requisitos,
    fechaApertura: convocatoria.fechaApertura,
    fechaCierre: convocatoria.fechaCierre,
  };

  try {
    const { data } = await httpClient.post('/convocatorias', payload);
    return data;
  } catch {
    const lista = cargarMock();
    const nueva = {
      ...payload,
      id: Date.now(),
      eventoNombre: convocatoria.eventoNombre || 'Evento Académico UFPS',
      estado: 'BORRADOR',
      creadoEn: new Date().toISOString(),
    };
    lista.unshift(nueva);
    guardarMock(lista);
    return nueva;
  }
}

/**
 * Actualiza la información de una convocatoria existente sin publicarla (Criterio 3).
 * @param {number|string} id
 * @param {Object} cambios
 */
export async function actualizarConvocatoria(id, cambios) {
  const payload = {
    eventoId: Number(cambios.eventoId),
    titulo: cambios.titulo,
    descripcion: cambios.descripcion,
    requisitos: cambios.requisitos,
    fechaApertura: cambios.fechaApertura,
    fechaCierre: cambios.fechaCierre,
  };

  try {
    const { data } = await httpClient.put(`/convocatorias/${id}`, payload);
    return data;
  } catch {
    const lista = cargarMock();
    const index = lista.findIndex((c) => String(c.id) === String(id));
    if (index >= 0) {
      lista[index] = { ...lista[index], ...payload };
      guardarMock(lista);
      return lista[index];
    }
    return { ...payload, id };
  }
}

/**
 * Publica una convocatoria que se encuentra en borrador.
 * Endpoint: POST /api/v1/convocatorias/{id}/publicar
 * @param {number|string} id
 */
export async function publicarConvocatoria(id) {
  try {
    const { data } = await httpClient.post(`/convocatorias/${id}/publicar`);
    return data;
  } catch {
    const lista = cargarMock();
    const index = lista.findIndex((c) => String(c.id) === String(id));
    if (index >= 0) {
      lista[index].estado = 'PUBLICADA';
      guardarMock(lista);
      return lista[index];
    }
    return { id, estado: 'PUBLICADA' };
  }
}

/**
 * HU-11 (Criterio 2): modifica la fecha límite de una convocatoria publicada que aún no ha expirado.
 * El backend notifica el cambio (campana) a todos los usuarios activos.
 * Endpoint: PATCH /api/v1/convocatorias/{id}/fecha-cierre
 * @param {number|string} id
 * @param {string} fechaCierre - Nueva fecha y hora límite (YYYY-MM-DDTHH:mm).
 * @returns {Promise<{ convocatoria: Object, fechaCierreAnterior: string, usuariosNotificados: number }>}
 */
export async function actualizarFechaCierre(id, fechaCierre) {
  const { data } = await httpClient.patch(`/convocatorias/${id}/fecha-cierre`, { fechaCierre });
  return data;
}

/**
 * HU-11 (Criterio 1): consulta pública de convocatorias publicadas (no requiere sesión).
 * Endpoint: GET /api/v1/publico/convocatorias
 * @param {number|string} [eventoId] - Filtra por evento.
 * @returns {Promise<Array<Object>>}
 */
export async function listarConvocatoriasPublicadas(eventoId) {
  const params = eventoId ? { eventoId } : undefined;
  const { data } = await httpClient.get('/publico/convocatorias', { params });
  return Array.isArray(data) ? data : [];
}

/**
 * HU-11 (Criterio 1): detalle público de una convocatoria publicada (404 si no está publicada).
 * Endpoint: GET /api/v1/publico/convocatorias/{id}
 * @param {number|string} id
 */
export async function obtenerConvocatoriaPublicada(id) {
  const { data } = await httpClient.get(`/publico/convocatorias/${id}`);
  return data;
}

/**
 * Elimina una convocatoria en borrador.
 * @param {number|string} id
 */
export async function eliminarConvocatoria(id) {
  try {
    const { data } = await httpClient.delete(`/convocatorias/${id}`);
    return data;
  } catch {
    const lista = cargarMock().filter((c) => String(c.id) !== String(id));
    guardarMock(lista);
    return { exito: true };
  }
}

export const convocatoriaService = {
  listarConvocatorias,
  obtenerConvocatoria,
  crearConvocatoria,
  actualizarConvocatoria,
  publicarConvocatoria,
  actualizarFechaCierre,
  listarConvocatoriasPublicadas,
  obtenerConvocatoriaPublicada,
  eliminarConvocatoria,
};
