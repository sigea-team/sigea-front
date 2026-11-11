import { describe, it, expect } from 'vitest';
import {
  aRequest,
  criterioVacio,
  desdeRubrica,
  impactoDeError,
  interpretarErrorApi,
  motivoBloqueoRubrica,
  pesosCompletos,
  repartirPesos,
  sumaPesos,
  validarRubrica,
} from './rubricaUtils';

const criterio = (nombre, peso, min = '0', max = '10') =>
  criterioVacio({ nombre, pesoPorcentual: peso, escalaMinima: min, escalaMaxima: max });

describe('HU-15 - rubricaUtils', () => {
  describe('Criterio 1: suma de pesos', () => {
    it('suma sin errores de coma flotante', () => {
      expect(sumaPesos([criterio('A', '33.33'), criterio('B', '33.33'), criterio('C', '33.34')])).toBe(100);
      expect(sumaPesos([criterio('A', '0.1'), criterio('B', '0.2')])).toBe(0.3);
    });

    it('acepta coma decimal e ignora pesos vacíos', () => {
      expect(sumaPesos([criterio('A', '40,5'), criterio('B', '')])).toBe(40.5);
    });

    it('reparte 100% en partes iguales con suma exacta', () => {
      const repartidos = repartirPesos([criterio('A', ''), criterio('B', ''), criterio('C', '')]);
      expect(repartidos.map((c) => c.pesoPorcentual)).toEqual(['33.33', '33.33', '33.34']);
      expect(pesosCompletos(repartidos)).toBe(true);
    });

    it('una rúbrica válida no tiene errores', () => {
      const form = { nombre: 'Rúbrica 2026', criterios: [criterio('Originalidad', '60'), criterio('Impacto', '40', '1', '5')] };
      expect(validarRubrica(form)).toEqual({});
    });
  });

  describe('Criterio 2: pesos que no suman 100%', () => {
    it('señala la suma obtenida en el campo pesoPorcentual', () => {
      const errores = validarRubrica({ nombre: 'R', criterios: [criterio('A', '60'), criterio('B', '30')] });
      expect(errores.pesoPorcentual).toContain('90%');
    });

    it('también rechaza pesos que superan 100%', () => {
      const errores = validarRubrica({ nombre: 'R', criterios: [criterio('A', '60'), criterio('B', '40.01')] });
      expect(errores.pesoPorcentual).toContain('100.01%');
    });
  });

  describe('Otras validaciones del formulario', () => {
    it('exige nombre de rúbrica, nombre y peso de cada criterio', () => {
      const errores = validarRubrica({ nombre: ' ', criterios: [criterio('', '')] });
      expect(errores.nombre).toBeTruthy();
      expect(errores['criterios[0].nombre']).toBeTruthy();
      expect(errores['criterios[0].pesoPorcentual']).toBeTruthy();
    });

    it('detecta criterios repetidos sin distinguir mayúsculas', () => {
      const errores = validarRubrica({ nombre: 'R', criterios: [criterio('Impacto', '50'), criterio(' impacto ', '50')] });
      expect(errores['criterios[1].nombre']).toContain('repetido');
    });

    it('valida la escala: dentro de 0-10 y máxima mayor que mínima', () => {
      const errores = validarRubrica({
        nombre: 'R',
        criterios: [criterio('A', '50', '5', '5'), criterio('B', '50', '-1', '11')],
      });
      expect(errores['criterios[0].escalaMaxima']).toContain('mayor');
      expect(errores['criterios[1].escalaMinima']).toBeTruthy();
      expect(errores['criterios[1].escalaMaxima']).toBeTruthy();
    });

    it('rechaza pesos con más de 2 decimales', () => {
      const errores = validarRubrica({ nombre: 'R', criterios: [criterio('A', '99.999'), criterio('B', '0.001')] });
      expect(errores['criterios[0].pesoPorcentual']).toContain('2 decimales');
    });
  });

  describe('Conversión con el backend', () => {
    it('convierte el formulario en el cuerpo del PUT', () => {
      const form = { nombre: ' Rúbrica ', criterios: [criterio(' Impacto ', '100', '1', '5')] };
      expect(aRequest(form)).toEqual({
        nombre: 'Rúbrica',
        criterios: [{ nombre: 'Impacto', pesoPorcentual: 100, escalaMinima: 1, escalaMaxima: 5 }],
      });
    });

    it('carga la rúbrica del backend en el formulario', () => {
      const form = desdeRubrica({
        nombre: 'R',
        criterios: [{ criterioId: 1, nombre: 'A', pesoPorcentual: 40.0, escalaMinima: 0, escalaMaxima: 10 }],
      });
      expect(form.nombre).toBe('R');
      expect(form.criterios[0]).toMatchObject({ nombre: 'A', pesoPorcentual: '40', escalaMinima: '0', escalaMaxima: '10' });
    });

    it('sin rúbrica devuelve un formulario con un criterio vacío', () => {
      const form = desdeRubrica(null);
      expect(form.nombre).toBe('');
      expect(form.criterios).toHaveLength(1);
    });
  });

  describe('Criterio 4: rúbrica en uso', () => {
    it('extrae el impacto del 409 RUBRICA_EN_USO', () => {
      const err = {
        response: {
          status: 409,
          data: {
            codigo: 'RUBRICA_EN_USO',
            message: 'La rúbrica ya se usó.',
            erroresValidacion: { calificacionesRegistradas: '6', asignacionesAfectadas: '3', propuestasAfectadas: '2' },
          },
        },
      };
      expect(impactoDeError(err)).toEqual({
        mensaje: 'La rúbrica ya se usó.',
        calificacionesRegistradas: 6,
        asignacionesAfectadas: 3,
        propuestasAfectadas: 2,
      });
    });

    it('otros errores no son impacto', () => {
      expect(impactoDeError({ response: { status: 400, data: { codigo: 'RUBRICA_INVALIDA' } } })).toBeNull();
    });

    it('traduce los errores por campo del backend', () => {
      const r = interpretarErrorApi({
        response: { status: 400, data: { codigo: 'RUBRICA_INVALIDA', message: 'No se guardó.', erroresValidacion: { pesoPorcentual: 'Suma 90%' } } },
      });
      expect(r.mensaje).toBe('No se guardó.');
      expect(r.campos.pesoPorcentual).toBe('Suma 90%');
      expect(r.codigo).toBe('RUBRICA_INVALIDA');
    });
  });
});

describe('bloqueo de la rúbrica por fecha de apertura', () => {
  const ahora = new Date('2026-11-10T10:00:00');

  it('se puede editar antes de la apertura o si la convocatoria no tiene fecha', () => {
    expect(motivoBloqueoRubrica({ fechaApertura: '2026-11-20T08:00' }, ahora)).toBeNull();
    expect(motivoBloqueoRubrica({ fechaApertura: null }, ahora)).toBeNull();
    expect(motivoBloqueoRubrica(null, ahora)).toBeNull();
  });

  it('queda bloqueada desde la apertura', () => {
    expect(motivoBloqueoRubrica({ fechaApertura: '2026-11-10T10:00' }, ahora)).toContain('antes de la apertura');
    expect(motivoBloqueoRubrica({ fechaApertura: '2026-10-01T08:00' }, ahora)).toContain('antes de la apertura');
  });
});
