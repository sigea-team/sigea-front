import { describe, expect, it } from 'vitest';
import {
  formatearFranja,
  formatearHora,
  validarFranjaDisponibilidad,
  validarSala,
  verificarConflictoAforo,
  verificarConflictoProgramacionActividad,
  verificarConflictosCambioDisponibilidad,
} from './salaUtils';

describe('salaUtils - HU-20 Crear y configurar salas', () => {
  const salasMuestra = [
    { id: 1, eventoId: 10, nombre: 'Auditorio Mayor Eustorgio Gómez', tipo: 'fisica', aforoMaximo: 250 },
    { id: 2, eventoId: 10, nombre: 'Sala Virtual Zoom 1', tipo: 'virtual', aforoMaximo: 500 },
  ];

  describe('Criterio 1: Registro y estructura básica de salas', () => {
    it('acepta una sala válida con todos los campos correctos', () => {
      const form = {
        nombre: 'Laboratorio de Software 301',
        ubicacion: 'Edificio Cread, 3er piso',
        tipo: 'fisica',
        aforoMaximo: 40,
      };
      const errores = validarSala(form, salasMuestra);
      expect(Object.keys(errores)).toHaveLength(0);
    });

    it('formatea horas y franjas correctamente', () => {
      expect(formatearHora('08:30')).toBe('08:30 a. m.');
      expect(formatearHora('14:00')).toBe('02:00 p. m.');
      expect(
        formatearFranja({ fecha: '2026-10-21', horaInicio: '08:00', horaFin: '12:00' })
      ).toBe('2026-10-21 (08:00 a. m. – 12:00 p. m.)');
    });
  });

  describe('Criterio 2: Rangos de disponibilidad horaria', () => {
    it('valida una franja horaria correcta', () => {
      const franja = { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '12:00' };
      const errores = validarFranjaDisponibilidad(franja, []);
      expect(Object.keys(errores)).toHaveLength(0);
    });

    it('rechaza una franja si la hora de fin es menor o igual a la hora de inicio', () => {
      const franja = { fecha: '2026-10-21', horaInicio: '14:00', horaFin: '12:00' };
      const errores = validarFranjaDisponibilidad(franja, []);
      expect(errores.horaFin).toBe('La hora de fin debe ser posterior a la hora de inicio.');
    });

    it('detecta solapamiento de franjas horarias en la misma fecha', () => {
      const existentes = [{ id: 101, fecha: '2026-10-21', horaInicio: '08:00', horaFin: '12:00' }];
      const nueva = { fecha: '2026-10-21', horaInicio: '10:00', horaFin: '14:00' };
      const errores = validarFranjaDisponibilidad(nueva, existentes);
      expect(errores.general).toContain('se cruza con otra');
    });
  });

  describe('Criterio 3: Rechazo por duplicidad de nombre o aforo inválido', () => {
    it('rechaza una sala con nombre ya existente en el evento (ignorando mayúsculas y espacios)', () => {
      const form = {
        nombre: '  auditorio mayor eustorgio gómez  ',
        ubicacion: 'Cualquier sitio',
        tipo: 'fisica',
        aforoMaximo: 100,
      };
      const errores = validarSala(form, salasMuestra);
      expect(errores.nombre).toContain('Ya existe una sala llamada');
    });

    it('permite guardar con el mismo nombre si se está editando la misma sala', () => {
      const form = {
        nombre: 'Auditorio Mayor Eustorgio Gómez',
        ubicacion: 'Nueva ubicación',
        tipo: 'fisica',
        aforoMaximo: 300,
      };
      const errores = validarSala(form, salasMuestra, 1);
      expect(errores.nombre).toBeUndefined();
    });

    it('rechaza aforo en cero', () => {
      const form = {
        nombre: 'Sala Nueva',
        tipo: 'fisica',
        aforoMaximo: 0,
      };
      const errores = validarSala(form, salasMuestra);
      expect(errores.aforoMaximo).toBe('El aforo máximo debe ser un número entero mayor a cero.');
    });

    it('rechaza aforo negativo o no entero', () => {
      const formNegativo = { nombre: 'Sala A', tipo: 'fisica', aforoMaximo: -15 };
      expect(validarSala(formNegativo, salasMuestra).aforoMaximo).toBe(
        'El aforo máximo debe ser un número entero mayor a cero.'
      );

      const formDecimal = { nombre: 'Sala B', tipo: 'fisica', aforoMaximo: 25.5 };
      expect(validarSala(formDecimal, salasMuestra).aforoMaximo).toBe(
        'El aforo máximo debe ser un número entero mayor a cero.'
      );
    });
  });

  describe('Criterio 4: Advertencias de conflicto antes de aplicar operaciones', () => {
    it('advierte cuando se reduce el aforo de una sala que ya supera inscripciones activas', () => {
      const actividadesEnSala = [
        { id: 501, nombre: 'Conferencia Inaugural', inscripcionesActivas: 85 },
        { id: 502, nombre: 'Taller de Ciberseguridad', inscripcionesActivas: 30 },
      ];

      // Reducir aforo a 50 (superado por Conferencia Inaugural con 85)
      const resultado = verificarConflictoAforo(50, actividadesEnSala);
      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.maxInscripciones).toBe(85);
      expect(resultado.actividadesAfectadas).toHaveLength(1);
      expect(resultado.actividadesAfectadas[0].nombre).toBe('Conferencia Inaugural');
    });

    it('no genera conflicto de aforo si el nuevo aforo cubre todas las inscripciones', () => {
      const actividadesEnSala = [{ id: 501, nombre: 'Taller', inscripcionesActivas: 40 }];
      const resultado = verificarConflictoAforo(60, actividadesEnSala);
      expect(resultado.hayConflicto).toBe(false);
      expect(resultado.actividadesAfectadas).toHaveLength(0);
    });

    it('advierte cuando se intenta programar una actividad fuera del horario disponible de la sala', () => {
      const franjasSala = [
        { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '12:00' },
      ];
      const actividadFuera = {
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
      };

      const resultado = verificarConflictoProgramacionActividad(actividadFuera, franjasSala);
      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictoSala).toBe(true);
      expect(resultado.motivos[0]).toContain('está fuera de la disponibilidad');
    });

    it('advierte cuando se programa actividad fuera del horario del ponente', () => {
      const franjasSala = [{ fecha: '2026-10-21', horaInicio: '08:00', horaFin: '18:00' }];
      const franjasPonente = [{ fecha: '2026-10-21', horaInicio: '08:00', horaFin: '11:00' }];
      const actividad = { fecha: '2026-10-21', horaInicio: '14:00', horaFin: '16:00' };

      const resultado = verificarConflictoProgramacionActividad(actividad, franjasSala, franjasPonente);
      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictoPonente).toBe(true);
      expect(resultado.motivos[0]).toContain('ponente asignado no tiene disponibilidad');
    });

    it('permite programar si la actividad está completamente dentro del horario disponible', () => {
      const franjasSala = [{ fecha: '2026-10-21', horaInicio: '08:00', horaFin: '18:00' }];
      const franjasPonente = [{ fecha: '2026-10-21', horaInicio: '09:00', horaFin: '13:00' }];
      const actividad = { fecha: '2026-10-21', horaInicio: '10:00', horaFin: '11:30' };

      const resultado = verificarConflictoProgramacionActividad(actividad, franjasSala, franjasPonente);
      expect(resultado.hayConflicto).toBe(false);
      expect(resultado.motivos).toHaveLength(0);
    });
  });

  describe('Criterio 5: Detección de conflictos al actualizar disponibilidad', () => {
    it('detecta actividades programadas que quedan en conflicto al recortar o eliminar disponibilidad', () => {
      const actividadesProgramadas = [
        { id: 1, nombre: 'Ponencia Magistral', fecha: '2026-10-21', horaInicio: '10:00', horaFin: '12:00' },
        { id: 2, nombre: 'Sesión de Pósteres', fecha: '2026-10-21', horaInicio: '15:00', horaFin: '17:00' },
      ];

      // La nueva disponibilidad solo cubre la mañana (08:00 a 13:00); Sesión de Pósteres queda en conflicto
      const nuevasFranjas = [{ fecha: '2026-10-21', horaInicio: '08:00', horaFin: '13:00' }];

      const resultado = verificarConflictosCambioDisponibilidad(nuevasFranjas, actividadesProgramadas);
      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.actividadesEnConflicto).toHaveLength(1);
      expect(resultado.actividadesEnConflicto[0].nombre).toBe('Sesión de Pósteres');
    });

    it('no genera conflicto si todas las actividades quedan cubiertas por las nuevas franjas', () => {
      const actividadesProgramadas = [
        { id: 1, nombre: 'Charla A', fecha: '2026-10-21', horaInicio: '09:00', horaFin: '11:00' },
      ];
      const nuevasFranjas = [
        { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '14:00' },
        { fecha: '2026-10-22', horaInicio: '08:00', horaFin: '12:00' },
      ];

      const resultado = verificarConflictosCambioDisponibilidad(nuevasFranjas, actividadesProgramadas);
      expect(resultado.hayConflicto).toBe(false);
      expect(resultado.actividadesEnConflicto).toHaveLength(0);
    });
  });
});
