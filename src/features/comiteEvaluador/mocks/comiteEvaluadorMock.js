/**
 * @file comiteEvaluadorMock.js
 * @description API simulada del comité evaluador (HU-15), solo para Storybook.
 * Imita las reglas del backend: correo repetido (409 EVALUADOR_DUPLICADO), correo sin persona
 * registrada (400 SOLICITUD_INVALIDA) y retiro bloqueado si tiene propuestas asignadas.
 * @module features/comiteEvaluador/mocks/comiteEvaluadorMock
 */

/** Personas registradas en el sistema (se buscan por correo). */
export const PERSONAS_EVALUADORAS_MOCK = [
  { personaId: 12, nombres: 'Ana María', apellidos: 'Pérez Gómez', correo: 'ana.perez@ufps.edu.co', numeroDocumento: '1090123456', afiliacion: 'UFPS', tieneCuenta: true },
  { personaId: 21, nombres: 'Laura Sofía', apellidos: 'Mendoza Ríos', correo: 'laura.mendoza@ufps.edu.co', numeroDocumento: '1094456789', afiliacion: 'UFPS', tieneCuenta: true },
  { personaId: 33, nombres: 'Carlos Iván', apellidos: 'Suárez León', correo: 'carlos.suarez@unal.edu.co', numeroDocumento: '79123456', afiliacion: 'Universidad Nacional', tieneCuenta: false },
];

/** Comité inicial: Ana con 2 propuestas asignadas (no se puede retirar). */
export const COMITE_EVALUADOR_MOCK = [
  { comiteEvaluadorId: 3, personaId: 12, areaExperticia: 'Ingeniería de software', propuestasAsignadas: 2 },
  { comiteEvaluadorId: 5, personaId: 33, areaExperticia: 'Analítica de datos', propuestasAsignadas: 0 },
];

const esperar = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

/**
 * Crea una API simulada con estado en memoria.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.comite=COMITE_EVALUADOR_MOCK]
 * @param {Array<Object>} [opciones.personas=PERSONAS_EVALUADORAS_MOCK]
 */
export function crearComiteEvaluadorApiMock({ comite = COMITE_EVALUADOR_MOCK, personas = PERSONAS_EVALUADORAS_MOCK } = {}) {
  let miembros = comite.map((m) => ({ ...m }));
  const gente = personas.map((p) => ({ ...p }));
  let siguienteId = 100;
  let siguientePersonaId = 900;

  const aRespuesta = (m, convocatoriaId) => {
    const p = gente.find((x) => x.personaId === m.personaId) || {};
    return {
      comiteEvaluadorId: m.comiteEvaluadorId,
      convocatoriaId,
      personaId: m.personaId,
      nombres: p.nombres,
      apellidos: p.apellidos,
      correo: p.correo,
      numeroDocumento: p.numeroDocumento,
      afiliacion: p.afiliacion ?? null,
      areaExperticia: m.areaExperticia,
      tieneCuenta: Boolean(p.tieneCuenta),
      propuestasAsignadas: m.propuestasAsignadas ?? 0,
    };
  };

  return {
    async listarEvaluadores(convocatoriaId) {
      await esperar();
      return miembros.map((m) => aRespuesta(m, convocatoriaId));
    },

    async registrarEvaluador(convocatoriaId, request) {
      await esperar();
      const correo = request.correo.trim().toLowerCase();
      const yaEsta = miembros.some((m) => gente.find((p) => p.personaId === m.personaId)?.correo === correo);
      if (yaEsta) {
        throw errorApi(409, `Ya existe un evaluador con el correo ${correo} en el comité de esta convocatoria.`, {
          codigo: 'EVALUADOR_DUPLICADO',
        });
      }
      let persona = gente.find((p) => p.correo === correo);
      if (!persona) {
        const faltantes = ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos'].filter((c) => !request[c]);
        if (faltantes.length > 0) {
          throw errorApi(
            400,
            `El correo ${correo} no pertenece a ninguna persona registrada. Para registrarla como evaluadora complete: ${faltantes.join(', ')}.`,
            { codigo: 'SOLICITUD_INVALIDA' }
          );
        }
        if (gente.some((p) => p.numeroDocumento === request.numeroDocumento)) {
          const mensaje = `El documento ${request.numeroDocumento} ya pertenece a otra persona registrada con un correo distinto.`;
          throw errorApi(409, mensaje, { codigo: 'DATOS_PERSONA_DUPLICADOS', erroresValidacion: { numeroDocumento: mensaje } });
        }
        persona = { personaId: (siguientePersonaId += 1), ...request, correo, afiliacion: null, tieneCuenta: false };
        gente.push(persona);
      }
      const nuevo = { comiteEvaluadorId: (siguienteId += 1), personaId: persona.personaId, areaExperticia: request.areaExperticia, propuestasAsignadas: 0 };
      miembros = [...miembros, nuevo];
      return aRespuesta(nuevo, convocatoriaId);
    },

    async actualizarEvaluador(convocatoriaId, comiteEvaluadorId, areaExperticia) {
      await esperar();
      miembros = miembros.map((m) => (m.comiteEvaluadorId === comiteEvaluadorId ? { ...m, areaExperticia } : m));
      return aRespuesta(miembros.find((m) => m.comiteEvaluadorId === comiteEvaluadorId), convocatoriaId);
    },

    async retirarEvaluador(convocatoriaId, comiteEvaluadorId) {
      await esperar();
      const m = miembros.find((x) => x.comiteEvaluadorId === comiteEvaluadorId);
      if (m?.propuestasAsignadas > 0) {
        throw errorApi(409, `No se puede retirar al evaluador: tiene ${m.propuestasAsignadas} propuesta(s) asignada(s).`, {
          codigo: 'OPERACION_NO_PERMITIDA',
        });
      }
      miembros = miembros.filter((x) => x.comiteEvaluadorId !== comiteEvaluadorId);
    },
  };
}

/** API que falla al cargar, para ver el estado de error. */
export const comiteEvaluadorApiMockConError = {
  async listarEvaluadores() {
    await esperar();
    throw errorApi(500, 'Error interno del servidor.');
  },
  async registrarEvaluador() {
    throw errorApi(500, 'Error interno del servidor.');
  },
  async actualizarEvaluador() {
    throw errorApi(500, 'Error interno del servidor.');
  },
  async retirarEvaluador() {
    throw errorApi(500, 'Error interno del servidor.');
  },
};
