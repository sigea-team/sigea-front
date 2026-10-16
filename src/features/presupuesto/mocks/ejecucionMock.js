/**
 * @file ejecucionMock.js
 * @description Datos y API simulada de la ejecución presupuestal (HU-09), solo para Storybook.
 * Imita las respuestas y reglas del backend sin necesidad de servidor:
 * - Requiere presupuesto aprobado, rubro vigente y evento no cerrado para registrar gastos.
 * - Valor obligatorio y no negativo (el 0 se acepta); soporte opcional; fecha no futura.
 * - Un gasto puede superar el disponible del rubro: se registra y la respuesta lo indica.
 * - Sin gastos, la ejecución es 0 %.
 * @module features/presupuesto/mocks/ejecucionMock
 */

import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { RUBROS_MOCK } from './presupuestoMock';
import { calcularSubtotal, formatearPesos } from '../presupuestoUtils';
import { MENSAJES_GASTO, hoyIso } from '../ejecucionUtils';

/** Presupuesto aprobado vigente por evento (HU-08). Los eventos que no aparecen no tienen aprobado. */
export const APROBADOS_EJECUCION_MOCK = { 3: 2500000, 2: 1100000 };

const USUARIO_MOCK = { registradoPorId: 2, registradoPorNombre: 'Cristian Rodríguez' };

/** Gastos iniciales. En el evento 3, «Transporte de conferencistas» ya superó su valor presupuestado. */
export const GASTOS_MOCK = [
  { id: 1, rubroId: 1, descripcion: 'Tiquetes aéreos del conferencista invitado', valor: 450000, fechaGasto: '2026-10-02', soporteUrl: 'https://drive.ufps.edu.co/gastos/factura-0451.pdf' },
  { id: 2, rubroId: 2, descripcion: 'Refrigerios primer día', valor: 400000, fechaGasto: '2026-10-05', soporteUrl: 'Factura física 1187 — archivo de la dirección' },
  { id: 3, rubroId: 1, descripcion: 'Transporte terrestre aeropuerto – hotel', valor: 300000, fechaGasto: '2026-10-08', soporteUrl: null },
  { id: 4, rubroId: 6, descripcion: 'Refrigerios de las dos jornadas', valor: 800000, fechaGasto: '2025-10-22', soporteUrl: 'https://drive.ufps.edu.co/gastos/2025/refrigerios.pdf' },
  { id: 5, rubroId: 7, descripcion: 'Impresión de certificados', valor: 150000, fechaGasto: '2025-10-23', soporteUrl: null },
];

const esperar = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

const redondear = (n) => Math.round(n * 100) / 100;
const porcentaje = (parte, base) => (base > 0 ? redondear((parte * 100) / base) : 0);

/**
 * Crea una API simulada con estado en memoria y las mismas reglas del backend.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.rubros=RUBROS_MOCK] - Rubros del presupuesto preliminar (HU-07).
 * @param {Array<Object>} [opciones.gastos=GASTOS_MOCK]
 * @param {Object<number, number>} [opciones.aprobados=APROBADOS_EJECUCION_MOCK] - eventoId → valor aprobado.
 * @param {Array<Object>} [opciones.eventos=EVENTOS_MOCK] - Se usa el estado del evento.
 */
export function crearEjecucionApiMock({
  rubros = RUBROS_MOCK,
  gastos = GASTOS_MOCK,
  aprobados = APROBADOS_EJECUCION_MOCK,
  eventos = EVENTOS_MOCK,
} = {}) {
  const lista = gastos.map((g) => ({ ...USUARIO_MOCK, ...g }));
  let siguiente = Math.max(0, ...lista.map((g) => g.id)) + 1;

  const buscarEvento = (id) =>
    eventos.find((e) => e.id === Number(id)) || { id: Number(id), nombre: `Evento ${id}`, estado: 'en_configuracion' };
  const rubrosDe = (eventoId) => rubros.filter((r) => r.eventoId === Number(eventoId));
  const subtotal = (r) => calcularSubtotal(r.cantidad, r.valorUnitarioProyectado);
  const gastosDeRubro = (rubroId) => lista.filter((g) => g.rubroId === rubroId);
  const ejecutadoDe = (rubroId) => redondear(gastosDeRubro(rubroId).reduce((s, g) => s + g.valor, 0));

  const ejecucionRubro = (r) => {
    const presupuestado = subtotal(r);
    const ejecutado = ejecutadoDe(r.id);
    return {
      rubroId: r.id,
      nombre: r.nombre,
      presupuestado,
      ejecutado,
      disponible: redondear(presupuestado - ejecutado),
      porcentajeEjecucion: porcentaje(ejecutado, presupuestado),
      excedido: ejecutado > presupuestado,
      cantidadGastos: gastosDeRubro(r.id).length,
    };
  };

  const aRespuesta = (g) => {
    const rubro = rubros.find((r) => r.id === g.rubroId);
    return {
      id: g.id,
      eventoId: rubro?.eventoId,
      rubroId: g.rubroId,
      rubroNombre: rubro?.nombre,
      descripcion: g.descripcion ?? null,
      valor: g.valor,
      fechaGasto: g.fechaGasto,
      soporteUrl: g.soporteUrl ?? null,
      registradoPorId: g.registradoPorId,
      registradoPorNombre: g.registradoPorNombre,
    };
  };

  const totalEjecutado = (eventoId) => {
    const ids = rubrosDe(eventoId).map((r) => r.id);
    return redondear(lista.filter((g) => ids.includes(g.rubroId)).reduce((s, g) => s + g.valor, 0));
  };

  const ordenar = (a, b) => b.fechaGasto.localeCompare(a.fechaGasto) || b.id - a.id;

  return {
    async consultarEjecucion(eventoId) {
      await esperar();
      const evento = buscarEvento(eventoId);
      const aprobado = aprobados[evento.id];
      const valorAprobado = aprobado ?? 0;
      const vigentes = rubrosDe(evento.id).filter((r) => r.activo).sort((a, b) => a.id - b.id);
      const total = totalEjecutado(evento.id);
      const ids = rubrosDe(evento.id).map((r) => r.id);
      return {
        eventoId: evento.id,
        eventoNombre: evento.nombre,
        tienePresupuestoAprobado: aprobado !== undefined,
        valorTotalAprobado: valorAprobado,
        totalPresupuestadoRubros: redondear(vigentes.reduce((s, r) => s + subtotal(r), 0)),
        totalEjecutado: total,
        saldoDisponible: redondear(valorAprobado - total),
        porcentajeEjecucion: porcentaje(total, valorAprobado),
        cantidadGastos: lista.filter((g) => ids.includes(g.rubroId)).length,
        rubros: vigentes.map(ejecucionRubro),
      };
    },

    async registrarGasto(eventoId, peticion) {
      await esperar();
      const errores = {};
      if (peticion.valor === null || peticion.valor === undefined) errores.valor = MENSAJES_GASTO.valorObligatorio;
      else if (peticion.valor < 0) errores.valor = MENSAJES_GASTO.valorNegativo;
      if (!peticion.rubroId) errores.rubroId = MENSAJES_GASTO.rubroObligatorio;
      if (!peticion.fechaGasto) errores.fechaGasto = MENSAJES_GASTO.fechaObligatoria;
      else if (peticion.fechaGasto > hoyIso()) errores.fechaGasto = MENSAJES_GASTO.fechaFutura;
      if (Object.keys(errores).length > 0) {
        throw errorApi(400, 'Error de validación', { codigo: 'VALIDACION_FALLIDA', erroresValidacion: errores });
      }

      const evento = buscarEvento(eventoId);
      if (evento.estado === 'cerrado') {
        throw errorApi(409, 'No se pueden registrar gastos en un evento cerrado.', { codigo: 'OPERACION_NO_PERMITIDA' });
      }
      if (aprobados[evento.id] === undefined) {
        throw errorApi(409, 'No se pueden registrar gastos: el evento no tiene un presupuesto aprobado (HU-08).', {
          codigo: 'OPERACION_NO_PERMITIDA',
        });
      }
      const rubro = rubrosDe(evento.id).find((r) => r.id === Number(peticion.rubroId));
      if (!rubro) {
        throw errorApi(404, `No se encontró el rubro con ID ${peticion.rubroId} en el evento ${evento.id}.`);
      }
      if (!rubro.activo) {
        throw errorApi(409, `El rubro '${rubro.nombre}' fue eliminado del presupuesto y no admite gastos.`, {
          codigo: 'OPERACION_NO_PERMITIDA',
        });
      }

      const disponibleAntes = redondear(subtotal(rubro) - ejecutadoDe(rubro.id));
      const valor = redondear(peticion.valor);
      const gasto = {
        ...USUARIO_MOCK,
        id: siguiente++,
        rubroId: rubro.id,
        descripcion: peticion.descripcion || null,
        valor,
        fechaGasto: peticion.fechaGasto,
        soporteUrl: peticion.soporteUrl || null,
      };
      lista.push(gasto);

      const presupuestado = subtotal(rubro);
      const exceso = Math.max(redondear(ejecutadoDe(rubro.id) - presupuestado), 0);
      const excede = exceso > 0;
      const total = totalEjecutado(evento.id);
      return {
        gasto: aRespuesta(gasto),
        rubro: ejecucionRubro(rubro),
        valorTotalAprobado: aprobados[evento.id],
        totalEjecutado: total,
        porcentajeEjecucion: porcentaje(total, aprobados[evento.id]),
        excedioDisponible: excede,
        advertencia: !excede
          ? null
          : disponibleAntes < 0
          ? `El rubro '${rubro.nombre}' ya superaba lo presupuestado (${formatearPesos(presupuestado)}) en ${formatearPesos(-disponibleAntes)}. Con este gasto de ${formatearPesos(valor)} lo supera en ${formatearPesos(exceso)}.`
          : `El gasto de ${formatearPesos(valor)} supera el disponible del rubro '${rubro.nombre}' (${formatearPesos(disponibleAntes)}). El rubro supera lo presupuestado (${formatearPesos(presupuestado)}) en ${formatearPesos(exceso)}.`,
      };
    },

    async listarGastos(eventoId, rubroId) {
      await esperar(250);
      const ids = rubrosDe(eventoId).map((r) => r.id);
      return lista
        .filter((g) => ids.includes(g.rubroId) && (!rubroId || g.rubroId === Number(rubroId)))
        .sort(ordenar)
        .map(aRespuesta);
    },
  };
}

/** API simulada que siempre falla al cargar, para mostrar el estado de error en Storybook. */
export const ejecucionApiMockConError = {
  async consultarEjecucion() {
    await esperar(200);
    const err = new Error('Network Error');
    err.request = {};
    throw err;
  },
  async registrarGasto() {
    throw new Error('No disponible');
  },
  async listarGastos() {
    throw new Error('No disponible');
  },
};
