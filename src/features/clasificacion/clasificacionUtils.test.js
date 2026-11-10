import { describe, expect, it } from 'vitest';
import {
  agruparPropuestas,
  clasificarPuntuacion,
  contarPorClasificar,
  etiquetaClasificacion,
  grupoDe,
  interpretarErrorClasificacion,
  leerNumero,
  motivoIncompleta,
  opcionesAjuste,
  puedeAjustar,
  puedeClasificar,
  puedeGestionarClasificacion,
  requiereReclasificar,
  resumenAplicacion,
  validarMotivo,
  validarUmbrales,
  clasificacionIniciada,
} from './clasificacionUtils';
import { crearClasificacionApiMock } from './mocks/clasificacionMock';

const fila = (extra = {}) => ({
  propuestaId: 1,
  evaluacionCompleta: true,
  aplicada: false,
  ajusteManual: false,
  asignacionesPendientes: 0,
  puntuacionPonderada: 7.5,
  clasificacion: 'aprobada',
  clasificacionPorUmbrales: 'aprobada',
  ...extra,
});

const errorApi = (status, codigo, message, erroresValidacion) => ({
  response: { status, data: { status, codigo, message, erroresValidacion } },
});

describe('clasificacionUtils (HU-18)', () => {
  it('usa los nombres de la historia de usuario', () => {
    expect(etiquetaClasificacion('aprobada')).toBe('Aceptada');
    expect(etiquetaClasificacion('aprobada_con_ajustes')).toBe('Aceptada con modificaciones');
    expect(etiquetaClasificacion('rechazada')).toBe('Rechazada');
    expect(etiquetaClasificacion(null)).toBe('Sin clasificar');
  });

  it('solo gestiona la clasificación de convocatorias fuera de borrador', () => {
    expect(puedeGestionarClasificacion({ estado: 'BORRADOR' }).permitido).toBe(false);
    expect(puedeGestionarClasificacion({ estado: 'PUBLICADA' }).permitido).toBe(true);
    expect(puedeGestionarClasificacion({ estado: 'cerrada' }).permitido).toBe(true);
  });

  it('Criterio 1: clasifica con límites inclusivos y con los umbrales de la convocatoria', () => {
    expect(clasificarPuntuacion(7)).toBe('aprobada');
    expect(clasificarPuntuacion(6.99)).toBe('aprobada_con_ajustes');
    expect(clasificarPuntuacion(5)).toBe('aprobada_con_ajustes');
    expect(clasificarPuntuacion(4.99)).toBe('rechazada');
    expect(clasificarPuntuacion(8, { umbralAceptacion: 8.5, umbralAjustes: 6 })).toBe('aprobada_con_ajustes');
    expect(clasificarPuntuacion(null)).toBeNull();
  });

  it('Criterio 1: valida los umbrales como el backend', () => {
    expect(validarUmbrales({ umbralAceptacion: '7', umbralAjustes: '5' })).toEqual({
      valido: true,
      errores: {},
      umbrales: { umbralAceptacion: 7, umbralAjustes: 5 },
    });
    expect(validarUmbrales({ umbralAceptacion: '7,5', umbralAjustes: '6,25' }).umbrales).toEqual({
      umbralAceptacion: 7.5,
      umbralAjustes: 6.25,
    });
    expect(validarUmbrales({ umbralAceptacion: '6', umbralAjustes: '6' }).valido).toBe(true);
    expect(validarUmbrales({ umbralAceptacion: '5', umbralAjustes: '7' }).errores.umbralAjustes).toContain('mayor');
    expect(validarUmbrales({ umbralAceptacion: '11', umbralAjustes: '5' }).errores.umbralAceptacion).toContain('0 y 10');
    expect(validarUmbrales({ umbralAceptacion: '7', umbralAjustes: '-1' }).errores.umbralAjustes).toContain('0 y 10');
    expect(validarUmbrales({ umbralAceptacion: '7.125', umbralAjustes: '5' }).errores.umbralAceptacion).toContain('2 decimales');
    expect(validarUmbrales({ umbralAceptacion: '', umbralAjustes: 'abc' }).valido).toBe(false);
  });

  it('lee números con coma o punto decimal', () => {
    expect(leerNumero('7,5')).toBe(7.5);
    expect(leerNumero(' 6.25 ')).toBe(6.25);
    expect(leerNumero('')).toBeNull();
    expect(leerNumero('abc')).toBeNull();
  });

  it('Criterio 2: el motivo del ajuste es obligatorio y tiene mínimo 10 caracteres', () => {
    expect(validarMotivo('')).toContain('motivo');
    expect(validarMotivo('   corto   ')).toContain('10');
    expect(validarMotivo('x'.repeat(1001))).toContain('1000');
    expect(validarMotivo('  El comité pidió ajustes.  ')).toBeNull();
  });

  it('Criterio 2: el ajuste no ofrece la clasificación ya aplicada', () => {
    expect(opcionesAjuste(fila({ aplicada: true })).map((o) => o.value)).toEqual(['aprobada_con_ajustes', 'rechazada']);
    expect(opcionesAjuste(fila({ aplicada: false })).map((o) => o.value)).toHaveLength(3);
  });

  it('Criterio 3: impide clasificar y ajustar sin evaluación completa', () => {
    const pendiente = fila({ evaluacionCompleta: false, asignacionesPendientes: 2, puntuacionPonderada: null });
    expect(puedeClasificar(pendiente)).toEqual({ permitido: false, motivo: 'Tiene 2 evaluaciones pendientes.' });
    expect(puedeAjustar(pendiente).permitido).toBe(false);
    expect(motivoIncompleta(fila({ evaluacionCompleta: false, puntuacionPonderada: null }))).toContain('evaluadores');
    expect(puedeClasificar(fila()).permitido).toBe(true);
    expect(puedeAjustar(fila()).permitido).toBe(true);
  });

  it('vuelve a permitir clasificar si los umbrales cambiaron, salvo ajuste manual', () => {
    const aplicada = fila({ aplicada: true });
    expect(puedeClasificar(aplicada).permitido).toBe(false);
    const cambiaria = fila({ aplicada: true, clasificacionPorUmbrales: 'aprobada_con_ajustes' });
    expect(requiereReclasificar(cambiaria)).toBe(true);
    expect(puedeClasificar(cambiaria).permitido).toBe(true);
    const manual = fila({ aplicada: true, ajusteManual: true, clasificacion: 'rechazada' });
    expect(requiereReclasificar(manual)).toBe(false);
    expect(puedeClasificar(manual).permitido).toBe(false);
  });

  it('agrupa como el backend y cuenta las que «Clasificar todas» cambiaría', () => {
    const filas = [
      fila({ propuestaId: 1, evaluacionCompleta: false }),
      fila({ propuestaId: 2 }),
      fila({ propuestaId: 3, aplicada: true, clasificacion: 'rechazada', clasificacionPorUmbrales: 'rechazada' }),
      fila({ propuestaId: 4, aplicada: true }),
    ];
    expect(filas.map(grupoDe)).toEqual(['evaluacion_incompleta', 'sin_clasificar', 'rechazada', 'aprobada']);
    expect(agruparPropuestas(filas).map((g) => [g.id, g.propuestas.map((p) => p.propuestaId)])).toEqual([
      ['aprobada', [4]],
      ['rechazada', [3]],
      ['sin_clasificar', [2]],
      ['evaluacion_incompleta', [1]],
    ]);
    expect(contarPorClasificar(filas)).toBe(1);
  });

  it('resume la aplicación masiva', () => {
    expect(resumenAplicacion({ clasificadas: [{}, {}], omitidas: [{}] })).toBe(
      '2 propuestas evaluadas tienen su clasificación aplicada; 1 propuesta no se clasificó porque su evaluación no está completa.'
    );
    expect(resumenAplicacion({ clasificadas: [], omitidas: [] })).toContain('no tiene propuestas');
  });

  it('interpreta los errores del backend', () => {
    const noEvaluada = interpretarErrorClasificacion(errorApi(409, 'PROPUESTA_NO_EVALUADA', 'La propuesta no se puede clasificar.'));
    expect(noEvaluada).toMatchObject({ noEvaluada: true, mensaje: 'La propuesta no se puede clasificar.', status: 409 });
    const validacion = interpretarErrorClasificacion(errorApi(400, 'VALIDACION_FALLIDA', 'Datos inválidos', { motivo: 'Obligatorio' }));
    expect(validacion.campos).toEqual({ motivo: 'Obligatorio' });
    expect(interpretarErrorClasificacion(errorApi(403)).mensaje).toContain('PROPUESTAS_CLASIFICAR');
    expect(interpretarErrorClasificacion({ request: {} }).mensaje).toContain('conectarse');
  });
});

describe('Configuración fija desde la primera clasificación', () => {
  it('la clasificación empieza con la primera propuesta que tiene fecha de clasificación', () => {
    expect(clasificacionIniciada([])).toBe(false);
    expect(clasificacionIniciada(undefined)).toBe(false);
    expect(clasificacionIniciada([{ fechaClasificacion: null }, { fechaClasificacion: null }])).toBe(false);
    expect(clasificacionIniciada([{ fechaClasificacion: null }, { fechaClasificacion: '2026-11-04T10:30:00' }])).toBe(true);
  });

  it('sin propuestas clasificadas los umbrales se guardan; después de «Clasificar todas» responde 409', async () => {
    const api = crearClasificacionApiMock({ demora: 0, sinClasificar: true });
    const guardados = await api.configurarUmbrales(10, { umbralAceptacion: 8, umbralAjustes: 6 });
    expect(guardados).toMatchObject({ umbralAceptacion: 8, umbralAjustes: 6, propuestasPorReaplicar: 0 });
    await api.aplicarConvocatoria(10);
    await expect(api.configurarUmbrales(10, { umbralAceptacion: 9, umbralAjustes: 6 })).rejects.toMatchObject({
      response: { status: 409, data: { codigo: 'OPERACION_NO_PERMITIDA' } },
    });
    const listado = await api.listarPorConvocatoria(10);
    expect(listado.umbralAceptacion).toBe(8);
  });
});

describe('API simulada de clasificación (HU-18)', () => {
  it('Criterios 1 y 3: clasifica las evaluadas y omite las incompletas', async () => {
    const api = crearClasificacionApiMock({ demora: 0 });
    const resultado = await api.aplicarConvocatoria(10);
    expect(resultado.omitidas.map((o) => o.propuestaId)).toEqual([44, 45]);
    const listado = await api.listarPorConvocatoria(10);
    expect(listado.totales).toMatchObject({ aprobada: 1, aprobada_con_ajustes: 2, rechazada: 1, sin_clasificar: 0, evaluacion_incompleta: 2 });
  });

  it('Criterio 2: el ajuste exige motivo y queda en el historial', async () => {
    const api = crearClasificacionApiMock({ demora: 0 });
    await expect(api.ajustarClasificacion(42, { clasificacion: 'rechazada', motivo: 'corto' })).rejects.toMatchObject({
      response: { status: 400 },
    });
    const ajustada = await api.ajustarClasificacion(42, { clasificacion: 'rechazada', motivo: 'No cumple el alcance de la convocatoria.' });
    expect(ajustada).toMatchObject({ clasificacion: 'rechazada', ajusteManual: true, aplicada: true });
    const historial = await api.listarHistorial(42);
    expect(historial[0]).toMatchObject({ tipo: 'manual', motivo: 'No cumple el alcance de la convocatoria.' });
  });

  it('Criterio 3: responde 409 PROPUESTA_NO_EVALUADA', async () => {
    const api = crearClasificacionApiMock({ demora: 0 });
    await expect(api.aplicarPropuesta(44)).rejects.toMatchObject({
      response: { status: 409, data: { codigo: 'PROPUESTA_NO_EVALUADA' } },
    });
  });
});
