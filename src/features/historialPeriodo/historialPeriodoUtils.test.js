import { describe, it, expect } from 'vitest';
import {
  validarFormatoSemestre,
  validarRangoFechas,
  validarSemestresComparacion,
  formatearNumero,
  formatearPorcentaje,
  formatearDiferencia,
  configuracionTendencia,
  configuracionRol,
  interpretarError,
  veHistorialPeriodo,
} from './historialPeriodoUtils';

describe('historialPeriodoUtils', () => {
  describe('validarFormatoSemestre', () => {
    it('acepta formatos válidos AAAA-1 y AAAA-2', () => {
      expect(validarFormatoSemestre('2026-1')).toBe(true);
      expect(validarFormatoSemestre('2025-2')).toBe(true);
      expect(validarFormatoSemestre('  2024-1  ')).toBe(true);
    });

    it('acepta valores vacíos o nulos como filtro opcional', () => {
      expect(validarFormatoSemestre('')).toBe(true);
      expect(validarFormatoSemestre(null)).toBe(true);
      expect(validarFormatoSemestre(undefined)).toBe(true);
    });

    it('rechaza semestres con formato incorrecto', () => {
      expect(validarFormatoSemestre('2026-3')).toBe(false);
      expect(validarFormatoSemestre('2026')).toBe(false);
      expect(validarFormatoSemestre('26-1')).toBe(false);
      expect(validarFormatoSemestre('2026-01')).toBe(false);
      expect(validarFormatoSemestre('texto')).toBe(false);
    });
  });

  describe('validarRangoFechas', () => {
    it('retorna null cuando el rango es coherente o falta alguna fecha', () => {
      expect(validarRangoFechas('2026-01-01', '2026-06-30')).toBeNull();
      expect(validarRangoFechas('2026-01-01', '2026-01-01')).toBeNull();
      expect(validarRangoFechas('2026-01-01', null)).toBeNull();
      expect(validarRangoFechas(null, '2026-06-30')).toBeNull();
    });

    it('retorna mensaje de error si fechaDesde es posterior a fechaHasta', () => {
      expect(validarRangoFechas('2026-07-01', '2026-06-30')).toBe(
        'La fecha inicial del rango no puede ser posterior a la fecha final.'
      );
    });
  });

  describe('validarSemestresComparacion', () => {
    it('retorna null si ambos semestres son válidos y distintos', () => {
      expect(validarSemestresComparacion('2025-2', '2026-1')).toBeNull();
    });

    it('exige ambos semestres', () => {
      expect(validarSemestresComparacion('', '2026-1')).toContain('primer semestre');
      expect(validarSemestresComparacion('2025-2', '')).toContain('segundo semestre');
    });

    it('valida formato AAAA-1 o AAAA-2', () => {
      expect(validarSemestresComparacion('2025-5', '2026-1')).toContain('formato AAAA-1');
      expect(validarSemestresComparacion('2025-2', '2026-X')).toContain('formato AAAA-1');
    });

    it('rechaza semestres iguales', () => {
      expect(validarSemestresComparacion('2026-1', '2026-1')).toBe(
        'Seleccione dos semestres distintos para comparar.'
      );
    });
  });

  describe('formatearNumero, formatearPorcentaje y formatearDiferencia', () => {
    it('formatea números correctamente', () => {
      expect(formatearNumero(1000)).toBe('1.000');
      expect(formatearNumero(0)).toBe('0');
      expect(formatearNumero(null)).toBe('—');
    });

    it('formatea porcentajes', () => {
      expect(formatearPorcentaje(75.5)).toBe('75,5%');
      expect(formatearPorcentaje(null)).toBe('—');
    });

    it('formatea diferencias con signo positivo', () => {
      expect(formatearDiferencia(5)).toBe('+5');
      expect(formatearDiferencia(-3)).toBe('-3');
      expect(formatearDiferencia(0)).toBe('0');
      expect(formatearDiferencia(null)).toBe('—');
    });
  });

  describe('configuracionTendencia y configuracionRol', () => {
    it('retorna configuración de tendencia conocida', () => {
      const aumento = configuracionTendencia('AUMENTO');
      expect(aumento.label).toBe('Aumento');
      expect(aumento.icono).toBe('TrendingUp');

      const disminucion = configuracionTendencia('DISMINUCION');
      expect(disminucion.label).toBe('Disminución');

      const fallback = configuracionTendencia('OTRO');
      expect(fallback.codigo).toBe('NO_COMPARABLE');
    });

    it('retorna roles con etiquetas legibles', () => {
      expect(configuracionRol('PARTICIPANTE').label).toBe('Participante');
      expect(configuracionRol('PONENTE').label).toBe('Ponente');
      expect(configuracionRol('CONFERENCISTA').label).toBe('Conferencista');
      expect(configuracionRol('AUTOR').label).toBe('Autor');
    });
  });

  describe('interpretarError', () => {
    it('extrae mensaje del backend cuando está disponible', () => {
      const errorObj = {
        response: {
          status: 400,
          data: { message: 'El semestre debe tener el formato AAAA-1 o AAAA-2.', codigo: 'SOLICITUD_INVALIDA' },
        },
      };
      const res = interpretarError(errorObj);
      expect(res.mensaje).toBe('El semestre debe tener el formato AAAA-1 o AAAA-2.');
      expect(res.status).toBe(400);
      expect(res.codigo).toBe('SOLICITUD_INVALIDA');
    });

    it('usa fallback si no hay respuesta detallada', () => {
      expect(interpretarError(null, 'Error base').mensaje).toBe('Error base');
    });
  });

  describe('veHistorialPeriodo', () => {
    it('permite administradores', () => {
      expect(veHistorialPeriodo({ rol: 'ADMIN' })).toBe(true);
      expect(veHistorialPeriodo({ roles: ['ADMINISTRADOR'] })).toBe(true);
    });

    it('permite usuarios con EVENTOS_VER o REPORTES_VER', () => {
      expect(veHistorialPeriodo({ permisos: ['EVENTOS_VER'] })).toBe(true);
      expect(veHistorialPeriodo({ permisos: ['REPORTES_VER'] })).toBe(true);
    });

    it('deniega usuarios sin esos permisos', () => {
      expect(veHistorialPeriodo({ permisos: ['SALAS_VER'] })).toBe(false);
      expect(veHistorialPeriodo(null)).toBe(false);
    });
  });
});
