/**
 * @file presupuestoAprobadoMock.js
 * @description API simulada y datos de prueba para Presupuesto Aprobado (HU-08: RF07), para Storybook y pruebas sin backend.
 * Imita las reglas del backend:
 * - Criterio 1: Registro formal con versión oficial vinculada al evento.
 * - Criterio 2: Actualización conservando versiones anteriores en el historial.
 * - Criterio 3: Validación estricta que exige evidencia documental de soporte.
 * @module features/presupuesto/mocks/presupuestoAprobadoMock
 */

import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';

/** Genera una fecha ISO local para las operaciones simuladas */
const ahoraIso = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
};

/** Mock inicial de versiones de presupuesto aprobado */
export const PRESUPUESTOS_APROBADOS_MOCK = [
  {
    id: 101,
    eventoId: 1, // Congreso 2024 (cerrado/histórico)
    version: 2,
    valorTotalAprobado: 24000000,
    resolucionOActa: 'Resolución Rectoral No. 112-2024',
    fechaAprobacion: '2024-09-15T09:30:00',
    evidenciaUrl: 'https://ufps.edu.co/repositorio/resolucion_112_2024.pdf',
    evidenciaNombre: 'Resolucion_112_2024_Presupuesto_Aprobado.pdf',
    evidenciaTamano: 1840000,
    aprobadoPor: { id: 1, nombreCompleto: 'Dr. Carlos Mendoza', rol: 'ADMIN' },
    justificacion: 'Adición presupuestal autorizada por decanatura para ponentes internacionales.',
    montoAnterior: 20000000,
    vigente: true,
  },
  {
    id: 100,
    eventoId: 1,
    version: 1,
    valorTotalAprobado: 20000000,
    resolucionOActa: 'Resolución Decanal No. 045-2024',
    fechaAprobacion: '2024-07-10T14:00:00',
    evidenciaUrl: 'https://ufps.edu.co/repositorio/resolucion_045_2024.pdf',
    evidenciaNombre: 'Resolucion_045_2024_Presupuesto_Inicial.pdf',
    evidenciaTamano: 1250000,
    aprobadoPor: { id: 1, nombreCompleto: 'Dr. Carlos Mendoza', rol: 'ADMIN' },
    justificacion: 'Aprobación inicial del presupuesto del congreso según partida del programa.',
    montoAnterior: null,
    vigente: false,
  },
];

/** Presupuestos preliminares de referencia por evento */
export const PRELIMINARES_MOCK = {
  1: { tienePreliminar: true, totalPreliminar: 22000000 },
  2: { tienePreliminar: true, totalPreliminar: 18000000 },
  3: { tienePreliminar: true, totalPreliminar: 13500000 }, // Evento habilitado con preliminar sin aprobación aún
  4: { tienePreliminar: false, totalPreliminar: 0 },       // Evento sin presupuesto preliminar
};

/**
 * Crea una API mock reactiva en memoria para simular HU-08.
 *
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.aprobados=PRESUPUESTOS_APROBADOS_MOCK]
 * @param {Object} [opciones.preliminares=PRELIMINARES_MOCK]
 * @param {Array<Object>} [opciones.eventos=EVENTOS_MOCK]
 */
export function crearPresupuestoAprobadoApiMock({
  aprobados = PRESUPUESTOS_APROBADOS_MOCK,
  preliminares = PRELIMINARES_MOCK,
  eventos = EVENTOS_MOCK,
} = {}) {
  let listaAprobados = aprobados.map((a) => ({ ...a }));
  let contadorId = Math.max(200, ...listaAprobados.map((a) => a.id)) + 1;

  const buscarEvento = (id) =>
    eventos.find((e) => e.id === Number(id)) || { id: Number(id), nombre: `Evento ${id}`, estado: 'habilitado' };

  return {
    async consultarPresupuestoAprobado(eventoId) {
      await new Promise((r) => setTimeout(r, 60));
      const ev = buscarEvento(eventoId);
      const prelim = preliminares[eventoId] ?? { tienePreliminar: true, totalPreliminar: 15000000 };

      // Buscar versiones para este evento, ordenadas de más reciente a más antigua
      const delEvento = listaAprobados
        .filter((a) => a.eventoId === Number(eventoId))
        .sort((a, b) => b.version - a.version);

      const vigente = delEvento.find((a) => a.vigente) || delEvento[0] || null;

      return {
        eventoId: ev.id,
        eventoNombre: ev.nombre,
        estadoEvento: ev.estado,
        tienePreliminar: prelim.tienePreliminar,
        totalPreliminar: prelim.totalPreliminar,
        aprobadoVigente: vigente,
        versiones: delEvento,
        editable: ['en_configuracion', 'habilitado'].includes(ev.estado),
      };
    },

    async registrarPresupuestoAprobado(eventoId, payload) {
      await new Promise((r) => setTimeout(r, 90));

      // Criterio 3: Validación de evidencia obligatoria
      const tieneEvidencia = payload instanceof FormData
        ? Boolean(payload.get('evidencia') || payload.get('evidenciaUrl'))
        : Boolean(payload.evidencia || payload.evidenciaUrl || payload.evidenciaNombre);

      if (!tieneEvidencia) {
        const err = new Error('La evidencia documental de aprobación es obligatoria para registrar el presupuesto oficial.');
        err.response = {
          status: 400,
          data: {
            message: 'La evidencia documental de aprobación es obligatoria para registrar el presupuesto oficial.',
            campos: { evidencia: 'Debe adjuntar el soporte formal de aprobación.' },
          },
        };
        throw err;
      }

      // Extraer datos según FormData u objeto plano
      const valorTotal = payload instanceof FormData
        ? Number(payload.get('valorTotalAprobado'))
        : Number(payload.valorTotalAprobado);

      const resolucion = payload instanceof FormData
        ? payload.get('resolucionOActa') || ''
        : payload.resolucionOActa || '';

      const justificacion = payload instanceof FormData
        ? payload.get('justificacion') || ''
        : payload.justificacion || '';

      const archivo = payload instanceof FormData ? payload.get('evidencia') : payload.evidencia;
      const nombreArchivo = (archivo && typeof archivo === 'object' && archivo.name)
        ? archivo.name
        : (payload.evidenciaNombre || 'Evidencia_Aprobacion_Presupuesto.pdf');

      const nuevoRegistro = {
        id: contadorId++,
        eventoId: Number(eventoId),
        version: 1,
        valorTotalAprobado: valorTotal,
        resolucionOActa: resolucion,
        fechaAprobacion: ahoraIso(),
        evidenciaUrl: typeof archivo === 'string' ? archivo : '#soporte-documental',
        evidenciaNombre: nombreArchivo,
        evidenciaTamano: (archivo && archivo.size) || 1024000,
        aprobadoPor: { id: 1, nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' },
        justificacion: justificacion || 'Registro oficial del presupuesto aprobado para el evento.',
        montoAnterior: null,
        vigente: true,
      };

      listaAprobados.unshift(nuevoRegistro);
      return nuevoRegistro;
    },

    async actualizarPresupuestoAprobado(eventoId, payload) {
      await new Promise((r) => setTimeout(r, 90));

      const delEvento = listaAprobados.filter((a) => a.eventoId === Number(eventoId));
      const versionMax = delEvento.reduce((max, a) => Math.max(max, a.version), 0);
      const anterior = delEvento.find((a) => a.vigente) || delEvento[0];

      // Criterio 3: Validación de evidencia obligatoria
      const tieneEvidencia = payload instanceof FormData
        ? Boolean(payload.get('evidencia') || payload.get('evidenciaUrl') || payload.get('evidenciaUrlPrevia'))
        : Boolean(payload.evidencia || payload.evidenciaUrl || payload.evidenciaNombre || payload.evidenciaUrlPrevia);

      if (!tieneEvidencia) {
        const err = new Error('La evidencia documental de aprobación es obligatoria para actualizar el presupuesto oficial.');
        err.response = {
          status: 400,
          data: {
            message: 'La evidencia documental de aprobación es obligatoria para actualizar el presupuesto oficial.',
            campos: { evidencia: 'Debe adjuntar el soporte formal de aprobación.' },
          },
        };
        throw err;
      }

      const valorTotal = payload instanceof FormData
        ? Number(payload.get('valorTotalAprobado'))
        : Number(payload.valorTotalAprobado);

      const resolucion = payload instanceof FormData
        ? payload.get('resolucionOActa') || ''
        : payload.resolucionOActa || '';

      const justificacion = payload instanceof FormData
        ? payload.get('justificacion') || ''
        : payload.justificacion || '';

      const archivo = payload instanceof FormData ? payload.get('evidencia') : payload.evidencia;
      const nombreArchivo = (archivo && typeof archivo === 'object' && archivo.name)
        ? archivo.name
        : (payload.evidenciaNombre || anterior?.evidenciaNombre || 'Evidencia_Actualizacion.pdf');

      // Marcar versiones anteriores como no vigentes (Criterio 2: se conservan intactas)
      listaAprobados.forEach((a) => {
        if (a.eventoId === Number(eventoId)) {
          a.vigente = false;
        }
      });

      const nuevaVersion = {
        id: contadorId++,
        eventoId: Number(eventoId),
        version: versionMax + 1,
        valorTotalAprobado: valorTotal,
        resolucionOActa: resolucion,
        fechaAprobacion: ahoraIso(),
        evidenciaUrl: typeof archivo === 'string' ? archivo : (anterior?.evidenciaUrl || '#soporte-actualizado'),
        evidenciaNombre: nombreArchivo,
        evidenciaTamano: (archivo && archivo.size) || 1200000,
        aprobadoPor: { id: 1, nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' },
        justificacion: justificacion || 'Actualización oficial del presupuesto aprobado.',
        montoAnterior: anterior ? anterior.valorTotalAprobado : null,
        vigente: true,
      };

      listaAprobados.unshift(nuevaVersion);
      return nuevaVersion;
    },

    async consultarHistorialPresupuestoAprobado(eventoId) {
      await new Promise((r) => setTimeout(r, 60));
      return listaAprobados
        .filter((a) => a.eventoId === Number(eventoId))
        .sort((a, b) => b.version - a.version);
    },
  };
}

/** Mock de error para pruebas de fallo de conexión */
export const presupuestoAprobadoApiMockConError = {
  async consultarPresupuestoAprobado() {
    throw new Error('Error al conectar con el servidor de presupuestos.');
  },
  async registrarPresupuestoAprobado() {
    throw new Error('Error al conectar con el servidor.');
  },
  async actualizarPresupuestoAprobado() {
    throw new Error('Error al conectar con el servidor.');
  },
  async consultarHistorialPresupuestoAprobado() {
    throw new Error('Error al conectar con el servidor.');
  },
};
