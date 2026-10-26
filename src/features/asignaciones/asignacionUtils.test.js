import { describe, expect, it } from 'vitest';
import {
  advertenciasDeSeleccion,
  candidatosReasignacion,
  interpretarErrorAsignacion,
  normalizarAsignacionBandeja,
  puedeAsignarPropuesta,
  puedeGestionarPropuestas,
  puedeReasignar,
  puedeSeleccionarEvaluador,
  requiereConfirmacion,
  textoCarga,
  textoResumenAsignaciones,
  validarMotivo,
} from './asignacionUtils';
import { crearAsignacionesApiMock } from './mocks/asignacionesMock';

const errorApi = (status, codigo, message = 'mensaje') => ({ response: { status, data: { status, codigo, message } } });

describe('asignacionUtils (HU-16)', () => {
  it('solo gestiona propuestas de convocatorias fuera de borrador', () => {
    expect(puedeGestionarPropuestas({ estado: 'BORRADOR' }).permitido).toBe(false);
    expect(puedeGestionarPropuestas({ estado: 'PUBLICADA' }).permitido).toBe(true);
    expect(puedeGestionarPropuestas({ estado: 'cerrada' }).permitido).toBe(true);
  });

  it('solo asigna propuestas recibidas o en evaluación', () => {
    expect(puedeAsignarPropuesta({ estado: 'recibida' }).permitido).toBe(true);
    expect(puedeAsignarPropuesta({ estado: 'en_evaluacion' }).permitido).toBe(true);
    const aprobada = puedeAsignarPropuesta({ estado: 'aprobada' });
    expect(aprobada.permitido).toBe(false);
    expect(aprobada.motivo).toContain('Aprobada');
  });

  it('Criterio 2: no deja seleccionar evaluadores con conflicto bloqueante o ya asignados', () => {
    expect(puedeSeleccionarEvaluador({ conflicto: 'NINGUNO' }).permitido).toBe(true);
    expect(puedeSeleccionarEvaluador({ conflicto: 'ADVERTENCIA' }).permitido).toBe(true);
    const bloqueante = puedeSeleccionarEvaluador({ conflicto: 'BLOQUEANTE', detalleConflicto: 'Es autor.' });
    expect(bloqueante).toEqual({ permitido: false, motivo: 'Es autor.' });
    expect(puedeSeleccionarEvaluador({ conflicto: 'NINGUNO', yaAsignado: true }).permitido).toBe(false);

    const disponibles = [
      { comiteEvaluadorId: 1, conflicto: 'NINGUNO' },
      { comiteEvaluadorId: 2, conflicto: 'BLOQUEANTE' },
      { comiteEvaluadorId: 3, conflicto: 'ADVERTENCIA', detalleConflicto: 'Misma afiliación.' },
      { comiteEvaluadorId: 4, conflicto: 'NINGUNO', yaAsignado: true },
    ];
    expect(candidatosReasignacion(disponibles).map((e) => e.comiteEvaluadorId)).toEqual([1, 3]);
    expect(advertenciasDeSeleccion(disponibles, [1, 3])).toEqual(['Misma afiliación.']);
  });

  it('Criterio 3: no se reasigna una evaluación completada', () => {
    expect(puedeReasignar({ estado: 'pendiente' }).permitido).toBe(true);
    expect(puedeReasignar({ estado: 'completada' }).permitido).toBe(false);
  });

  it('arma los textos de carga y de resumen', () => {
    expect(textoCarga(0)).toBe('Sin asignaciones abiertas');
    expect(textoCarga(1)).toBe('1 asignación abierta');
    expect(textoCarga(3)).toBe('3 asignaciones abiertas');
    expect(textoResumenAsignaciones({ asignacionesTotales: 0 })).toBe('Sin evaluadores');
    expect(textoResumenAsignaciones({ asignacionesTotales: 2, asignacionesCompletadas: 1 })).toBe('2 evaluadores · 1 completada');
  });

  it('valida el largo del motivo', () => {
    expect(validarMotivo('Sin disponibilidad')).toBeNull();
    expect(validarMotivo('x'.repeat(256))).toContain('255');
  });

  it('reconoce la confirmación requerida y traduce el 403', () => {
    expect(requiereConfirmacion(errorApi(409, 'CONFIRMACION_REQUERIDA'))).toBe(true);
    expect(requiereConfirmacion(errorApi(409, 'CONFLICTO_INTERES'))).toBe(false);
    expect(interpretarErrorAsignacion(errorApi(403, 'ACCESO_DENEGADO')).mensaje).toContain('PROPUESTAS_ASIGNAR');
    expect(interpretarErrorAsignacion(errorApi(409, 'CONFLICTO_INTERES', 'Es autor.')).mensaje).toBe('Es autor.');
  });

  it('adapta la bandeja al formato de la vista de evaluaciones', () => {
    const rubrica = [{ id: 1, nombre: 'Originalidad', pesoPorcentual: 100 }];
    const fila = normalizarAsignacionBandeja(
      { asignacionId: 12, propuestaId: 40, propuestaTitulo: 'P', convocatoriaTitulo: 'C', estado: 'pendiente' },
      rubrica
    );
    expect(fila.asignacionId).toBe(12);
    expect(fila.evaluaciones).toHaveLength(1);
    expect(fila.evaluaciones[0]).toMatchObject({ asignacionId: 12, criterioId: 1, calificacion: null });
  });
});

describe('contrato de la API de asignaciones (mock usado en Storybook)', () => {
  it('Criterio 1: asigna, cambia la propuesta a en evaluación y la refleja en el historial', async () => {
    const api = crearAsignacionesApiMock({ demora: 0 });
    const creadas = await api.asignarEvaluadores(40, [3]);
    expect(creadas).toHaveLength(1);
    expect(creadas[0]).toMatchObject({ comiteEvaluadorId: 3, estado: 'pendiente', advertencias: [] });

    const propuestas = await api.listarPropuestasConvocatoria(10);
    expect(propuestas.find((p) => p.propuestaId === 40)).toMatchObject({ estado: 'en_evaluacion', asignacionesTotales: 1 });
    const historial = await api.listarHistorial(40);
    expect(historial[0].tipoOperacion).toBe('asignacion');
  });

  it('Criterio 2: impide al autor y exige confirmar la afiliación compartida', async () => {
    const api = crearAsignacionesApiMock({ demora: 0 });
    await expect(api.asignarEvaluadores(40, [8])).rejects.toMatchObject({
      response: { status: 409, data: { codigo: 'CONFLICTO_INTERES' } },
    });
    await expect(api.asignarEvaluadores(40, [7])).rejects.toMatchObject({
      response: { status: 409, data: { codigo: 'CONFIRMACION_REQUERIDA' } },
    });
    const confirmadas = await api.asignarEvaluadores(40, [7], true);
    expect(confirmadas[0].advertencias).toHaveLength(1);
  });

  it('Criterio 3: reasigna, conserva el historial y no repite evaluador', async () => {
    const api = crearAsignacionesApiMock({ demora: 0 });
    const reasignada = await api.reasignar(12, { comiteEvaluadorId: 7, motivo: ' Cambio de agenda ' });
    expect(reasignada).toMatchObject({ asignacionId: 12, comiteEvaluadorId: 7, estado: 'pendiente' });

    const historial = await api.listarHistorial(41);
    expect(historial[0]).toMatchObject({ tipoOperacion: 'reasignacion', evaluadorAnteriorNombre: 'Ana Pérez', motivo: 'Cambio de agenda' });

    await expect(api.reasignar(12, { comiteEvaluadorId: 5 })).rejects.toMatchObject({
      response: { data: { codigo: 'ASIGNACION_DUPLICADA' } },
    });
    await expect(api.reasignar(13, { comiteEvaluadorId: 8 })).rejects.toMatchObject({
      response: { data: { codigo: 'OPERACION_NO_PERMITIDA' } },
    });
  });

  it('la bandeja muestra por defecto solo el trabajo actual', async () => {
    const api = crearAsignacionesApiMock({ demora: 0 });
    expect((await api.miBandeja()).every((a) => a.estado !== 'completada')).toBe(true);
    expect((await api.miBandeja(true)).some((a) => a.estado === 'completada')).toBe(true);
  });
});
