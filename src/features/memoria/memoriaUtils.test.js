import { describe, expect, it } from 'vitest';
import {
  aCierreRequest,
  agruparActividadesPorFecha,
  fechaLocalIso,
  formatearPesos,
  formatearValorIndicador,
  indicadoresDestacados,
  interpretarErrorMemoria,
  parsearContenido,
  propuestasDeConvocatorias,
  puedeCerrarFormalmente,
  puedeEliminarConAutorizacion,
  semestresDisponibles,
  validarCierre,
  validarEliminacion,
  valorIndicador,
  veMemoriaHistorica,
} from './memoriaUtils';

const HOY = new Date(2026, 10, 21, 10, 0); // 21-nov-2026, hora local

describe('puedeCerrarFormalmente', () => {
  it('ofrece el cierre de un evento cerrado sin memoria', () => {
    expect(puedeCerrarFormalmente({ estado: 'cerrado', fechaFin: '2026-10-03' }, HOY)).toBe(true);
  });

  it('ofrece el cierre de un evento en ejecución en su último día o después', () => {
    expect(puedeCerrarFormalmente({ estado: 'en_ejecucion', fechaFin: '2026-11-21' }, HOY)).toBe(true);
    expect(puedeCerrarFormalmente({ estado: 'habilitado', fechaFin: '2026-11-20' }, HOY)).toBe(true);
  });

  it('no lo ofrece antes del último día, en configuración ni si ya está en la memoria', () => {
    expect(puedeCerrarFormalmente({ estado: 'en_ejecucion', fechaFin: '2026-11-22' }, HOY)).toBe(false);
    expect(puedeCerrarFormalmente({ estado: 'en_configuracion', fechaFin: '2026-01-01' }, HOY)).toBe(false);
    expect(puedeCerrarFormalmente({ estado: 'cerrado', fechaFin: '2026-10-03', archivado: true }, HOY)).toBe(false);
    expect(puedeCerrarFormalmente(null, HOY)).toBe(false);
  });

  it('usa la fecha local, no la UTC', () => {
    expect(fechaLocalIso(new Date(2026, 10, 21, 23, 30))).toBe('2026-11-21');
  });
});

describe('permisos', () => {
  it('la eliminación exige el permiso especial; ser administrador no basta', () => {
    expect(puedeEliminarConAutorizacion({ rol: 'ADMIN', permisos: [] })).toBe(false);
    expect(puedeEliminarConAutorizacion({ permisos: ['MEMORIA_HISTORICA_ELIMINAR'] })).toBe(true);
  });

  it('ven la memoria el administrador y quien tiene permiso de memoria o reportes', () => {
    expect(veMemoriaHistorica({ rol: 'ADMIN' })).toBe(true);
    expect(veMemoriaHistorica({ roles: ['ORGANIZADOR'], permisos: ['MEMORIA_HISTORICA_GESTIONAR'] })).toBe(true);
    expect(veMemoriaHistorica({ roles: ['ANALISTA'], permisos: ['REPORTES_VER'] })).toBe(true);
    expect(veMemoriaHistorica({ roles: ['PARTICIPANTE'], permisos: ['EVENTOS_VER'] })).toBe(false);
    expect(veMemoriaHistorica({ rol: 'ADMIN', modoIngreso: 'ASISTENTE' })).toBe(false);
  });
});

describe('interpretarErrorMemoria', () => {
  it('conserva el mensaje del backend y la lista de pendientes', () => {
    const pendientes = [{ codigo: 'EVALUACIONES_SIN_FINALIZAR', cantidad: 2, descripcion: 'Evaluaciones' }];
    const info = interpretarErrorMemoria({
      response: { status: 409, data: { codigo: 'CIERRE_CON_PENDIENTES', message: 'Tiene pendientes', pendientes } },
    });
    expect(info.titulo).toBe('El evento tiene procesos pendientes');
    expect(info.mensaje).toBe('Tiene pendientes');
    expect(info.pendientes).toEqual(pendientes);
  });

  it('EVENTO_ARCHIVADO muestra el motivo del backend', () => {
    const info = interpretarErrorMemoria({ response: { status: 409, data: { codigo: 'EVENTO_ARCHIVADO', message: 'Solo consulta' } } });
    expect(info.titulo).toBe('El evento está en la memoria histórica');
    expect(info.mensaje).toBe('Solo consulta');
  });

  it('403, sin conexión y 500 sin mensaje', () => {
    expect(interpretarErrorMemoria({ response: { status: 403, data: { message: 'Forbidden' } } }).mensaje).toBe(
      'Tu usuario no tiene permiso para esta acción.'
    );
    expect(interpretarErrorMemoria({ request: {} }).mensaje).toMatch(/conectarse con el servidor/);
    expect(interpretarErrorMemoria({ response: { status: 502, data: '<html>' } }).mensaje).toMatch(/servidor tuvo un problema/);
    expect(interpretarErrorMemoria({ response: { status: 500 } }).pendientes).toEqual([]);
  });
});

describe('parsearContenido', () => {
  it('acepta texto JSON y completa las secciones que faltan', () => {
    const c = parsearContenido('{"evento":{"nombre":"Congreso"},"agenda":{"actividades":[{"id":1}]}}');
    expect(c.evento.nombre).toBe('Congreso');
    expect(c.agenda.actividades).toHaveLength(1);
    expect(c.agenda.diasPublicados).toEqual([]);
    expect(c.convocatorias).toEqual([]);
    expect(c.presupuesto.rubros).toEqual([]);
    expect(c.asistencia.registros).toBe(0);
  });

  it('no falla con JSON inválido ni con valores vacíos', () => {
    expect(parsearContenido('{roto').participantes).toEqual([]);
    expect(parsearContenido(null).evento).toEqual({});
    expect(parsearContenido([1, 2]).encuestas).toEqual([]);
  });

  it('lee los certificados con detalle y el formato anterior (solo conteo por tipo)', () => {
    const nuevo = parsearContenido({ certificados: { porTipo: { asistente: 1 }, detalle: [{ id: 1 }] } });
    expect(nuevo.certificados.detalle).toHaveLength(1);
    expect(nuevo.certificados.porTipo).toEqual({ asistente: 1 });
    const anterior = parsearContenido({ certificados: { asistente: 3 } });
    expect(anterior.certificados.porTipo).toEqual({ asistente: 3 });
    expect(anterior.certificados.detalle).toEqual([]);
  });
});

describe('indicadores', () => {
  const indicadores = [
    { codigo: 'PRESUPUESTO_EJECUTADO', nombre: 'Ejecutado', valor: 16230000, unidad: 'COP' },
    { codigo: 'TASA_ASISTENCIA', nombre: 'Tasa', valor: 81.72, unidad: '%' },
    { codigo: 'INSCRITOS', nombre: 'Inscritos', valor: 186, unidad: 'personas' },
  ];

  it('formatea porcentajes, pesos y cantidades', () => {
    expect(formatearValorIndicador(indicadores[1])).toBe('81,7 %');
    expect(formatearValorIndicador(indicadores[0])).toBe('$ 16.230.000');
    expect(formatearValorIndicador(indicadores[2])).toBe('186');
    expect(formatearValorIndicador({ valor: null })).toBe('—');
    expect(formatearPesos(undefined)).toBe('—');
  });

  it('ordena los destacados y omite los que no son destacados', () => {
    expect(indicadoresDestacados(indicadores).map((i) => i.codigo)).toEqual(['INSCRITOS', 'TASA_ASISTENCIA']);
    expect(valorIndicador(indicadores, 'INSCRITOS')).toBe(186);
    expect(valorIndicador(indicadores, 'NO_EXISTE')).toBeNull();
  });
});

describe('agenda, propuestas y semestres', () => {
  it('agrupa las actividades por fecha y deja al final las que no tienen fecha', () => {
    const grupos = agruparActividadesPorFecha([
      { id: 1, fecha: '2026-10-02' },
      { id: 2, fecha: null },
      { id: 3, fecha: '2026-10-01' },
      { id: 4, fecha: '2026-10-02' },
    ]);
    expect(grupos.map((g) => g.fecha)).toEqual(['2026-10-01', '2026-10-02', null]);
    expect(grupos[1].actividades.map((a) => a.id)).toEqual([1, 4]);
  });

  it('une las propuestas de todas las convocatorias con su convocatoria', () => {
    const lista = propuestasDeConvocatorias([
      { titulo: 'A', propuestas: [{ id: 1 }] },
      { titulo: 'B', propuestas: [{ id: 2 }, { id: 3 }] },
      { titulo: 'C' },
    ]);
    expect(lista.map((p) => `${p.convocatoria}-${p.id}`)).toEqual(['A-1', 'B-2', 'B-3']);
  });

  it('semestres únicos del más reciente al más antiguo', () => {
    expect(semestresDisponibles([{ semestre: '2025-2' }, { semestre: '2026-2' }, { semestre: '2025-2' }, {}])).toEqual([
      '2026-2',
      '2025-2',
    ]);
  });
});

describe('formularios', () => {
  it('el cierre con pendientes exige confirmación y limita el resumen', () => {
    const pendientes = [{ codigo: 'X', cantidad: 1 }];
    expect(validarCierre({ confirmarPendientes: false, resumen: '' }, pendientes).confirmarPendientes).toBeTruthy();
    expect(validarCierre({ confirmarPendientes: true, resumen: '' }, pendientes)).toEqual({});
    expect(validarCierre({ confirmarPendientes: false, resumen: '' }, [])).toEqual({});
    expect(validarCierre({ resumen: 'x'.repeat(4001) }, []).resumen).toBeTruthy();
  });

  it('arma el cuerpo del cierre sin resumen vacío', () => {
    expect(aCierreRequest({ confirmarPendientes: true, resumen: '  ' })).toEqual({ confirmarPendientes: true, resumen: null });
    expect(aCierreRequest({ resumen: ' Acta ' })).toEqual({ confirmarPendientes: false, resumen: 'Acta' });
  });

  it('la eliminación exige el nombre exacto y un motivo de 20 a 1000 caracteres', () => {
    const nombre = 'Congreso 2025';
    expect(validarEliminacion({ nombreEvento: '', motivo: '' }, nombre)).toHaveProperty('nombreEvento');
    expect(validarEliminacion({ nombreEvento: 'congreso 2025', motivo: 'x'.repeat(20) }, nombre).nombreEvento).toMatch(/no coincide/);
    expect(validarEliminacion({ nombreEvento: ' Congreso 2025 ', motivo: 'corto' }, nombre).motivo).toMatch(/al menos 20/);
    expect(validarEliminacion({ nombreEvento: 'Congreso 2025', motivo: 'x'.repeat(1001) }, nombre).motivo).toMatch(/1000/);
    expect(validarEliminacion({ nombreEvento: 'Congreso 2025', motivo: 'Evento de prueba creado por error' }, nombre)).toEqual({});
  });
});
