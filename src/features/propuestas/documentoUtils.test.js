import { describe, expect, it } from 'vitest';
import {
  MAXIMO_DOCUMENTOS,
  clasificarArchivos,
  construirCambiosVersion,
  extensionDe,
  formatearTamano,
  interpretarErrorPropuesta,
  puedeAutorizarEdicion,
  puedeModificarPropuesta,
  validarArchivo,
  validarNuevaVersion,
} from './documentoUtils';

const MB = 1024 * 1024;
const archivo = (name, size = 2048) => ({ name, size });
const errorApi = (status, data) => ({ response: { status, data } });

describe('documentoUtils (HU-14)', () => {
  it('obtiene la extensión en minúsculas', () => {
    expect(extensionDe('Informe.Final.PDF')).toBe('pdf');
    expect(extensionDe('sin-extension')).toBe('');
    expect(extensionDe('.gitignore')).toBe('');
  });

  it('formatea tamaños legibles', () => {
    expect(formatearTamano(512 * 1024)).toBe('512 KB');
    expect(formatearTamano(2.5 * MB)).toBe('2.5 MB');
    expect(formatearTamano(0)).toBe('0 KB');
  });

  it('Criterio 2: rechaza formato, archivo vacío y tamaño excedido', () => {
    expect(validarArchivo(archivo('ponencia.pdf'))).toBeNull();
    expect(validarArchivo(archivo('anexo.DOCX'))).toBeNull();
    expect(validarArchivo(archivo('foto.png'))).toContain('Formato no permitido');
    expect(validarArchivo(archivo('vacio.pdf', 0))).toContain('vacío');
    expect(validarArchivo(archivo('grande.pdf', 11 * MB))).toContain('10 MB');
  });

  it('Criterio 2: respeta el máximo de documentos por versión', () => {
    const elegidos = [archivo('a.pdf'), archivo('b.pdf'), archivo('c.png')];
    const { validos, rechazados } = clasificarArchivos(elegidos, MAXIMO_DOCUMENTOS - 1);
    expect(validos.map((a) => a.name)).toEqual(['a.pdf']);
    expect(rechazados).toHaveLength(2);
    expect(rechazados[0].motivo).toContain(`máximo ${MAXIMO_DOCUMENTOS}`);
    expect(rechazados[1].motivo).toContain('Formato no permitido');
  });

  it('Criterio 2: interpreta ARCHIVO_INVALIDO con el detalle por archivo', () => {
    const err = errorApi(400, {
      codigo: 'ARCHIVO_INVALIDO',
      message: 'Uno o varios documentos no cumplen las condiciones de carga.',
      erroresValidacion: { 'documentos[1]': 'foto.png: formato no permitido.', titulo: 'El título es obligatorio' },
    });
    const r = interpretarErrorPropuesta(err);
    expect(r.titulo).toBe('Revisa los documentos adjuntos');
    expect(r.mensaje).toContain('no cumplen');
    expect(r.detalles).toContain('Documento 2: foto.png: formato no permitido.');
    expect(r.detalles).toContain('Título: El título es obligatorio');
  });

  it('Criterio 2: interpreta la convocatoria cerrada', () => {
    const r = interpretarErrorPropuesta(errorApi(400, { codigo: 'CONVOCATORIA_CERRADA', message: 'Ya cerró.' }));
    expect(r.titulo).toBe('La convocatoria ya cerró');
    expect(r.detalles).toEqual([]);
  });

  it('usa un mensaje propio para el 403', () => {
    const r = interpretarErrorPropuesta(errorApi(403, { codigo: 'ACCESO_DENEGADO', message: 'x' }));
    expect(r.titulo).toBe('Sin permiso');
    expect(r.mensaje).toContain('propuesta');
  });

  it('Criterio 3: permite modificar una propuesta recibida con la convocatoria abierta o con ajustes', () => {
    const ahora = new Date('2026-11-01T12:00:00');
    const abierta = { propuesta: { estado: 'recibida' }, convocatoriaEstado: 'PUBLICADA', convocatoriaFechaCierre: '2026-11-30T23:59:00' };
    expect(puedeModificarPropuesta(abierta, ahora).permitido).toBe(true);
    const vencida = { ...abierta, convocatoriaFechaCierre: '2026-10-30T23:59:00' };
    expect(puedeModificarPropuesta(vencida, ahora).permitido).toBe(false);
    expect(puedeModificarPropuesta({ propuesta: { estado: 'ajustes' }, convocatoriaEstado: 'CERRADA' }, ahora).permitido).toBe(true);
    expect(puedeModificarPropuesta({ propuesta: { estado: 'en_evaluacion' } }, ahora).permitido).toBe(false);
    expect(puedeModificarPropuesta({ propuesta: { estado: 'rechazada' } }, ahora).permitido).toBe(false);
  });

  it('Criterio 5: con versión definitiva solo permite modificar con autorización explícita', () => {
    const bloqueada = { propuesta: { estado: 'aprobada' }, tieneVersionDefinitiva: true, edicionAutorizada: false };
    const r = puedeModificarPropuesta(bloqueada);
    expect(r.permitido).toBe(false);
    expect(r.motivo).toContain('autorización explícita');
    const autorizada = puedeModificarPropuesta({ ...bloqueada, edicionAutorizada: true });
    expect(autorizada).toEqual({ permitido: true, motivo: null, usaAutorizacion: true });
  });

  it('Criterio 5: el administrador solo autoriza propuestas con versión definitiva', () => {
    expect(puedeAutorizarEdicion([{ esDefinitiva: false }, { esDefinitiva: true }], 'aprobada')).toBe(true);
    expect(puedeAutorizarEdicion([{ esDefinitiva: false }], 'en_evaluacion')).toBe(false);
    expect(puedeAutorizarEdicion([{ esDefinitiva: true }], 'rechazada')).toBe(false);
  });

  it('valida la nueva versión: título obligatorio y al menos un documento', () => {
    expect(validarNuevaVersion({ titulo: 'IA' }, 1)).toEqual({});
    const errores = validarNuevaVersion({ titulo: '  ' }, 0);
    expect(errores.titulo).toBeDefined();
    expect(errores.documentos).toContain('al menos un documento');
    expect(validarNuevaVersion({ titulo: 'IA' }, MAXIMO_DOCUMENTOS + 1).documentos).toContain('máximo');
  });

  it('envía solo los campos que cambiaron', () => {
    const original = { titulo: 'IA en la educación', resumen: 'Resumen', palabrasClave: 'IA' };
    const form = { titulo: 'IA en la educación', resumen: 'Resumen corregido', palabrasClave: 'IA', notaCambio: ' Ajuste ' };
    expect(construirCambiosVersion(form, original, [7])).toEqual({
      titulo: null,
      resumen: 'Resumen corregido',
      palabrasClave: null,
      lineaTematicaId: null,
      notaCambio: 'Ajuste',
      documentosConservados: [7],
    });
  });
});
