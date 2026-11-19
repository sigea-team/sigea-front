/**
 * @file asistenciaMock.js
 * @description API simulada de HU-24 para Storybook. Reproduce las reglas del backend: un QR por inscripción,
 * el reenvío no cambia el código, la asistencia se rechaza si el QR no existe, es de otro evento o la persona no
 * está inscrita en la actividad, y no se duplica (responde con la asistencia previa).
 * @module features/asistencia/mocks/asistenciaMock
 */

export const EVENTO_ASISTENCIA_MOCK = { id: 3, nombre: 'Congreso Internacional de TIC 2026', estado: 'en_ejecucion' };

export const ACTIVIDAD_ASISTENCIA_MOCK = {
  id: 102,
  nombre: 'Taller de aprendizaje automático',
  fecha: '2026-11-20',
  horaInicio: '10:30:00',
  horaFin: '12:30:00',
};

/** Código de la persona inscrita al evento pero no a la actividad. */
export const CODIGO_SIN_ACTIVIDAD_MOCK = 'SIGEA-7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a';
/** Código de una inscripción a otro evento. */
export const CODIGO_OTRO_EVENTO_MOCK = 'SIGEA-0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e';

export const INSCRITOS_MOCK = [
  { inscripcionId: 11, personaNombre: 'María Fernanda Pérez', personaCorreo: 'mariafernanda@ufps.edu.co', categoria: 'estudiante', codigo: 'SIGEA-4f1c2a7be04d4c6b8a3e51d7c2f09b44' },
  { inscripcionId: 12, personaNombre: 'Juan Carlos Ruiz', personaCorreo: 'juancarlos@ufps.edu.co', categoria: 'docente', codigo: 'SIGEA-9b2e44a1c3d84f0e9a7b6c5d4e3f2a10' },
  { inscripcionId: 13, personaNombre: 'Laura Sofía Gómez', personaCorreo: 'laurasofia@ufps.edu.co', categoria: 'egresado', codigo: 'SIGEA-1d3f5a7c9e0b2d4f6a8c0e1f3a5c7e9b' },
  { inscripcionId: 14, personaNombre: 'Andrés Felipe Díaz', personaCorreo: 'andresfelipe@gmail.com', categoria: 'particular', codigo: 'SIGEA-c0ffee00c0ffee00c0ffee00c0ffee00' },
  { inscripcionId: 15, personaNombre: 'Valentina Ortega', personaCorreo: 'valentina@ufps.edu.co', categoria: 'estudiante', codigo: 'SIGEA-5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e' },
];

/** Inscrita al evento, no a la actividad. */
const SIN_ACTIVIDAD = { inscripcionId: 16, personaNombre: 'Camilo Rojas', personaCorreo: 'camilo@ufps.edu.co', categoria: 'estudiante', codigo: CODIGO_SIN_ACTIVIDAD_MOCK };

const esperar = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const rechazo = (status, codigo, message, extra = {}) => {
  const err = new Error(message);
  err.response = { status, data: { status, codigo, message, ...extra } };
  return err;
};

const ahoraIso = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/**
 * Imagen simulada del QR (SVG con módulos derivados del código). No es un QR legible: solo ilustra la vista.
 * @param {string} codigo
 * @returns {Blob}
 */
export function imagenQrSimulada(codigo) {
  const n = 25;
  let semilla = [...codigo].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const aleatorio = () => {
    semilla = (semilla * 1103515245 + 12345) >>> 0;
    return semilla / 2 ** 32;
  };
  const enPatron = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([px, py]) => x >= px && x < px + 7 && y >= py && y < py + 7);
  const patron = (x, y, px, py) => {
    const dx = x - px;
    const dy = y - py;
    return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  };
  let rects = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let negro;
      if (enPatron(x, y)) {
        const [px, py] = x < 7 && y < 7 ? [0, 0] : x >= n - 7 ? [n - 7, 0] : [0, n - 7];
        negro = patron(x, y, px, py);
      } else {
        negro = aleatorio() > 0.5;
      }
      if (negro) rects += `<rect x="${x + 2}" y="${y + 2}" width="1" height="1"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * @param {{ codigo?: string, correoEnviado?: boolean, falloImagen?: boolean, sinCorreo?: boolean,
 *   asistenciasIniciales?: number[], sinPermisoInscritos?: boolean, eventoEstado?: string }} [opciones]
 * @returns {import('../../../api/asistenciaService').asistenciaService}
 */
export function crearAsistenciaApiMock({
  codigo = INSCRITOS_MOCK[0].codigo,
  correoEnviado = true,
  falloImagen = false,
  sinCorreo = false,
  asistenciasIniciales = [12, 13],
  sinPermisoInscritos = false,
  eventoEstado = 'en_ejecucion',
} = {}) {
  const todos = [...INSCRITOS_MOCK, SIN_ACTIVIDAD];
  const enActividad = new Set(INSCRITOS_MOCK.map((i) => i.inscripcionId));
  let secuencia = 500;
  const asistencias = new Map();

  const crearAsistencia = (inscrito, metodo, fechaHora = ahoraIso()) => ({
    asistenciaId: ++secuencia,
    inscripcionId: inscrito.inscripcionId,
    actividadId: ACTIVIDAD_ASISTENCIA_MOCK.id,
    actividadNombre: ACTIVIDAD_ASISTENCIA_MOCK.nombre,
    personaId: inscrito.inscripcionId + 100,
    participanteNombre: inscrito.personaNombre,
    numeroDocumento: `10900${inscrito.inscripcionId}`,
    categoria: inscrito.categoria,
    fechaHoraRegistro: fechaHora,
    metodoRegistro: metodo,
  });

  asistenciasIniciales.forEach((id, i) => {
    const inscrito = todos.find((t) => t.inscripcionId === id);
    if (inscrito) asistencias.set(id, crearAsistencia(inscrito, i % 2 ? 'manual' : 'qr', `2026-11-20T10:${String(25 + i * 3).padStart(2, '0')}:00`));
  });

  const registrar = (inscrito, metodo) => {
    if (eventoEstado === 'cerrado') {
      throw rechazo(409, 'EVENTO_NO_DISPONIBLE', `El evento «${EVENTO_ASISTENCIA_MOCK.nombre}» está cerrado; ya no se registran asistencias.`);
    }
    if (!enActividad.has(inscrito.inscripcionId)) {
      throw rechazo(409, 'NO_INSCRITO_ACTIVIDAD', `${inscrito.personaNombre} está inscrito en el evento, pero no en la actividad «${ACTIVIDAD_ASISTENCIA_MOCK.nombre}».`);
    }
    const previa = asistencias.get(inscrito.inscripcionId);
    if (previa) {
      throw rechazo(409, 'ASISTENCIA_DUPLICADA', `La asistencia de ${inscrito.personaNombre} ya estaba registrada.`, { asistenciaExistente: previa });
    }
    const nueva = crearAsistencia(inscrito, metodo);
    asistencias.set(inscrito.inscripcionId, nueva);
    return nueva;
  };

  return {
    async obtenerMiCodigoQr(eventoId) {
      await esperar();
      return {
        qrId: 77,
        inscripcionId: 11,
        eventoId: Number(eventoId),
        eventoNombre: EVENTO_ASISTENCIA_MOCK.nombre,
        participanteNombre: INSCRITOS_MOCK[0].personaNombre,
        participanteCorreo: INSCRITOS_MOCK[0].personaCorreo,
        codigo,
        fechaGeneracion: '2026-11-15T10:00:00',
        vigente: true,
      };
    },
    async obtenerImagenMiQr() {
      await esperar(400);
      if (falloImagen) throw rechazo(500, 'ERROR_INTERNO', 'Error');
      return imagenQrSimulada(codigo);
    },
    async reenviarMiQr() {
      await esperar(600);
      if (sinCorreo) throw rechazo(409, 'OPERACION_NO_PERMITIDA', 'El participante no tiene un correo registrado al cual reenviar el código QR.');
      return {
        inscripcionId: 11,
        correoDestino: INSCRITOS_MOCK[0].personaCorreo,
        codigo,
        enviado: correoEnviado,
        fechaReenvio: ahoraIso(),
        mensaje: correoEnviado
          ? `Se reenvió el código QR a ${INSCRITOS_MOCK[0].personaCorreo}. Es el mismo código de la inscripción.`
          : 'No se pudo enviar el correo en este momento. El código QR no cambió; puede consultarlo en su inscripción.',
      };
    },
    async reenviarQrInscripcion(eventoId, inscripcionId) {
      await esperar(500);
      const inscrito = todos.find((t) => t.inscripcionId === Number(inscripcionId));
      return {
        inscripcionId: inscrito.inscripcionId,
        correoDestino: inscrito.personaCorreo,
        codigo: inscrito.codigo,
        enviado: correoEnviado,
        fechaReenvio: ahoraIso(),
        mensaje: `Se reenvió el código QR a ${inscrito.personaCorreo}. Es el mismo código de la inscripción.`,
      };
    },
    async registrarPorQr(eventoId, actividadId, texto) {
      await esperar(300);
      if (texto === CODIGO_OTRO_EVENTO_MOCK) {
        throw rechazo(409, 'QR_OTRO_EVENTO', 'El código QR corresponde a una inscripción al evento «Semana de Ingeniería», no al evento de esta actividad.');
      }
      const inscrito = todos.find((t) => t.codigo === texto);
      if (!inscrito) throw rechazo(404, 'QR_INVALIDO', 'El código QR no corresponde a ninguna inscripción registrada en SIGEA.');
      return registrar(inscrito, 'qr');
    },
    async registrarManual(eventoId, actividadId, inscripcionId) {
      await esperar(300);
      const inscrito = todos.find((t) => t.inscripcionId === Number(inscripcionId));
      if (!inscrito) throw rechazo(404, 'RECURSO_NO_ENCONTRADO', `No se encontró la inscripción con ID ${inscripcionId} en este evento.`);
      return registrar(inscrito, 'manual');
    },
    async listarAsistencias() {
      await esperar();
      const lista = [...asistencias.values()].sort((a, b) => a.fechaHoraRegistro.localeCompare(b.fechaHoraRegistro));
      return {
        actividadId: ACTIVIDAD_ASISTENCIA_MOCK.id,
        actividadNombre: ACTIVIDAD_ASISTENCIA_MOCK.nombre,
        fecha: ACTIVIDAD_ASISTENCIA_MOCK.fecha,
        horaInicio: ACTIVIDAD_ASISTENCIA_MOCK.horaInicio,
        horaFin: ACTIVIDAD_ASISTENCIA_MOCK.horaFin,
        inscritos: enActividad.size,
        asistentes: lista.length,
        asistencias: lista,
      };
    },
    async listarInscritosParaAsistencia() {
      await esperar();
      if (sinPermisoInscritos) throw rechazo(403, 'ACCESO_DENEGADO', 'Acceso denegado');
      return {
        inscritosActividad: INSCRITOS_MOCK.map((i) => ({ inscripcionId: i.inscripcionId, actividadId: ACTIVIDAD_ASISTENCIA_MOCK.id })),
        inscripcionesEvento: todos.map((t) => ({
          inscripcionId: t.inscripcionId,
          personaNombre: t.personaNombre,
          personaCorreo: t.personaCorreo,
          categoria: t.categoria,
        })),
      };
    },
  };
}
