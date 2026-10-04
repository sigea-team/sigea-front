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
      'Invitamos a docentes, investigadores y estudiantes a presentar sus avances y artículos en ingeniería de software, ciberseguridad, inteligencia artificial y sistemas distribuidos.',
    requisitos:
      '1. Formato IEEE dos columnas.\n2. Máximo 6 páginas.\n3. Resumen en español e inglés.\n4. Cargar archivo en PDF sin datos de autor para revisión a ciegas.',
    fechaApertura: '2026-10-01T08:00',
    fechaCierre: '2026-11-15T23:59',
    estado: 'BORRADOR', // Criterio 1: Guardada en borrador
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
    fechaCierre: '2026-09-30T18:00', // Criterio 4: Fecha cumplida / cerrada
    estado: 'ABIERTA',
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
    return JSON.parse(raw);
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
 * @returns {Promise<Array<Object>>}
 */
export async function listarConvocatorias() {
  try {
    const { data } = await httpClient.get('/convocatorias');
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err) {
    // Fallback a almacenamiento local si el backend no tiene el endpoint activo
  }
  return cargarMock();
}

/**
 * Consulta una convocatoria por su ID.
 * @param {number|string} id
 */
export async function obtenerConvocatoria(id) {
  try {
    const { data } = await httpClient.get(`/convocatorias/${id}`);
    if (data) return data;
  } catch (err) {
    // Fallback
  }
  const lista = cargarMock();
  const encontrada = lista.find((c) => String(c.id) === String(id));
  if (!encontrada) throw new Error('Convocatoria no encontrada.');
  return encontrada;
}

/**
 * Guarda una nueva convocatoria en estado BORRADOR (Criterio 1).
 * @param {Object} convocatoria
 */
export async function crearConvocatoria(convocatoria) {
  const payload = {
    ...convocatoria,
    estado: 'BORRADOR', // Criterio 1: Guarda en estado borrador
  };

  try {
    const { data } = await httpClient.post('/convocatorias', payload);
    if (data) return data;
  } catch (err) {
    // Fallback local
  }

  const lista = cargarMock();
  const nueva = {
    id: Date.now(),
    ...payload,
    creadoEn: new Date().toISOString(),
  };
  lista.unshift(nueva);
  guardarMock(lista);
  return nueva;
}

/**
 * Actualiza la información de una convocatoria existente sin publicarla (Criterio 3).
 * @param {number|string} id
 * @param {Object} cambios
 */
export async function actualizarConvocatoria(id, cambios) {
  try {
    const { data } = await httpClient.put(`/convocatorias/${id}`, cambios);
    if (data) return data;
  } catch (err) {
    // Fallback local
  }

  const lista = cargarMock();
  const index = lista.findIndex((c) => String(c.id) === String(id));
  if (index === -1) throw new Error('Convocatoria no encontrada.');

  const actualizada = {
    ...lista[index],
    ...cambios,
    // Asegurar que si estaba en borrador continúe en borrador (Criterio 3)
    estado: lista[index].estado === 'BORRADOR' ? 'BORRADOR' : lista[index].estado,
    actualizadoEn: new Date().toISOString(),
  };

  lista[index] = actualizada;
  guardarMock(lista);
  return actualizada;
}

/**
 * Elimina una convocatoria en borrador.
 * @param {number|string} id
 */
export async function eliminarConvocatoria(id) {
  try {
    const { data } = await httpClient.delete(`/convocatorias/${id}`);
    return data;
  } catch (err) {
    // Fallback local
  }
  const lista = cargarMock();
  const filtradas = lista.filter((c) => String(c.id) !== String(id));
  guardarMock(filtradas);
  return { mensaje: 'Convocatoria eliminada correctamente.' };
}

export const convocatoriaService = {
  listarConvocatorias,
  obtenerConvocatoria,
  crearConvocatoria,
  actualizarConvocatoria,
  eliminarConvocatoria,
};
