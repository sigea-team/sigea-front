import { describe, expect, it } from 'vitest';
import {
  MAX_CODIGO,
  combinarInscritos,
  esLecturaRepetida,
  fechaRegistro,
  filtrarInscritos,
  horaRegistro,
  instanteActual,
  interpretarRegistro,
  mensajeError,
  nombreArchivoQr,
  normalizarCodigo,
  porcentajeAsistencia,
  validarCodigo,
} from './asistenciaUtils';

const errorHttp = (status, data) => ({ response: { status, data } });

describe('normalizarCodigo y validarCodigo', () => {
  it('quita espacios y saltos de línea del lector', () => {
    expect(normalizarCodigo('  SIGEA-abc\r\n')).toBe('SIGEA-abc');
    expect(normalizarCodigo(null)).toBe('');
  });

  it('exige un código y respeta el máximo del backend', () => {
    expect(validarCodigo('   ')).toMatch(/Escanea o escribe/);
    expect(validarCodigo('x'.repeat(MAX_CODIGO + 1))).toMatch(/100 caracteres/);
    expect(validarCodigo('SIGEA-abc')).toBeNull();
  });
});

describe('instanteActual', () => {
  it('devuelve la hora actual en milisegundos', () => {
    const antes = Date.now();
    const t = instanteActual();
    expect(t >= antes && t <= Date.now()).toBe(true);
  });
});

describe('esLecturaRepetida', () => {
  it('ignora el mismo código dentro de la ventana', () => {
    const ultima = { codigo: 'SIGEA-1', instante: 1000 };
    expect(esLecturaRepetida(ultima, 'SIGEA-1 ', 3000)).toBe(true);
    expect(esLecturaRepetida(ultima, 'SIGEA-1', 6000)).toBe(false);
    expect(esLecturaRepetida(ultima, 'SIGEA-2', 1500)).toBe(false);
    expect(esLecturaRepetida(null, 'SIGEA-1', 1500)).toBe(false);
  });
});

describe('horaRegistro y fechaRegistro', () => {
  it('toma la hora y la fecha tal como las envía el backend', () => {
    expect(horaRegistro('2026-11-20T09:03:12.512')).toBe('09:03');
    expect(fechaRegistro('2026-11-20T09:03:12')).toBe('20/11/2026');
    expect(horaRegistro(null)).toBe('');
    expect(fechaRegistro('')).toBe('');
  });
});

describe('interpretarRegistro', () => {
  it('Criterio 2: asistencia registrada con nombre y hora', () => {
    const r = interpretarRegistro({ asistencia: { participanteNombre: 'María Pérez', fechaHoraRegistro: '2026-11-20T09:03:00' } });
    expect(r.tipo).toBe('registrada');
    expect(r.mensaje).toBe('María Pérez · 09:03');
  });

  it('Criterio 3: duplicada con la asistencia previa', () => {
    const r = interpretarRegistro({
      error: errorHttp(409, {
        codigo: 'ASISTENCIA_DUPLICADA',
        message: 'ya estaba',
        asistenciaExistente: { participanteNombre: 'María Pérez', fechaHoraRegistro: '2026-11-20T08:58:00' },
      }),
    });
    expect(r.tipo).toBe('duplicada');
    expect(r.mensaje).toContain('08:58');
    expect(r.asistencia.participanteNombre).toBe('María Pérez');
  });

  it('Criterio 3: duplicada sin asistencia previa usa el mensaje del backend', () => {
    const r = interpretarRegistro({ error: errorHttp(409, { codigo: 'ASISTENCIA_DUPLICADA', message: 'Ya estaba registrada.' }) });
    expect(r.tipo).toBe('duplicada');
    expect(r.mensaje).toBe('Ya estaba registrada.');
  });

  it.each([
    ['QR_INVALIDO', 404],
    ['QR_NO_VIGENTE', 409],
    ['QR_OTRO_EVENTO', 409],
    ['NO_INSCRITO_ACTIVIDAD', 409],
    ['ACTIVIDAD_NO_DISPONIBLE', 409],
    ['EVENTO_NO_DISPONIBLE', 409],
  ])('Criterio 3: %s se muestra como rechazo con el mensaje del backend', (codigo, status) => {
    const r = interpretarRegistro({ error: errorHttp(status, { codigo, message: `Detalle ${codigo}` }) });
    expect(r.tipo).toBe('rechazada');
    expect(r.codigo).toBe(codigo);
    expect(r.mensaje).toBe(`Detalle ${codigo}`);
  });

  it('errores generales: permiso, no encontrado, conexión y validación', () => {
    expect(interpretarRegistro({ error: errorHttp(403, {}) }).tipo).toBe('error');
    expect(interpretarRegistro({ error: errorHttp(404, { codigo: 'RECURSO_NO_ENCONTRADO', message: 'No existe' }) }).mensaje).toBe('No existe');
    expect(interpretarRegistro({ error: { request: {} } }).titulo).toBe('Sin conexión');
    expect(interpretarRegistro({ error: errorHttp(400, { codigo: 'VALIDACION_FALLIDA' }) }).tipo).toBe('rechazada');
  });
});

describe('mensajeError', () => {
  it('prioriza el mensaje del backend y entiende respuestas Blob sin mensaje', () => {
    expect(mensajeError(errorHttp(409, { message: 'Sin correo' }), 'x')).toBe('Sin correo');
    expect(mensajeError(errorHttp(404, {}), 'x')).toMatch(/No se encontró/);
    // La imagen se pide como Blob: su error no trae `message`
    expect(mensajeError(errorHttp(500, new Blob(['{}'])), 'Por defecto')).toBe('Por defecto');
    expect(mensajeError(errorHttp(403, {}), 'x')).toMatch(/permiso/);
  });
});

describe('combinarInscritos y filtrarInscritos', () => {
  const inscritosActividad = [{ inscripcionId: 1 }, { inscripcionId: 2 }, { inscripcionId: 3 }, { inscripcionId: 2 }];
  const inscripcionesEvento = [
    { inscripcionId: 1, personaNombre: 'Zoila Álvarez', personaCorreo: 'zoila@ufps.edu.co', categoria: 'docente' },
    { inscripcionId: 2, personaNombre: 'Ana Gómez', personaCorreo: 'ana@ufps.edu.co', categoria: 'estudiante' },
  ];
  const asistencias = [{ inscripcionId: 2, asistenciaId: 9, fechaHoraRegistro: '2026-11-20T09:00:00' }];

  it('une los datos, marca la asistencia, quita duplicados y pone pendientes primero', () => {
    const filas = combinarInscritos(inscritosActividad, inscripcionesEvento, asistencias);
    expect(filas.map((f) => f.inscripcionId)).toEqual([3, 1, 2]);
    expect(filas[0].nombre).toBe('Inscripción #3');
    expect(filas[1].nombre).toBe('Zoila Álvarez');
    expect(filas[2].asistencia.asistenciaId).toBe(9);
  });

  it('busca por nombre o correo sin tildes', () => {
    const filas = combinarInscritos(inscritosActividad, inscripcionesEvento, asistencias);
    expect(filtrarInscritos(filas, 'alvarez').map((f) => f.inscripcionId)).toEqual([1]);
    expect(filtrarInscritos(filas, 'ANA@').map((f) => f.inscripcionId)).toEqual([2]);
    expect(filtrarInscritos(filas, '  ')).toHaveLength(3);
  });
});

describe('porcentajeAsistencia y nombreArchivoQr', () => {
  it('calcula el porcentaje sin dividir por cero', () => {
    expect(porcentajeAsistencia(3, 4)).toBe(75);
    expect(porcentajeAsistencia(0, 0)).toBe(0);
    expect(porcentajeAsistencia(5, 4)).toBe(100);
  });

  it('arma un nombre de archivo seguro', () => {
    expect(nombreArchivoQr('Semana de Ingeniería 2026')).toBe('qr-semana-de-ingenieria-2026.png');
    expect(nombreArchivoQr('')).toBe('qr-evento.png');
  });
});
