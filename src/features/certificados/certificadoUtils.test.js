import { describe, expect, it } from 'vitest';
import {
  aPorcentajeRequest,
  conteoPorTipo,
  erroresDeBackend,
  etiquetaTipo,
  eventoTerminado,
  filtrarCertificados,
  formatearFecha,
  formatearPorcentaje,
  formatearRangoEvento,
  interpretarErrorCertificado,
  moverFirmante,
  nombreArchivoCertificado,
  normalizarCodigo,
  resumenEmision,
  resumenEvento,
  situacionOpcion,
  textoAsistencia,
  validarFirmante,
  validarImagen,
  validarBlob,
  validarPorcentaje,
} from './certificadoUtils';
import { crearCertificadosApiMock } from './mocks/certificadosMock';

const archivo = (nombre, type, size) => ({ name: nombre, type, size });
const MB = 1024 * 1024;

describe('interpretarErrorCertificado', () => {
  it('muestra el motivo del backend cuando no cumple los requisitos (Criterio 2)', () => {
    const err = {
      response: {
        status: 409,
        data: { codigo: 'CERTIFICADO_REQUISITOS_NO_CUMPLIDOS', message: 'Asististe a 1 de 4 actividades (25 %); el mínimo es 80 %.' },
      },
    };
    expect(interpretarErrorCertificado(err)).toMatchObject({
      titulo: 'No cumples los requisitos',
      mensaje: 'Asististe a 1 de 4 actividades (25 %); el mínimo es 80 %.',
      codigo: 'CERTIFICADO_REQUISITOS_NO_CUMPLIDOS',
      status: 409,
    });
  });

  it('distingue sesión vencida, permiso, red y errores sin mensaje', () => {
    expect(interpretarErrorCertificado({ response: { status: 401, data: {} } }).mensaje).toMatch(/sesión/);
    expect(interpretarErrorCertificado({ response: { status: 403, data: {} } }).titulo).toBe('Acceso denegado');
    expect(interpretarErrorCertificado({ request: {} }).mensaje).toMatch(/conectarse/);
    expect(interpretarErrorCertificado({ response: { status: 503, data: {} } }).mensaje).toMatch(/servidor/);
  });

  it('entrega los errores de la imagen por campo', () => {
    const err = { response: { status: 400, data: { codigo: 'ARCHIVO_INVALIDO', erroresValidacion: { fondo: 'Debe ser horizontal.' } } } };
    const info = interpretarErrorCertificado(err);
    expect(info.titulo).toBe('Imagen no válida');
    expect(info.mensaje).toBe('Debe ser horizontal.');
    expect(erroresDeBackend(err)).toEqual({ fondo: 'Debe ser horizontal.' });
    expect(erroresDeBackend({ response: { status: 400, data: { erroresValidacion: { archivo: 'x' } } } })).toEqual({ fondo: 'x' });
  });
});

describe('formato', () => {
  it('fechas del backend sin corrimiento de zona horaria', () => {
    expect(formatearFecha('2026-11-12')).toBe('12 de noviembre de 2026');
    expect(formatearFecha(null)).toBe('—');
    expect(formatearRangoEvento('2026-11-10', '2026-11-12')).toBe('del 10 de noviembre de 2026 al 12 de noviembre de 2026');
    expect(formatearRangoEvento('2026-11-10', '2026-11-10')).toBe('el 10 de noviembre de 2026');
  });

  it('porcentajes con coma decimal', () => {
    expect(formatearPorcentaje(85.714)).toBe('85,71 %');
    expect(formatearPorcentaje('80.00')).toBe('80 %');
    expect(formatearPorcentaje(null)).toBe('—');
  });

  it('etiquetas y nombre del archivo', () => {
    expect(etiquetaTipo('ponente')).toBe('Ponente');
    expect(etiquetaTipo('evaluador', 'Evaluador')).toBe('Evaluador');
    expect(nombreArchivoCertificado({ tipo: 'asistente', codigoVerificacion: 'CERT-AB12' })).toBe('certificado-asistente-CERT-AB12.pdf');
  });
});

describe('situacionOpcion (participante)', () => {
  const evento = { certificadosHabilitados: true };

  it('emitido: ya tiene el certificado (Criterio 3)', () => {
    expect(situacionOpcion({ cumpleRequisitos: true, certificado: { certificadoId: 1 } }, evento).id).toBe('emitido');
  });

  it('disponible: cumple y puede obtenerlo (Criterio 1)', () => {
    expect(situacionOpcion({ cumpleRequisitos: true, puedeGenerar: true, certificado: null }, evento).id).toBe('disponible');
  });

  it('no cumple: muestra el motivo (Criterio 2)', () => {
    const s = situacionOpcion({ cumpleRequisitos: false, motivo: 'Asististe a 1 de 4.' }, evento);
    expect(s).toMatchObject({ id: 'no_cumple', texto: 'Asististe a 1 de 4.' });
  });

  it('en espera mientras el organizador no habilita', () => {
    const s = situacionOpcion({ cumpleRequisitos: true, puedeGenerar: false, motivo: null }, { certificadosHabilitados: false });
    expect(s.id).toBe('en_espera');
    expect(s.texto).toMatch(/no ha habilitado/);
  });

  it('resumen y texto de asistencia', () => {
    expect(resumenEvento({ opciones: [{ certificado: {} }, { puedeGenerar: true }, {}] })).toEqual({ emitidos: 1, disponibles: 1, total: 3 });
    expect(textoAsistencia({ tipo: 'asistente', actividadesConsideradas: 4, actividadesAsistidas: 3, porcentajeAsistencia: 75 })).toBe(
      'Asististe a 3 de 4 actividades (75 %).'
    );
    expect(textoAsistencia({ tipo: 'asistente', actividadesConsideradas: 0 })).toMatch(/No tenías/);
    expect(textoAsistencia({ tipo: 'ponente' })).toBeNull();
  });
});

describe('organizador', () => {
  it('eventoTerminado sigue la regla del backend', () => {
    const hoy = new Date(2026, 10, 25);
    expect(eventoTerminado({ estado: 'cerrado', fechaFin: '2026-12-01' }, hoy)).toBe(true);
    expect(eventoTerminado({ estado: 'en_ejecucion', fechaFin: '2026-11-24' }, hoy)).toBe(true);
    expect(eventoTerminado({ estado: 'en_ejecucion', fechaFin: '2026-11-25' }, hoy)).toBe(false);
    expect(eventoTerminado({ estado: 'en_configuracion', fechaFin: '2026-01-01' }, hoy)).toBe(false);
  });

  it('validarPorcentaje', () => {
    expect(validarPorcentaje('')).toMatch(/Indica/);
    expect(validarPorcentaje('0')).toMatch(/mayor que 0/);
    expect(validarPorcentaje('100.5')).toMatch(/no puede ser mayor/);
    expect(validarPorcentaje('80,555')).toMatch(/2 decimales/);
    expect(validarPorcentaje('abc')).toMatch(/2 decimales/);
    expect(validarPorcentaje('75,5')).toBeNull();
    expect(aPorcentajeRequest('75,5')).toBe(75.5);
  });

  it('validarImagen revisa formato y peso según el uso', () => {
    expect(validarImagen(archivo('f.gif', 'image/gif', 100), 'fondo')).toMatch(/PNG o JPG/);
    expect(validarImagen(archivo('f.jpg', 'image/jpeg', 6 * MB), 'fondo')).toMatch(/5 MB/);
    expect(validarImagen(archivo('f.jpg', 'image/jpeg', 4 * MB), 'fondo')).toBeNull();
    expect(validarImagen(archivo('f.png', 'image/png', 3 * MB), 'firma')).toMatch(/2 MB/);
    expect(validarImagen(archivo('firma.PNG', '', 100), 'firma')).toBeNull();
    expect(validarImagen(null, 'firma')).toMatch(/firma/);
  });

  it('validarFirmante exige la firma solo al crear', () => {
    expect(validarFirmante({ nombre: '', cargo: ' ', firma: null }, true)).toEqual({
      nombre: expect.any(String),
      cargo: expect.any(String),
      firma: expect.any(String),
    });
    expect(validarFirmante({ nombre: 'Ana', cargo: 'Decana', firma: null }, false)).toEqual({});
    expect(validarFirmante({ nombre: 'x'.repeat(151), cargo: 'Decana', firma: archivo('f.png', 'image/png', 10) }, true)).toHaveProperty('nombre');
  });

  it('moverFirmante intercambia posiciones sin salirse de la lista', () => {
    const f = [{ firmanteId: 1 }, { firmanteId: 2 }, { firmanteId: 3 }];
    expect(moverFirmante(f, 0, 1)).toEqual([2, 1, 3]);
    expect(moverFirmante(f, 2, -1)).toEqual([1, 3, 2]);
    expect(moverFirmante(f, 0, -1)).toEqual([1, 2, 3]);
  });

  it('resumenEmision', () => {
    expect(resumenEmision({ generados: [{}, {}], yaEmitidos: 1, excluidos: [{}] })).toBe(
      'Se emitieron 2 certificados. 1 certificado ya existía y no se duplicó. 1 participación no cumple los requisitos.'
    );
    expect(resumenEmision({ generados: [], yaEmitidos: 0, excluidos: [] })).toBe('No se emitieron certificados nuevos.');
  });

  it('filtrarCertificados y conteoPorTipo', () => {
    const lista = [
      { tipo: 'asistente', nombreParticipante: 'Ana Pérez', numeroDocumento: '109', codigoVerificacion: 'CERT-AA' },
      { tipo: 'ponente', nombreParticipante: 'Jorge Méndez', numeroDocumento: '882', codigoVerificacion: 'CERT-BB' },
    ];
    expect(filtrarCertificados(lista, 'ana')).toHaveLength(1);
    expect(filtrarCertificados(lista, 'cert-bb')).toHaveLength(1);
    expect(filtrarCertificados(lista, '', 'ponente')[0].nombreParticipante).toBe('Jorge Méndez');
    expect(conteoPorTipo(lista)).toEqual({ asistente: 1, ponente: 1 });
  });
});

describe('normalizarCodigo', () => {
  it('acepta el código o la URL completa del certificado', () => {
    expect(normalizarCodigo('  cert-ab12 ')).toBe('CERT-AB12');
    expect(normalizarCodigo('https://sigea-team.github.io/sigea-front/#/verificar/CERT-AB12')).toBe('CERT-AB12');
    // El código va después de «#/verificar/» sin importar el dominio ni la ruta base.
    expect(normalizarCodigo('http://localhost:5173/sigea-front/#/verificar/cert-e924f7ee')).toBe('CERT-E924F7EE');
    expect(normalizarCodigo('https://otro-dominio.edu.co/#/verificar/CERT-AB12?origen=qr')).toBe('CERT-AB12');
    expect(normalizarCodigo('')).toBe('');
  });
});

describe('API simulada (mismas reglas del backend)', () => {
  it('habilitar exige plantilla completa', async () => {
    const api = crearCertificadosApiMock({ conFondo: false });
    await expect(api.habilitarCertificados(1)).rejects.toMatchObject({ response: { data: { codigo: 'PLANTILLA_CERTIFICADO_INCOMPLETA' } } });
  });

  it('habilitar emite a quienes cumplen, excluye a los demás con motivo y congela la plantilla', async () => {
    const api = crearCertificadosApiMock();
    const r = await api.habilitarCertificados(1);
    expect(r.generados.map((c) => c.tipo).sort()).toEqual(['asistente', 'asistente', 'asistente', 'conferencista', 'ponente']);
    expect(r.excluidos).toHaveLength(1);
    expect(r.excluidos[0].motivo).toMatch(/el mínimo es 80 %/);
    expect((await api.consultarPlantilla(1)).editable).toBe(false);
    await expect(api.eliminarFondo(1)).rejects.toMatchObject({ response: { data: { codigo: 'PLANTILLA_CERTIFICADO_BLOQUEADA' } } });
    const otra = await api.generarCertificadosEvento(1);
    expect(otra.generados).toHaveLength(0);
    expect(otra.yaEmitidos).toBe(5);
  });

  it('solicitar dos veces entrega el mismo certificado (Criterio 3)', async () => {
    const api = crearCertificadosApiMock({ habilitada: true });
    const a = await api.solicitarCertificado(1, 'asistente');
    const b = await api.solicitarCertificado(1, 'asistente');
    expect(a.generadoAhora).toBe(false);
    expect(b.certificado.codigoVerificacion).toBe(a.certificado.codigoVerificacion);
    expect((await api.verificarCertificado(a.certificado.codigoVerificacion)).documento).toBe('CC ********56');
  });
});

describe('validarBlob (respuestas de archivos)', () => {
  const pdf = (type = 'application/pdf') => new Blob(['%PDF-1.4\n...'], { type });
  const error = { response: { status: 200, data: { codigo: 'ARCHIVO_INESPERADO' } } };

  it('acepta un PDF por su tipo o, sin tipo, por su firma %PDF', async () => {
    expect((await validarBlob(pdf(), 'pdf')).type).toBe('application/pdf');
    expect((await validarBlob(pdf(''), 'pdf')).type).toBe('application/pdf');
    expect((await validarBlob(pdf('application/octet-stream'), 'pdf')).type).toBe('application/pdf');
  });

  it('rechaza una respuesta 200 que no es el archivo pedido', async () => {
    await expect(validarBlob(new Blob(['<html></html>'], { type: 'text/html' }), 'pdf')).rejects.toMatchObject(error);
    await expect(validarBlob(new Blob(['no es pdf'], { type: '' }), 'pdf')).rejects.toMatchObject(error);
    await expect(validarBlob(new Blob([], { type: 'application/pdf' }), 'pdf')).rejects.toMatchObject(error);
    await expect(validarBlob(pdf(), 'imagen')).rejects.toMatchObject(error);
  });

  it('acepta imágenes solo con tipo image/*', async () => {
    const png = new Blob(['x'], { type: 'image/png' });
    expect(await validarBlob(png, 'imagen')).toBe(png);
  });
});
