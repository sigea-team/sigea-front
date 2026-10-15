/**
 * @file tiposEventoMock.js
 * @description Catálogo y API simulada de tipos de evento, solo para Storybook.
 * Imita las reglas del backend (TipoEventoService): nombre único sin distinguir mayúsculas y
 * no se elimina un tipo que use algún evento.
 * @module features/eventos/mocks/tiposEventoMock
 */

import { normalizarNombre } from '../parametroUtils';

export const TIPOS_EVENTO_MOCK = [
  { id: 1, nombre: 'Congreso', descripcion: 'Evento de varios días con conferencias y ponencias evaluadas' },
  { id: 2, nombre: 'Seminario', descripcion: null },
  { id: 3, nombre: 'Taller', descripcion: 'Sesión práctica con cupo limitado' },
  { id: 4, nombre: 'Hackatón', descripcion: 'Maratón de desarrollo por equipos' },
];

const esperar = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, codigo) {
  const err = new Error(message);
  err.response = { status, data: { status, message, codigo } };
  return err;
}

const ordenar = (lista) =>
  [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }) || a.id - b.id);

/**
 * Crea una API simulada del catálogo con estado en memoria.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.tipos=TIPOS_EVENTO_MOCK]
 * @param {function(number): number} [opciones.contarUso] - Cuántos eventos usan el tipo (por defecto 0).
 */
export function crearApiTiposEventoMock({ tipos = TIPOS_EVENTO_MOCK, contarUso = () => 0 } = {}) {
  let catalogo = tipos.map((t) => ({ ...t }));
  let siguienteId = Math.max(0, ...catalogo.map((t) => t.id)) + 1;

  const buscar = (id) => {
    const tipo = catalogo.find((t) => t.id === Number(id));
    if (!tipo) throw errorApi(404, `No se encontró el tipo de evento con ID: ${id}`, 'RECURSO_NO_ENCONTRADO');
    return tipo;
  };

  const duplicado = (nombre, excluirId) =>
    catalogo.some((t) => t.id !== excluirId && t.nombre.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'));

  return {
    /** Nombre de un tipo por ID, para que la API simulada de eventos muestre el nombre. */
    nombreDe(id) {
      return catalogo.find((t) => t.id === Number(id))?.nombre ?? null;
    },

    async listar() {
      await esperar();
      return ordenar(catalogo);
    },

    async crear(datos) {
      await esperar();
      const nombre = normalizarNombre(datos.nombre);
      if (duplicado(nombre)) throw errorApi(409, `Ya existe un tipo de evento llamado '${nombre}'.`, 'PARAMETRO_DUPLICADO');
      const nuevo = { id: siguienteId++, nombre, descripcion: datos.descripcion || null };
      catalogo.push(nuevo);
      return { ...nuevo };
    },

    async actualizar(id, datos) {
      await esperar();
      const tipo = buscar(id);
      const nombre = normalizarNombre(datos.nombre);
      if (duplicado(nombre, tipo.id)) throw errorApi(409, `Ya existe un tipo de evento llamado '${nombre}'.`, 'PARAMETRO_DUPLICADO');
      Object.assign(tipo, { nombre, descripcion: datos.descripcion || null });
      return { ...tipo };
    },

    async consultarUso(id) {
      await esperar(200);
      const tipo = buscar(id);
      const eventos = contarUso(tipo.id);
      return { id: tipo.id, nombre: tipo.nombre, eventos, eliminable: eventos === 0 };
    },

    async eliminar(id) {
      await esperar();
      const tipo = buscar(id);
      const eventos = contarUso(tipo.id);
      if (eventos > 0) {
        throw errorApi(
          409,
          `No se puede eliminar el tipo de evento '${tipo.nombre}' porque lo usan ${eventos} evento(s).`,
          'PARAMETRO_EN_USO'
        );
      }
      catalogo = catalogo.filter((t) => t.id !== tipo.id);
    },
  };
}

/** API simulada que siempre falla, para mostrar el estado de error en Storybook. */
export const apiTiposEventoConError = {
  nombreDe: () => null,
  listar: async () => {
    await esperar();
    const err = new Error('Network Error');
    err.request = {};
    throw err;
  },
};
