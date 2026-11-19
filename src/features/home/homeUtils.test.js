import { describe, expect, it } from 'vitest';
import {
  normalizarModalidad,
  formatearFecha,
  formatearRangoFechas,
  calcularEstadoEvento,
  combinarEventosConConvocatorias,
  filtrarEventos,
  EVENTOS_BASE_INSTITUCIONALES,
} from './homeUtils';

describe('homeUtils', () => {
  describe('normalizarModalidad', () => {
    it('normaliza modalidades correctamente', () => {
      expect(normalizarModalidad('virtual')).toBe('Virtual');
      expect(normalizarModalidad('hibrida')).toBe('Híbrida');
      expect(normalizarModalidad('híbrida')).toBe('Híbrida');
      expect(normalizarModalidad('presencial')).toBe('Presencial');
      expect(normalizarModalidad('')).toBe('Presencial');
      expect(normalizarModalidad(null)).toBe('Presencial');
    });
  });

  describe('formatearFecha y formatearRangoFechas', () => {
    it('formatea fechas simples', () => {
      expect(formatearFecha('2026-11-08')).toContain('2026');
      expect(formatearFecha(null)).toBe('Fecha por definir');
    });

    it('formatea rangos de fechas adecuadamente', () => {
      const rango = formatearRangoFechas('2026-11-08', '2026-12-08');
      expect(rango).toContain('—');
      expect(formatearRangoFechas(null, null)).toBe('Fechas por confirmar');
      expect(formatearRangoFechas('2026-11-08', null)).toContain('Desde el');
      expect(formatearRangoFechas(null, '2026-12-08')).toContain('Hasta el');
    });
  });

  describe('calcularEstadoEvento', () => {
    it('detecta evento finalizado si la fecha fin ya pasó', () => {
      expect(calcularEstadoEvento('2020-01-01', '2020-01-10')).toBe('finalizado');
    });

    it('detecta evento proximo si la fecha de inicio es futura', () => {
      expect(calcularEstadoEvento('2099-01-01', '2099-01-10')).toBe('proximo');
    });
  });

  describe('combinarEventosConConvocatorias', () => {
    it('retorna arreglo vacío si no hay eventos ni convocatorias (evita cargar datos falsos)', () => {
      expect(combinarEventosConConvocatorias()).toEqual([]);
      expect(combinarEventosConConvocatorias([], [])).toEqual([]);
    });

    it('combina eventos reales del backend e inyecta convocatorias correspondientes', () => {
      const eventosReales = [
        { id: 5, nombre: 'Congreso Real 2026', modalidad: 'presencial', fechaInicio: '2026-11-20', fechaFin: '2026-11-22' },
      ];
      const convs = [
        { id: 10, eventoId: 5, eventoNombre: 'Congreso Real 2026', titulo: 'Call for Papers' },
      ];
      const resultado = combinarEventosConConvocatorias(eventosReales, convs);
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombre).toBe('Congreso Real 2026');
      expect(resultado[0].convocatorias).toHaveLength(1);
      expect(resultado[0].convocatorias[0].id).toBe(10);
    });

    it('combina eventos base e inyecta convocatorias correspondientes', () => {
      const convs = [
        { id: 10, eventoId: 1, eventoNombre: 'Hackathon', titulo: 'Convocatoria Hack' },
        { id: 11, eventoId: 99, eventoNombre: 'Evento Nuevo Extra', titulo: 'Convocatoria Extra' },
      ];
      const resultado = combinarEventosConConvocatorias(EVENTOS_BASE_INSTITUCIONALES, convs);
      
      const ev1 = resultado.find((e) => e.id === 1);
      expect(ev1).toBeDefined();
      expect(ev1.convocatorias).toHaveLength(1);
      expect(ev1.convocatorias[0].id).toBe(10);

      const ev99 = resultado.find((e) => e.id === 99);
      expect(ev99).toBeDefined();
      expect(ev99.nombre).toBe('Evento Nuevo Extra');
    });
  });

  describe('filtrarEventos', () => {
    const eventos = [
      { id: 1, nombre: 'Hackathon UFPS', modalidad: 'presencial', estadoCalculado: 'en_curso', temasClave: ['IA'] },
      { id: 2, nombre: 'JIS 2026', modalidad: 'hibrida', estadoCalculado: 'proximo', temasClave: ['Software'] },
      { id: 3, nombre: 'Simposio IA', modalidad: 'virtual', estadoCalculado: 'finalizado', temasClave: ['Datos'] },
    ];

    it('filtra por búsqueda textual', () => {
      const res = filtrarEventos(eventos, { busqueda: 'hackathon' });
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(1);
    });

    it('filtra por modalidad', () => {
      const res = filtrarEventos(eventos, { modalidad: 'virtual' });
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe(3);
    });

    it('filtra por estado', () => {
      const resActivos = filtrarEventos(eventos, { estado: 'activos' });
      expect(resActivos.some((e) => e.id === 3)).toBe(false);

      const resFinalizados = filtrarEventos(eventos, { estado: 'finalizados' });
      expect(resFinalizados).toHaveLength(1);
      expect(resFinalizados[0].id).toBe(3);
    });
  });
});
