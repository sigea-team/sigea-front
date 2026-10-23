import { describe, it, expect } from 'vitest';
import {
  determinarClasificacion,
  calcularPuntuacionPonderada,
  validarEvaluacionCompleta,
  esPeriodoCerrado,
  puedeModificarEvaluacion,
  formatearPuntuacion,
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
});
