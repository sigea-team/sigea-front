import { describe, it, expect } from 'vitest';
import {
  FORM_EVALUADOR_VACIO,
  aRequestEvaluador,
  interpretarErrorEvaluador,
  nombreEvaluador,
  validarEvaluador,
} from './comiteEvaluadorUtils';

const form = (datos) => ({ ...FORM_EVALUADOR_VACIO, ...datos });
const errorApi = (status, data) => ({ response: { status, data } });

describe('HU-15 - comiteEvaluadorUtils', () => {
  describe('Criterio 3: registro del evaluador', () => {
    it('exige correo válido y área de experticia', () => {
      expect(validarEvaluador(form({ correo: '', areaExperticia: '' }), false)).toMatchObject({
        correo: expect.any(String),
        areaExperticia: expect.any(String),
      });
      expect(validarEvaluador(form({ correo: 'no-es-correo', areaExperticia: 'Redes' }), false).correo).toBeTruthy();
      expect(validarEvaluador(form({ correo: 'ana@ufps.edu.co', areaExperticia: 'Redes' }), false)).toEqual({});
    });

    it('para una persona nueva exige documento, nombres y apellidos', () => {
      const errores = validarEvaluador(form({ correo: 'luis@ufps.edu.co', areaExperticia: 'Redes' }), true);
      expect(Object.keys(errores).sort()).toEqual(['apellidos', 'nombres', 'numeroDocumento']);
    });

    it('solo envía los datos personales si la persona es nueva', () => {
      const datos = form({ correo: ' ana@ufps.edu.co ', areaExperticia: ' Redes ', numeroDocumento: '123', nombres: 'Ana' });
      expect(aRequestEvaluador(datos, false)).toEqual({ correo: 'ana@ufps.edu.co', areaExperticia: 'Redes' });
      expect(aRequestEvaluador(datos, true)).toEqual({
        correo: 'ana@ufps.edu.co',
        areaExperticia: 'Redes',
        tipoDocumento: 'CC',
        numeroDocumento: '123',
        nombres: 'Ana',
      });
    });

    it('detecta que el correo no pertenece a ninguna persona', () => {
      const r = interpretarErrorEvaluador(
        errorApi(400, {
          codigo: 'SOLICITUD_INVALIDA',
          message: 'El correo x@y.co no pertenece a ninguna persona registrada. Para registrarla complete: nombres.',
        })
      );
      expect(r.requiereDatosPersona).toBe(true);
    });
  });

  describe('Criterio 4: duplicados', () => {
    it('marca el correo cuando ya está en el comité', () => {
      const r = interpretarErrorEvaluador(errorApi(409, { codigo: 'EVALUADOR_DUPLICADO', message: 'Ya existe.' }));
      expect(r.campos.correo).toBeTruthy();
      expect(r.requiereDatosPersona).toBe(false);
    });

    it('marca el documento cuando pertenece a otra persona', () => {
      const r = interpretarErrorEvaluador(
        errorApi(409, {
          codigo: 'DATOS_PERSONA_DUPLICADOS',
          message: 'El documento ya pertenece a otra persona.',
          erroresValidacion: { numeroDocumento: 'El documento ya pertenece a otra persona.' },
        })
      );
      expect(r.campos.numeroDocumento).toContain('otra persona');
      expect(r.requiereDatosPersona).toBe(true);
    });
  });

  it('arma el nombre para mostrar', () => {
    expect(nombreEvaluador({ nombres: 'Ana', apellidos: 'Pérez' })).toBe('Ana Pérez');
    expect(nombreEvaluador({ correo: 'ana@ufps.edu.co' })).toBe('ana@ufps.edu.co');
  });
});
