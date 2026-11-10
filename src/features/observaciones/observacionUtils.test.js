import { describe, expect, it } from 'vitest';
import {
  MAX_DESCRIPCION,
  ajustesPendientes,
  gestionaObservaciones,
  infoEstadoObservacion,
  interpretarErrorObservacion,
  mensajeParaAutor,
  opcionesPropuestasProgramables,
  puedeAprobar,
  puedeRegistrar,
  puedeResolver,
  validarObservaciones,
} from './observacionUtils';
import { crearObservacionesApiMock } from './mocks/observacionesMock';

const resumen = (extra = {}) => ({
  propuestaId: 40,
  estadoPropuesta: 'ajustes',
  versionActual: 2,
  versionDefinitiva: null,
  ajustesPendientes: 0,
  ajustesPorAtender: 0,
  puedeAprobarse: false,
  motivoNoAprobable: null,
  observaciones: [],
  ...extra,
});

const obs = (extra = {}) => ({
  id: 1,
  descripcion: 'Ampliar la metodología',
  requiereAjuste: true,
  numeroVersion: 1,
  versionAtencionNumero: null,
  resuelto: false,
  estado: 'pendiente',
  ...extra,
});

describe('observacionUtils (HU-19)', () => {
  it('Criterio 1: valida las observaciones, ignora filas vacías y conserva si requieren ajuste', () => {
    const r = validarObservaciones([
      { descripcion: '  Ampliar la metodología  ', requiereAjuste: true },
      { descripcion: '   ', requiereAjuste: true },
      { descripcion: 'Buen marco teórico', requiereAjuste: false },
    ]);
    expect(r.valido).toBe(true);
    expect(r.observaciones).toEqual([
      { descripcion: 'Ampliar la metodología', requiereAjuste: true },
      { descripcion: 'Buen marco teórico', requiereAjuste: false },
    ]);

    expect(validarObservaciones([{ descripcion: '', requiereAjuste: true }]).general).toContain('al menos una');
    const larga = validarObservaciones([{ descripcion: 'x'.repeat(MAX_DESCRIPCION + 1), requiereAjuste: true }]);
    expect(larga.valido).toBe(false);
    expect(larga.porFila[0]).toContain(String(MAX_DESCRIPCION));
    const muchas = validarObservaciones(Array.from({ length: 31 }, () => ({ descripcion: 'a', requiereAjuste: true })));
    expect(muchas.general).toContain('30');
  });

  it('Criterio 1: solo se registran ajustes en propuestas aprobadas con ajustes y sin versión definitiva', () => {
    expect(puedeRegistrar(resumen()).permitido).toBe(true);
    const aceptada = puedeRegistrar(resumen({ estadoPropuesta: 'aprobada' }));
    expect(aceptada.permitido).toBe(false);
    expect(aceptada.motivo).toContain('aceptada sin modificaciones');
    expect(puedeRegistrar(resumen({ estadoPropuesta: 'en_evaluacion' })).motivo).toContain('evaluada y clasificada');
    expect(puedeRegistrar(resumen({ estadoPropuesta: 'rechazada' })).permitido).toBe(false);
    expect(puedeRegistrar(resumen({ versionDefinitiva: 2 })).motivo).toContain('versión definitiva');
  });

  it('Criterio 2: un ajuste solo se resuelve cuando el autor subió una versión que lo atiende', () => {
    expect(puedeResolver(obs(), resumen()).permitido).toBe(false);
    expect(puedeResolver(obs(), resumen()).motivo).toContain('aún no ha subido');
    expect(puedeResolver(obs({ versionAtencionNumero: 2, estado: 'atendida' }), resumen()).permitido).toBe(true);
    expect(puedeResolver(obs({ requiereAjuste: false, estado: 'comentario' }), resumen()).permitido).toBe(true);
    expect(puedeResolver(obs({ resuelto: true }), resumen()).permitido).toBe(false);
    expect(puedeResolver(obs({ versionAtencionNumero: 2 }), resumen({ versionDefinitiva: 2 })).permitido).toBe(false);
  });

  it('Criterios 3 y 4: la aprobación depende de lo que indica el backend', () => {
    expect(puedeAprobar(resumen({ puedeAprobarse: true }))).toEqual({ permitido: true, motivo: null });
    const bloqueada = puedeAprobar(resumen({ motivoNoAprobable: 'La propuesta tiene 1 ajuste(s) sin resolver.' }));
    expect(bloqueada.permitido).toBe(false);
    expect(bloqueada.motivo).toContain('sin resolver');
    expect(puedeAprobar(null).permitido).toBe(false);
  });

  it('Criterio 4: lista los ajustes pendientes (no los comentarios ni los resueltos)', () => {
    const r = resumen({
      observaciones: [obs({ id: 1 }), obs({ id: 2, resuelto: true }), obs({ id: 3, requiereAjuste: false }), obs({ id: 4, versionAtencionNumero: 2 })],
    });
    expect(ajustesPendientes(r).map((o) => o.id)).toEqual([1, 4]);
  });

  it('muestra observaciones en la clasificación solo si está aplicada como aceptada o con modificaciones', () => {
    expect(gestionaObservaciones({ aplicada: true, clasificacion: 'aprobada' })).toBe(true);
    expect(gestionaObservaciones({ aplicada: true, clasificacion: 'aprobada_con_ajustes' })).toBe(true);
    expect(gestionaObservaciones({ aplicada: true, clasificacion: 'rechazada' })).toBe(false);
    expect(gestionaObservaciones({ aplicada: false, clasificacion: 'aprobada' })).toBe(false);
  });

  it('explica al autor qué le falta', () => {
    expect(mensajeParaAutor(resumen({ ajustesPendientes: 2, ajustesPorAtender: 2 }))).toContain('2 ajustes por atender');
    expect(mensajeParaAutor(resumen({ ajustesPendientes: 1, ajustesPorAtender: 0 }))).toContain('pendiente de revisión');
    expect(mensajeParaAutor(resumen({ versionDefinitiva: 3 }))).toContain('versión 3 fue aprobada como definitiva');
    expect(mensajeParaAutor(resumen())).toContain('no tiene observaciones');
    expect(mensajeParaAutor(resumen({ estadoPropuesta: 'aprobada' }))).toContain('aceptada sin modificaciones');
  });

  it('Criterio 4: interpreta el 409 de aprobación con la lista de pendientes', () => {
    const err = {
      response: {
        status: 409,
        data: { codigo: 'OBSERVACIONES_PENDIENTES', message: 'Tiene 1 ajuste(s) sin resolver.', pendientes: [obs()] },
      },
    };
    const r = interpretarErrorObservacion(err);
    expect(r.titulo).toBe('Quedan ajustes sin resolver');
    expect(r.mensaje).toBe('Tiene 1 ajuste(s) sin resolver.');
    expect(r.pendientes).toHaveLength(1);
    expect(interpretarErrorObservacion({ response: { status: 403, data: {} } }).mensaje).toContain('No tienes permiso');
  });

  it('da etiqueta a cada estado de observación', () => {
    expect(infoEstadoObservacion('atendida').etiqueta).toBe('Atendida, por revisar');
    expect(infoEstadoObservacion('desconocido').etiqueta).toBe('desconocido');
  });

  it('Criterio 3: el selector de la agenda solo ofrece propuestas definitivas y conserva la ya vinculada', () => {
    const lista = [
      { propuestaId: 40, titulo: 'Analítica', numeroVersion: 2, programada: false },
      { propuestaId: 41, titulo: 'Gamificación', numeroVersion: 1, programada: true },
    ];
    const opciones = opcionesPropuestasProgramables(lista);
    expect(opciones.map((o) => o.value)).toEqual(['', '40', '41']);
    expect(opciones[2].label).toContain('ya programada');
    expect(opcionesPropuestasProgramables(lista, 99).at(-1)).toEqual({ value: '99', label: 'Propuesta #99 (vinculada)' });
    expect(opcionesPropuestasProgramables([])[0].label).toContain('No hay propuestas');
  });

  it('flujo completo con la API simulada: registrar, atender, resolver y aprobar', async () => {
    const api = crearObservacionesApiMock({ estado: 'ajustes', versionActual: 1, observaciones: [] });
    let r = await api.listarObservaciones(40);
    expect(r.puedeAprobarse).toBe(false); // aprobada con ajustes sin ajustes registrados

    r = await api.registrarObservaciones(40, [{ descripcion: 'Ampliar la metodología', requiereAjuste: true }]);
    expect(r.ajustesPorAtender).toBe(1);
    await expect(api.aprobarVersionDefinitiva(40)).rejects.toMatchObject({
      response: { status: 409, data: { codigo: 'OBSERVACIONES_PENDIENTES' } },
    });
    const id = r.observaciones[0].id;
    await expect(api.resolverObservacion(40, id)).rejects.toMatchObject({ response: { status: 409 } });

    api.subirVersion();
    r = await api.listarObservaciones(40);
    expect(r.observaciones[0].estado).toBe('atendida');
    await api.resolverObservacion(40, id);
    r = await api.listarObservaciones(40);
    expect(r.puedeAprobarse).toBe(true);

    const aprobada = await api.aprobarVersionDefinitiva(40);
    expect(aprobada.numeroVersion).toBe(2);
    r = await api.listarObservaciones(40);
    expect(r.versionDefinitiva).toBe(2);
    expect(puedeRegistrar(r).permitido).toBe(false);
  });
});
