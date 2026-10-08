/**
 * @file parametrosMock.js
 * @description Datos y API simulada de los parámetros del evento (HU-05), solo para Storybook.
 * Imita las respuestas y reglas del backend: nombre único por evento sin distinguir mayúsculas
 * (409 PARAMETRO_DUPLICADO), bloqueo de eliminación si está en uso (409 PARAMETRO_EN_USO) y
 * solo lectura con el evento en ejecución o cerrado (409 OPERACION_NO_PERMITIDA).
 * @module features/eventos/mocks/parametrosMock
 */

import { EVENTOS_MOCK } from './eventosMock';

/** Catálogos iniciales por evento. `usoActividades` y `usoPropuestas` simulan la tabla de uso. */
const PARAMETROS_MOCK = {
  3: {
    tipos: [
      { id: 1, nombre: 'Conferencia', descripcion: 'Charla magistral de un invitado, 45 a 60 minutos.', usoActividades: 4 },
      { id: 2, nombre: 'Panel', descripcion: 'Conversación moderada entre tres o cuatro invitados.', usoActividades: 0 },
      { id: 3, nombre: 'Ponencia', descripcion: 'Presentación de un trabajo aprobado por el comité técnico.', usoActividades: 9 },
      { id: 4, nombre: 'Taller', descripcion: 'Sesión práctica de 2 a 4 horas con cupo limitado.', usoActividades: 3 },
    ],
    lineas: [
      { id: 11, nombre: 'Ingeniería de software', descripcion: 'Procesos, calidad, arquitectura y pruebas.', usoActividades: 1, usoPropuestas: 5 },
      { id: 12, nombre: 'Inteligencia artificial y ciencia de datos', descripcion: null, usoActividades: 0, usoPropuestas: 2 },
      { id: 13, nombre: 'Redes y seguridad informática', descripcion: 'Infraestructura, ciberseguridad y telecomunicaciones.', usoActividades: 0, usoPropuestas: 0 },
    ],
  },
  2: {
    tipos: [
      { id: 21, nombre: 'Conferencia', descripcion: null, usoActividades: 6 },
      { id: 22, nombre: 'Taller', descripcion: null, usoActividades: 4 },
    ],
    lineas: [{ id: 31, nombre: 'Ingeniería de software', descripcion: null, usoActividades: 3, usoPropuestas: 12 }],
  },
};

const esperar = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

const normalizar = (t) => (t || '').trim().replace(/\s+/g, ' ');
const clave = (t) => normalizar(t).toLocaleLowerCase('es');
const aRespuesta = (eventoId) => ({ id, nombre, descripcion }) => ({ id, eventoId, nombre, descripcion });
const NOMBRE = { tipos: 'un tipo de actividad llamado', lineas: 'una línea temática llamada' };
const SINGULAR = { tipos: 'el tipo de actividad', lineas: 'la línea temática' };

/**
 * Crea una API simulada con estado en memoria.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.eventos=EVENTOS_MOCK] - Eventos, para aplicar la regla de estado.
 * @param {Object} [opciones.datos=PARAMETROS_MOCK] - Catálogos iniciales por evento.
 */
export function crearApiParametrosMock({ eventos = EVENTOS_MOCK, datos = PARAMETROS_MOCK } = {}) {
  const store = {};
  Object.entries(datos).forEach(([eventoId, c]) => {
    store[eventoId] = { tipos: c.tipos.map((x) => ({ ...x })), lineas: c.lineas.map((x) => ({ ...x })) };
  });
  let siguienteId = 1000;

  const catalogoDe = (catalogo, eventoId) => {
    if (!store[eventoId]) store[eventoId] = { tipos: [], lineas: [] };
    return store[eventoId][catalogo];
  };

  const validarModificable = (eventoId) => {
    const evento = eventos.find((e) => e.id === Number(eventoId));
    if (evento && !['en_configuracion', 'habilitado'].includes(evento.estado)) {
      throw errorApi(409, `Los parámetros del evento '${evento.nombre}' ya no pueden modificarse (estado actual: ${evento.estado}).`, {
        codigo: 'OPERACION_NO_PERMITIDA',
      });
    }
  };

  const buscar = (catalogo, eventoId, id) => {
    const item = catalogoDe(catalogo, eventoId).find((x) => x.id === Number(id));
    if (!item) throw errorApi(404, `No se encontró el elemento con ID ${id} en el evento ${eventoId}.`, { codigo: 'RECURSO_NO_ENCONTRADO' });
    return item;
  };

  const validarDuplicado = (catalogo, eventoId, nombre, excluirId) => {
    if (catalogoDe(catalogo, eventoId).some((x) => x.id !== excluirId && clave(x.nombre) === clave(nombre))) {
      throw errorApi(409, `Ya existe ${NOMBRE[catalogo]} '${normalizar(nombre)}' en este evento.`, { codigo: 'PARAMETRO_DUPLICADO' });
    }
  };

  return {
    async listar(catalogo, eventoId) {
      await esperar();
      return [...catalogoDe(catalogo, eventoId)]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
        .map(aRespuesta(Number(eventoId)));
    },

    async crear(catalogo, eventoId, { nombre, descripcion }) {
      await esperar();
      validarModificable(eventoId);
      validarDuplicado(catalogo, eventoId, nombre);
      const nuevo = { id: siguienteId++, nombre: normalizar(nombre), descripcion: descripcion || null, usoActividades: 0, usoPropuestas: 0 };
      catalogoDe(catalogo, eventoId).push(nuevo);
      return aRespuesta(Number(eventoId))(nuevo);
    },

    async actualizar(catalogo, eventoId, id, { nombre, descripcion }) {
      await esperar();
      validarModificable(eventoId);
      const item = buscar(catalogo, eventoId, id);
      validarDuplicado(catalogo, eventoId, nombre, item.id);
      Object.assign(item, { nombre: normalizar(nombre), descripcion: descripcion || null });
      return aRespuesta(Number(eventoId))(item);
    },

    async consultarUso(catalogo, eventoId, id) {
      await esperar(300);
      const item = buscar(catalogo, eventoId, id);
      const actividades = item.usoActividades || 0;
      const propuestas = catalogo === 'lineas' ? item.usoPropuestas || 0 : 0;
      return { id: item.id, nombre: item.nombre, actividades, propuestas, eliminable: actividades === 0 && propuestas === 0 };
    },

    async eliminar(catalogo, eventoId, id) {
      await esperar();
      validarModificable(eventoId);
      const item = buscar(catalogo, eventoId, id);
      if ((item.usoActividades || 0) > 0 || (item.usoPropuestas || 0) > 0) {
        throw errorApi(409, `No se puede eliminar ${SINGULAR[catalogo]} '${item.nombre}' porque está en uso.`, { codigo: 'PARAMETRO_EN_USO' });
      }
      store[eventoId][catalogo] = catalogoDe(catalogo, eventoId).filter((x) => x.id !== item.id);
    },
  };
}

/** API simulada que siempre falla al cargar, para mostrar el estado de error en Storybook. */
export const apiParametrosConError = {
  listar: async () => {
    await esperar();
    const err = new Error('Network Error');
    err.request = {};
    throw err;
  },
};
