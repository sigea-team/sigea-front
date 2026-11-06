/**
 * @file rubricaMock.js
 * @description API simulada de la rúbrica de evaluación (HU-15), solo para Storybook.
 * Imita las respuestas y reglas del backend sin necesidad de servidor:
 * pesos que suman 100 % (400 RUBRICA_INVALIDA) y rúbrica con calificaciones (409 RUBRICA_EN_USO).
 * @module features/rubricas/mocks/rubricaMock
 */

/** Rúbrica de ejemplo con un criterio en escala 1 a 5. */
export const RUBRICA_MOCK = {
  rubricaId: 4,
  convocatoriaId: 10,
  nombre: 'Rúbrica de ponencias 2026',
  activo: true,
  sumaPesos: 100,
  criterios: [
    { criterioId: 11, nombre: 'Originalidad', pesoPorcentual: 40, escalaMinima: 0, escalaMaxima: 10 },
    { criterioId: 12, nombre: 'Rigor metodológico', pesoPorcentual: 35, escalaMinima: 0, escalaMaxima: 10 },
    { criterioId: 13, nombre: 'Impacto', pesoPorcentual: 25, escalaMinima: 1, escalaMaxima: 5 },
  ],
  asignacionesReabiertas: 0,
};

const esperar = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

/**
 * Crea una API simulada con estado en memoria.
 * @param {Object} [opciones]
 * @param {Object|null} [opciones.rubrica=null] - Rúbrica activa inicial (null: la convocatoria no tiene).
 * @param {{ calificaciones: number, asignaciones: number, propuestas: number }|null} [opciones.enUso=null]
 *   Si se indica, la rúbrica ya tiene calificaciones y modificarla exige confirmar (Criterio 4).
 */
export function crearRubricaApiMock({ rubrica = null, enUso = null } = {}) {
  let actual = rubrica ? { ...rubrica, criterios: rubrica.criterios.map((c) => ({ ...c })) } : null;
  let uso = enUso;
  let siguienteRubricaId = 50;
  let siguienteCriterioId = 500;

  const impacto = () => ({
    rubricaId: actual?.rubricaId ?? null,
    calificacionesRegistradas: uso?.calificaciones ?? 0,
    asignacionesAfectadas: uso?.asignaciones ?? 0,
    propuestasAfectadas: uso?.propuestas ?? 0,
    requiereConfirmacion: Boolean(uso),
  });

  return {
    async obtenerRubrica() {
      await esperar();
      return actual ? { ...actual, criterios: actual.criterios.map((c) => ({ ...c })) } : null;
    },

    async obtenerImpacto() {
      await esperar(150);
      return impacto();
    },

    async configurarRubrica(convocatoriaId, request, confirmar = false) {
      await esperar();
      const suma = Math.round(request.criterios.reduce((t, c) => t + Number(c.pesoPorcentual) * 100, 0)) / 100;
      if (suma !== 100) {
        throw errorApi(400, 'No se guardó la rúbrica: la suma de los pesos de los criterios debe ser 100%.', {
          codigo: 'RUBRICA_INVALIDA',
          erroresValidacion: { pesoPorcentual: `La suma de los pesos es ${suma}% y debe ser exactamente 100%.` },
        });
      }
      if (uso && !confirmar) {
        throw errorApi(
          409,
          `La rúbrica '${actual.nombre}' ya se usó en ${uso.calificaciones} calificación(es). Confirme la operación para continuar.`,
          {
            codigo: 'RUBRICA_EN_USO',
            erroresValidacion: {
              calificacionesRegistradas: String(uso.calificaciones),
              asignacionesAfectadas: String(uso.asignaciones),
              propuestasAfectadas: String(uso.propuestas),
            },
          }
        );
      }
      const reabiertas = uso ? uso.asignaciones : 0;
      const nuevaVersion = Boolean(uso) || !actual;
      actual = {
        rubricaId: nuevaVersion ? (siguienteRubricaId += 1) : actual.rubricaId,
        convocatoriaId,
        nombre: request.nombre,
        activo: true,
        sumaPesos: 100,
        criterios: request.criterios.map((c) => ({ criterioId: (siguienteCriterioId += 1), ...c })),
        asignacionesReabiertas: reabiertas,
      };
      uso = null;
      return { ...actual };
    },
  };
}

/** API que falla al cargar, para ver el estado de error. */
export const rubricaApiMockConError = {
  async obtenerRubrica() {
    await esperar();
    throw errorApi(500, 'Error interno del servidor.');
  },
  async obtenerImpacto() {
    return null;
  },
  async configurarRubrica() {
    throw errorApi(500, 'Error interno del servidor.');
  },
};
