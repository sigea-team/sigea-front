/**
 * @file presupuestoMock.js
 * @description Datos y API simulada del presupuesto preliminar, solo para Storybook.
 * Imita las respuestas y reglas del backend de la HU-07 sin necesidad de servidor:
 * total de los rubros vigentes, nombre único, borrado lógico, historial y bloqueo por
 * estado del evento o presupuesto aprobado.
 * @module features/presupuesto/mocks/presupuestoMock
 */

import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { MENSAJES_RUBRO, calcularSubtotal, normalizarNombre } from '../presupuestoUtils';

/** Estados del evento en los que el presupuesto se puede modificar (igual que el backend). */
const ESTADOS_EDITABLES = ['en_configuracion', 'habilitado'];

/** Rubros iniciales. El evento 3 tiene un rubro eliminado (historial). */
export const RUBROS_MOCK = [
  { id: 1, eventoId: 3, nombre: 'Transporte de conferencistas', cantidad: 2, valorUnitarioProyectado: 350000, activo: true },
  { id: 2, eventoId: 3, nombre: 'Refrigerios', cantidad: 150, valorUnitarioProyectado: 7500, activo: true },
  { id: 3, eventoId: 3, nombre: 'Hospedaje', cantidad: 3, valorUnitarioProyectado: 220000, activo: false },
  { id: 4, eventoId: 3, nombre: 'Material impreso', cantidad: 200, valorUnitarioProyectado: 2500, activo: true },
  { id: 5, eventoId: 3, nombre: 'Auditorio institucional', cantidad: 1, valorUnitarioProyectado: 0, activo: true },
  { id: 6, eventoId: 2, nombre: 'Refrigerios', cantidad: 120, valorUnitarioProyectado: 7000, activo: true },
  { id: 7, eventoId: 2, nombre: 'Certificados', cantidad: 120, valorUnitarioProyectado: 1500, activo: true },
];

const USUARIO_MOCK = { usuarioId: 2, usuarioNombre: 'Cristian Rodríguez' };

/** Historial inicial del evento 3, coherente con RUBROS_MOCK (del más antiguo al más reciente). */
export const HISTORIAL_MOCK = [
  {
    id: 1, rubroId: 1, eventoId: 3, tipoOperacion: 'creacion',
    nombreNuevo: 'Transporte', cantidadNueva: 2, valorUnitarioNuevo: 300000,
    totalPresupuestoAnterior: 0, totalPresupuestoNuevo: 600000, motivo: null,
    fechaHora: '2026-09-02T09:15:00',
  },
  {
    id: 2, rubroId: 2, eventoId: 3, tipoOperacion: 'creacion',
    nombreNuevo: 'Refrigerios', cantidadNueva: 150, valorUnitarioNuevo: 7500,
    totalPresupuestoAnterior: 600000, totalPresupuestoNuevo: 1725000, motivo: null,
    fechaHora: '2026-09-02T09:20:00',
  },
  {
    id: 3, rubroId: 3, eventoId: 3, tipoOperacion: 'creacion',
    nombreNuevo: 'Hospedaje', cantidadNueva: 3, valorUnitarioNuevo: 220000,
    totalPresupuestoAnterior: 1725000, totalPresupuestoNuevo: 2385000, motivo: null,
    fechaHora: '2026-09-02T09:25:00',
  },
  {
    id: 4, rubroId: 4, eventoId: 3, tipoOperacion: 'creacion',
    nombreNuevo: 'Material impreso', cantidadNueva: 200, valorUnitarioNuevo: 2500,
    totalPresupuestoAnterior: 2385000, totalPresupuestoNuevo: 2885000, motivo: null,
    fechaHora: '2026-09-03T11:00:00',
  },
  {
    id: 5, rubroId: 1, eventoId: 3, tipoOperacion: 'edicion',
    nombreAnterior: 'Transporte', cantidadAnterior: 2, valorUnitarioAnterior: 300000,
    nombreNuevo: 'Transporte de conferencistas', cantidadNueva: 2, valorUnitarioNuevo: 350000,
    totalPresupuestoAnterior: 2885000, totalPresupuestoNuevo: 2985000, motivo: 'Tarifa actualizada por la agencia de viajes',
    fechaHora: '2026-09-10T15:40:00',
  },
  {
    id: 6, rubroId: 3, eventoId: 3, tipoOperacion: 'eliminacion',
    nombreAnterior: 'Hospedaje', cantidadAnterior: 3, valorUnitarioAnterior: 220000,
    totalPresupuestoAnterior: 2985000, totalPresupuestoNuevo: 2325000, motivo: 'El hospedaje lo cubre la universidad invitada',
    fechaHora: '2026-09-15T08:30:00',
  },
  {
    id: 7, rubroId: 5, eventoId: 3, tipoOperacion: 'creacion',
    nombreNuevo: 'Auditorio institucional', cantidadNueva: 1, valorUnitarioNuevo: 0,
    totalPresupuestoAnterior: 2325000, totalPresupuestoNuevo: 2325000, motivo: 'Préstamo sin costo de la UFPS',
    fechaHora: '2026-09-16T10:05:00',
  },
];

const esperar = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

/** Fecha y hora local sin zona, como la devuelve el backend (LocalDateTime). */
const ahora = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
};

/**
 * Crea una API simulada con estado en memoria y las mismas reglas del backend.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.rubros=RUBROS_MOCK]
 * @param {Array<Object>} [opciones.historial=HISTORIAL_MOCK]
 * @param {Array<Object>} [opciones.eventos=EVENTOS_MOCK] - Se usa el estado del evento.
 * @param {Array<number>} [opciones.aprobados=[]] - IDs de eventos con presupuesto aprobado (HU-08).
 */
export function crearPresupuestoApiMock({
  rubros = RUBROS_MOCK,
  historial = HISTORIAL_MOCK,
  eventos = EVENTOS_MOCK,
  aprobados = [],
} = {}) {
  const lista = rubros.map((r) => ({ ...r }));
  const registros = historial.map((h) => ({ ...USUARIO_MOCK, ...h }));
  let siguienteRubro = Math.max(0, ...lista.map((r) => r.id)) + 1;
  let siguienteHistorial = Math.max(0, ...registros.map((h) => h.id)) + 1;

  // Los eventos creados en vivo en la story de EventosPage nacen en configuración.
  const buscarEvento = (id) =>
    eventos.find((e) => e.id === Number(id)) || { id: Number(id), nombre: `Evento ${id}`, estado: 'en_configuracion' };

  const vigentes = (eventoId) => lista.filter((r) => r.eventoId === Number(eventoId) && r.activo);
  const total = (eventoId) =>
    Math.round(vigentes(eventoId).reduce((suma, r) => suma + calcularSubtotal(r.cantidad, r.valorUnitarioProyectado), 0) * 100) / 100;

  const aRespuesta = (r) => ({
    id: r.id,
    eventoId: r.eventoId,
    nombre: r.nombre,
    cantidad: r.cantidad,
    valorUnitarioProyectado: r.valorUnitarioProyectado,
    subtotal: calcularSubtotal(r.cantidad, r.valorUnitarioProyectado),
    activo: r.activo,
  });

  const validarEditable = (evento) => {
    if (!ESTADOS_EDITABLES.includes(evento.estado)) {
      throw errorApi(
        409,
        `El presupuesto preliminar del evento '${evento.nombre}' ya no puede modificarse (estado actual: ${evento.estado}). ` +
          'Solo se permiten cambios mientras el evento está en en_configuracion o habilitado.',
        { codigo: 'OPERACION_NO_PERMITIDA' }
      );
    }
    if (aprobados.includes(evento.id)) {
      throw errorApi(409, `El evento '${evento.nombre}' ya tiene un presupuesto aprobado; el presupuesto preliminar no puede modificarse.`, {
        codigo: 'OPERACION_NO_PERMITIDA',
      });
    }
  };

  /** Mismas validaciones de Bean Validation que RubroRequest (Criterio 3). */
  const validarPeticion = ({ nombre, cantidad, valorUnitarioProyectado }) => {
    const errores = {};
    if (!normalizarNombre(nombre)) errores.nombre = MENSAJES_RUBRO.nombreObligatorio;
    if (cantidad !== undefined && cantidad < 0) errores.cantidad = MENSAJES_RUBRO.cantidad.negativo;
    if (valorUnitarioProyectado === null || valorUnitarioProyectado === undefined) {
      errores.valorUnitarioProyectado = MENSAJES_RUBRO.valor.obligatorio;
    } else if (valorUnitarioProyectado < 0) {
      errores.valorUnitarioProyectado = MENSAJES_RUBRO.valor.negativo;
    }
    if (Object.keys(errores).length > 0) {
      throw errorApi(400, 'Los datos enviados no cumplen con los requisitos o políticas exigidas.', {
        codigo: 'VALIDACION_FALLIDA',
        erroresValidacion: errores,
      });
    }
  };

  const validarDuplicado = (evento, nombre, idExcluir) => {
    if (vigentes(evento.id).some((r) => r.id !== idExcluir && r.nombre.toLowerCase() === nombre.toLowerCase())) {
      throw errorApi(409, `Ya existe un rubro llamado '${nombre}' en el presupuesto preliminar del evento '${evento.nombre}'.`, {
        codigo: 'RUBRO_DUPLICADO',
      });
    }
  };

  const buscarRubro = (eventoId, rubroId) => {
    const rubro = lista.find((r) => r.id === Number(rubroId) && r.eventoId === Number(eventoId));
    if (!rubro) throw errorApi(404, `No se encontró el rubro con ID ${rubroId} en el presupuesto del evento ${eventoId}.`);
    if (!rubro.activo) {
      throw errorApi(409, `El rubro '${rubro.nombre}' ya fue eliminado del presupuesto preliminar.`, { codigo: 'OPERACION_NO_PERMITIDA' });
    }
    return rubro;
  };

  const registrar = (datos) => {
    registros.push({ id: siguienteHistorial++, fechaHora: ahora(), ...USUARIO_MOCK, motivo: null, ...datos });
  };

  return {
    async consultarPresupuesto(eventoId, incluirEliminados = false) {
      await esperar();
      const evento = buscarEvento(eventoId);
      const aprobado = aprobados.includes(evento.id);
      const delEvento = lista
        .filter((r) => r.eventoId === evento.id && (incluirEliminados || r.activo))
        .sort((a, b) => Number(b.activo) - Number(a.activo) || a.id - b.id);
      return {
        eventoId: evento.id,
        eventoNombre: evento.nombre,
        estadoEvento: evento.estado,
        rubros: delEvento.map(aRespuesta),
        cantidadRubros: vigentes(evento.id).length,
        total: total(evento.id),
        presupuestoAprobado: aprobado,
        editable: !aprobado && ESTADOS_EDITABLES.includes(evento.estado),
      };
    },

    async agregarRubro(eventoId, peticion) {
      await esperar();
      const evento = buscarEvento(eventoId);
      validarEditable(evento);
      validarPeticion(peticion);
      const nombre = normalizarNombre(peticion.nombre);
      validarDuplicado(evento, nombre);

      const totalAnterior = total(evento.id);
      const rubro = {
        id: siguienteRubro++,
        eventoId: evento.id,
        nombre,
        cantidad: peticion.cantidad ?? 1,
        valorUnitarioProyectado: peticion.valorUnitarioProyectado,
        activo: true,
      };
      lista.push(rubro);
      registrar({
        rubroId: rubro.id, eventoId: evento.id, tipoOperacion: 'creacion',
        nombreNuevo: rubro.nombre, cantidadNueva: rubro.cantidad, valorUnitarioNuevo: rubro.valorUnitarioProyectado,
        totalPresupuestoAnterior: totalAnterior, totalPresupuestoNuevo: total(evento.id), motivo: peticion.motivo ?? null,
      });
      return { rubro: aRespuesta(rubro), totalPresupuesto: total(evento.id), cantidadRubros: vigentes(evento.id).length };
    },

    async actualizarRubro(eventoId, rubroId, peticion) {
      await esperar();
      const evento = buscarEvento(eventoId);
      validarEditable(evento);
      const rubro = buscarRubro(eventoId, rubroId);
      validarPeticion(peticion);
      const nombre = normalizarNombre(peticion.nombre);
      const cantidad = peticion.cantidad ?? 1;
      const sinCambios =
        rubro.nombre === nombre && rubro.cantidad === cantidad && rubro.valorUnitarioProyectado === peticion.valorUnitarioProyectado;
      if (!sinCambios) {
        validarDuplicado(evento, nombre, rubro.id);
        const totalAnterior = total(evento.id);
        const antes = { ...rubro };
        Object.assign(rubro, { nombre, cantidad, valorUnitarioProyectado: peticion.valorUnitarioProyectado });
        registrar({
          rubroId: rubro.id, eventoId: evento.id, tipoOperacion: 'edicion',
          nombreAnterior: antes.nombre, cantidadAnterior: antes.cantidad, valorUnitarioAnterior: antes.valorUnitarioProyectado,
          nombreNuevo: rubro.nombre, cantidadNueva: rubro.cantidad, valorUnitarioNuevo: rubro.valorUnitarioProyectado,
          totalPresupuestoAnterior: totalAnterior, totalPresupuestoNuevo: total(evento.id), motivo: peticion.motivo ?? null,
        });
      }
      return { rubro: aRespuesta(rubro), totalPresupuesto: total(evento.id), cantidadRubros: vigentes(evento.id).length };
    },

    async eliminarRubro(eventoId, rubroId, motivo) {
      await esperar();
      const evento = buscarEvento(eventoId);
      validarEditable(evento);
      const rubro = buscarRubro(eventoId, rubroId);
      const totalAnterior = total(evento.id);
      rubro.activo = false;
      registrar({
        rubroId: rubro.id, eventoId: evento.id, tipoOperacion: 'eliminacion',
        nombreAnterior: rubro.nombre, cantidadAnterior: rubro.cantidad, valorUnitarioAnterior: rubro.valorUnitarioProyectado,
        totalPresupuestoAnterior: totalAnterior, totalPresupuestoNuevo: total(evento.id), motivo: motivo || null,
      });
      return { rubro: aRespuesta(rubro), totalPresupuesto: total(evento.id), cantidadRubros: vigentes(evento.id).length };
    },

    async historialPresupuesto(eventoId) {
      await esperar();
      buscarEvento(eventoId);
      return registros
        .filter((h) => h.eventoId === Number(eventoId))
        .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora) || b.id - a.id)
        .map((h) => ({
          ...h,
          subtotalAnterior: h.nombreAnterior ? calcularSubtotal(h.cantidadAnterior, h.valorUnitarioAnterior) : null,
          subtotalNuevo: h.nombreNuevo ? calcularSubtotal(h.cantidadNueva, h.valorUnitarioNuevo) : null,
        }));
    },
  };
}

/** API simulada que siempre falla al cargar, para mostrar el estado de error en Storybook. */
export const presupuestoApiMockConError = {
  async consultarPresupuesto() {
    await esperar(200);
    const err = new Error('Network Error');
    err.request = {};
    throw err;
  },
  async agregarRubro() {
    throw new Error('No disponible');
  },
  async actualizarRubro() {
    throw new Error('No disponible');
  },
  async eliminarRubro() {
    throw new Error('No disponible');
  },
  async historialPresupuesto() {
    throw new Error('No disponible');
  },
};
