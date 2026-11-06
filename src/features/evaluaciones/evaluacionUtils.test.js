import { describe, it, expect } from 'vitest';
import {
  determinarClasificacion,
  calcularPuntuacionPonderada,
  validarEvaluacionCompleta,
  esPeriodoCerrado,
  puedeModificarEvaluacion,
  formatearPuntuacion,
  combinarDetalleAsignacion,
  escalaDeCriterio,
  normalizarADiez,
  notasRapidas,
  pasoDeEscala,
} from './evaluacionUtils';

describe('HU-17 - evaluacionUtils', () => {
  const criteriosMock = [
    { id: 1, nombre: 'Originalidad e Innovación', pesoPorcentual: 40 },
    { id: 2, nombre: 'Rigor Metodológico', pesoPorcentual: 30 },
    { id: 3, nombre: 'Claridad y Estructura', pesoPorcentual: 30 },
  ];

  describe('Criterio 1: Cálculo de puntuación ponderada y clasificación', () => {
    it('calcula correctamente la puntuación ponderada con los pesos de la rúbrica', () => {
      // 8.0 * 0.40 + 7.0 * 0.30 + 9.0 * 0.30 = 3.20 + 2.10 + 2.70 = 8.00
      const calificaciones = [
        { criterioId: 1, calificacion: 8.0 },
        { criterioId: 2, calificacion: 7.0 },
        { criterioId: 3, calificacion: 9.0 },
      ];

      const resultado = calcularPuntuacionPonderada(calificaciones, criteriosMock);
      expect(resultado).toBe(8.0);
      expect(determinarClasificacion(resultado)).toBe('aprobada');
    });

    it('clasifica como aprobada_con_ajustes si la nota está entre 5.0 y 6.99', () => {
      // 6.0 * 0.40 + 5.0 * 0.30 + 6.0 * 0.30 = 2.40 + 1.50 + 1.80 = 5.70
      const calificaciones = [
        { criterioId: 1, calificacion: 6.0 },
        { criterioId: 2, calificacion: 5.0 },
        { criterioId: 3, calificacion: 6.0 },
      ];

      const resultado = calcularPuntuacionPonderada(calificaciones, criteriosMock);
      expect(resultado).toBe(5.7);
      expect(determinarClasificacion(resultado)).toBe('aprobada_con_ajustes');
    });

    it('clasifica como rechazada si la nota ponderada es menor a 5.0', () => {
      // 4.0 * 0.40 + 3.0 * 0.30 + 4.0 * 0.30 = 1.60 + 0.90 + 1.20 = 3.70
      const calificaciones = [
        { criterioId: 1, calificacion: 4.0 },
        { criterioId: 2, calificacion: 3.0 },
        { criterioId: 3, calificacion: 4.0 },
      ];

      const resultado = calcularPuntuacionPonderada(calificaciones, criteriosMock);
      expect(resultado).toBe(3.7);
      expect(determinarClasificacion(resultado)).toBe('rechazada');
    });
  });

  describe('Criterio 2: Validación de completitud de criterios', () => {
    it('valida exitosamente cuando todos los criterios de la rúbrica tienen calificación válida', () => {
      const calificaciones = [
        { criterioId: 1, calificacion: 9.5 },
        { criterioId: 2, calificacion: 8.0 },
        { criterioId: 3, calificacion: 7.5 },
      ];

      const validacion = validarEvaluacionCompleta(calificaciones, criteriosMock);
      expect(validacion.valido).toBe(true);
      expect(validacion.criteriosFaltantes).toHaveLength(0);
    });

    it('rechaza la operación cuando faltan criterios por calificar', () => {
      // Falta calificar el criterio 2 y 3
      const calificaciones = [{ criterioId: 1, calificacion: 8.0 }];

      const validacion = validarEvaluacionCompleta(calificaciones, criteriosMock);
      expect(validacion.valido).toBe(false);
      expect(validacion.criteriosFaltantes).toContain('Rigor Metodológico');
      expect(validacion.criteriosFaltantes).toContain('Claridad y Estructura');
      expect(validacion.errores['2']).toBeDefined();
      expect(validacion.errores['3']).toBeDefined();
    });

    it('rechaza calificaciones fuera del rango permitido (menores a 0 o mayores a 10)', () => {
      const calificaciones = [
        { criterioId: 1, calificacion: 12.0 },
        { criterioId: 2, calificacion: -1.0 },
        { criterioId: 3, calificacion: 8.0 },
      ];

      const validacion = validarEvaluacionCompleta(calificaciones, criteriosMock);
      expect(validacion.valido).toBe(false);
      expect(validacion.criteriosFaltantes).toContain('Originalidad e Innovación');
      expect(validacion.criteriosFaltantes).toContain('Rigor Metodológico');
    });
  });

  describe('Criterio 3: Verificación de estado completo vs pendiente', () => {
    it('determina que la calificación cualitativa es pendiente si la puntuación es null', () => {
      expect(determinarClasificacion(null)).toBe('pendiente');
      expect(determinarClasificacion(undefined)).toBe('pendiente');
      expect(formatearPuntuacion(null)).toBe('—');
    });
  });

  describe('Criterio 4: Modificación y cierre del periodo de evaluación', () => {
    it('permite calificar cuando la asignación está pendiente, sin importar la fecha de cierre', () => {
      const asignacion = {
        estado: 'pendiente',
        fechaCierre: new Date(Date.now() - 3600000).toISOString(), // pasada
      };
      const res = puedeModificarEvaluacion(asignacion);
      expect(res.puedeEditar).toBe(true);
    });

    it('permite modificar una evaluación completada si el periodo de evaluación aún está abierto', () => {
      const asignacion = {
        estado: 'completada',
        fechaCierre: new Date(Date.now() + 86400000).toISOString(), // futura
      };
      const res = puedeModificarEvaluacion(asignacion);
      expect(res.puedeEditar).toBe(true);
    });

    it('impide modificar una evaluación ya enviada si el periodo de evaluación está cerrado', () => {
      const asignacion = {
        estado: 'completada',
        fechaCierre: new Date(Date.now() - 86400000).toISOString(), // pasada
      };
      const res = puedeModificarEvaluacion(asignacion);
      expect(res.puedeEditar).toBe(false);
      expect(res.motivo).toContain('periodo de evaluación está cerrado');
    });

    it('detecta correctamente si una fecha de cierre está en el pasado', () => {
      expect(esPeriodoCerrado(new Date(Date.now() - 10000))).toBe(true);
      expect(esPeriodoCerrado(new Date(Date.now() + 10000))).toBe(false);
      expect(esPeriodoCerrado(null)).toBe(false);
    });
  });

  describe('combinarDetalleAsignacion: datos reales del backend', () => {
    const base = { asignacionId: 7, propuestaId: 3, propuestaTitulo: 'P', estado: 'pendiente', autores: [], evaluaciones: [] };

    it('crea un elemento por criterio real y conserva las calificaciones ya registradas', () => {
      const fila = combinarDetalleAsignacion(base, {
        asignacionId: 7,
        estado: 'completada',
        autores: ['Ana Pérez'],
        convocatoriaTitulo: 'Conv',
        fechaCierre: '2026-12-01T23:59:00',
        criterios: [
          { criterioId: 11, nombre: 'Originalidad', pesoPorcentual: 60 },
          { criterioId: 12, nombre: 'Pertinencia', pesoPorcentual: 40 },
        ],
        evaluaciones: [{ evaluacionId: 90, criterioId: 11, calificacion: 8.5, observaciones: 'Bien' }],
      });

      expect(fila.estado).toBe('completada');
      expect(fila.autores).toEqual(['Ana Pérez']);
      expect(fila.fechaCierre).toBe('2026-12-01T23:59:00');
      expect(fila.evaluaciones).toHaveLength(2);
      expect(fila.evaluaciones[0]).toMatchObject({ criterioId: 11, nombreCriterio: 'Originalidad', pesoPorcentual: 60, calificacion: 8.5, observaciones: 'Bien' });
      expect(fila.evaluaciones[1]).toMatchObject({ criterioId: 12, calificacion: null, observaciones: '' });
    });

    it('sin rúbrica activa devuelve la lista de criterios vacía', () => {
      expect(combinarDetalleAsignacion(base, { asignacionId: 7, criterios: [], evaluaciones: [] }).evaluaciones).toEqual([]);
    });
  });

  describe('HU-15: escala propia de cada criterio', () => {
    const criteriosConEscala = [
      { id: 1, nombre: 'Originalidad', pesoPorcentual: 60, escalaMinima: 0, escalaMaxima: 10 },
      { id: 2, nombre: 'Impacto', pesoPorcentual: 40, escalaMinima: 1, escalaMaxima: 5 },
    ];

    it('usa 0 - 10 si el criterio no trae escala o es inválida', () => {
      expect(escalaDeCriterio({})).toEqual({ minima: 0, maxima: 10 });
      expect(escalaDeCriterio({ escalaMinima: 5, escalaMaxima: 5 })).toEqual({ minima: 0, maxima: 10 });
      expect(escalaDeCriterio({ escalaMinima: '1', escalaMaxima: '5' })).toEqual({ minima: 1, maxima: 5 });
    });

    it('lleva la nota a 0 - 10 como el backend', () => {
      expect(normalizarADiez(4, { minima: 1, maxima: 5 })).toBe(7.5);
      expect(normalizarADiez(8, { minima: 0, maxima: 10 })).toBe(8);
    });

    it('pondera cada criterio en su escala: 8 (0-10) y 4 (1-5) dan 7.8', () => {
      // 8 * 0.60 + 7.5 * 0.40 = 4.8 + 3.0 = 7.8
      const calificaciones = [
        { criterioId: 1, calificacion: 8 },
        { criterioId: 2, calificacion: 4 },
      ];
      expect(calcularPuntuacionPonderada(calificaciones, criteriosConEscala)).toBe(7.8);
    });

    it('rechaza una nota fuera de la escala de su criterio', () => {
      const calificaciones = [
        { criterioId: 1, calificacion: 8 },
        { criterioId: 2, calificacion: 8 },
      ];
      const validacion = validarEvaluacionCompleta(calificaciones, criteriosConEscala);
      expect(validacion.valido).toBe(false);
      expect(validacion.errores['2']).toContain('entre 1 y 5');
    });

    it('propone notas rápidas proporcionales a la escala', () => {
      expect(notasRapidas({ minima: 0, maxima: 10 })).toEqual([0, 5, 7, 8.5, 10]);
      expect(notasRapidas({ minima: 1, maxima: 5 })).toEqual([1, 3, 3.8, 4.4, 5]);
      expect(notasRapidas({ minima: 0, maxima: 5 })).toEqual([0, 2.5, 3.5, 4.3, 5]);
    });

    it('con escalas de dos decimales las notas rápidas no se salen de la escala', () => {
      const escala = { minima: 0.25, maxima: 4.75 };
      const notas = notasRapidas(escala);
      expect(notas[0]).toBe(0.25);
      expect(notas[notas.length - 1]).toBe(4.75);
      expect(notas.every((n) => n >= 0.25 && n <= 4.75)).toBe(true);
    });

    it('usa un paso compatible con la escala para que el navegador no rechace notas válidas', () => {
      expect(pasoDeEscala({ minima: 0, maxima: 10 })).toBe('0.1');
      expect(pasoDeEscala({ minima: 1, maxima: 5 })).toBe('0.1');
      expect(pasoDeEscala({ minima: 2.5, maxima: 7.5 })).toBe('0.1');
      expect(pasoDeEscala({ minima: 0.25, maxima: 4.75 })).toBe('0.01');
    });

    it('combinarDetalleAsignacion conserva la escala de cada criterio', () => {
      const r = combinarDetalleAsignacion(
        { asignacionId: 9 },
        { asignacionId: 9, criterios: [{ criterioId: 2, nombre: 'Impacto', pesoPorcentual: 40, escalaMinima: 1, escalaMaxima: 5 }], evaluaciones: [] }
      );
      expect(r.evaluaciones[0]).toMatchObject({ escalaMinima: 1, escalaMaxima: 5 });
    });
  });
});
