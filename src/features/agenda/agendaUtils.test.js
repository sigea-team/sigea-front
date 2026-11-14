import { describe, it, expect } from 'vitest';
import {
  validarActividad,
  detectarConflictosActividad,
  ordenarCronologicamente,
  agruparPorFecha,
  nombrePonente,
} from './agendaUtils';

describe('HU-21: Utilidades y lógica de negocio de la Agenda de Actividades', () => {
  const salasMock = [
    {
      id: 1,
      nombre: 'Auditorio Central',
      tipo: 'fisica',
      aforoMaximo: 200,
      disponibilidad: [
        { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '18:00' },
        { fecha: '2026-10-22', horaInicio: '08:00', horaFin: '18:00' },
      ],
    },
    {
      id: 2,
      nombre: 'Laboratorio de Computación 1',
      tipo: 'fisica',
      aforoMaximo: 40,
      disponibilidad: [
        { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '18:00' },
      ],
    },
  ];

  const ponentesMock = [
    {
      personaId: 10,
      nombres: 'Dra. María',
      apellidos: 'Gómez',
      disponibilidad: [
        { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '18:00' },
      ],
    },
    {
      personaId: 20,
      nombres: 'Ing. Carlos',
      apellidos: 'Rodríguez',
      disponibilidad: [
        { fecha: '2026-10-21', horaInicio: '08:00', horaFin: '18:00' },
      ],
    },
  ];

  describe('Criterio 1: Ubicación y orden cronológico en la agenda', () => {
    it('ordena las actividades por fecha, luego hora de inicio y luego hora de fin', () => {
      const desordenadas = [
        { id: 1, nombre: 'Clausura', fecha: '2026-10-22', horaInicio: '16:00', horaFin: '18:00' },
        { id: 2, nombre: 'Apertura', fecha: '2026-10-21', horaInicio: '08:00', horaFin: '09:00' },
        { id: 3, nombre: 'Taller Mañana', fecha: '2026-10-21', horaInicio: '10:00', horaFin: '12:00' },
        { id: 4, nombre: 'Conferencia Principal', fecha: '2026-10-21', horaInicio: '09:00', horaFin: '10:00' },
        { id: 5, nombre: 'Ponencias Paralelas B', fecha: '2026-10-21', horaInicio: '10:00', horaFin: '13:00' },
      ];

      const ordenadas = ordenarCronologicamente(desordenadas);

      expect(ordenadas.map((a) => a.nombre)).toEqual([
        'Apertura',
        'Conferencia Principal',
        'Taller Mañana',
        'Ponencias Paralelas B',
        'Clausura',
      ]);
    });

    it('agrupa las actividades cronológicamente por fecha para el cronograma diario', () => {
      const actividades = [
        { id: 1, nombre: 'A', fecha: '2026-10-21', horaInicio: '09:00', horaFin: '10:00' },
        { id: 2, nombre: 'B', fecha: '2026-10-22', horaInicio: '08:00', horaFin: '09:00' },
        { id: 3, nombre: 'C', fecha: '2026-10-21', horaInicio: '10:00', horaFin: '11:00' },
      ];

      const grupos = agruparPorFecha(actividades);
      expect(grupos).toHaveLength(2);
      expect(grupos[0].fecha).toBe('2026-10-21');
      expect(grupos[0].actividades.map((a) => a.nombre)).toEqual(['A', 'C']);
      expect(grupos[1].fecha).toBe('2026-10-22');
      expect(grupos[1].actividades.map((a) => a.nombre)).toEqual(['B']);
    });
  });

  describe('Criterio 2: Detección y notificación de conflictos de horario, sala y ponente', () => {
    const agendaExistente = [
      {
        id: 100,
        nombre: 'Conferencia Inaugural',
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '11:00',
        salaId: 1,
        ponenteId: 10,
        permiteSimultaneidad: false,
      },
    ];

    it('detecta conflicto cuando se intenta programar en la misma sala en horario solapado', () => {
      const nuevaActividad = {
        nombre: 'Reunión General',
        fecha: '2026-10-21',
        horaInicio: '10:00',
        horaFin: '12:00',
        salaId: 1, // Misma sala 1
        ponenteId: 20, // Distinto ponente
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(nuevaActividad, agendaExistente, {
        salas: salasMock,
        ponentes: ponentesMock,
      });

      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictosSala).toHaveLength(1);
      expect(resultado.conflictosSala[0].mensaje).toContain('Auditorio Central');
      // Igual que el backend: en la misma sala el cruce se informa una sola vez, como conflicto de sala
      expect(resultado.conflictosHorario).toHaveLength(0);
      expect(resultado.hayCruces).toBe(true);
    });

    it('detecta conflicto cuando se intenta programar al mismo ponente en horario solapado', () => {
      const nuevaActividad = {
        nombre: 'Mesa Redonda',
        fecha: '2026-10-21',
        horaInicio: '09:30',
        horaFin: '10:30',
        salaId: 2, // Distinta sala
        ponenteId: 10, // Mismo ponente (Dra. María Gómez)
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(nuevaActividad, agendaExistente, {
        salas: salasMock,
        ponentes: ponentesMock,
      });

      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictosPonente).toHaveLength(1);
      expect(resultado.conflictosPonente[0].mensaje).toContain('María Gómez');
    });

    it('detecta cruce de horario general cuando no se ha marcado como simultánea', () => {
      const nuevaActividad = {
        nombre: 'Taller Sin Simultaneidad',
        fecha: '2026-10-21',
        horaInicio: '10:30',
        horaFin: '11:30',
        salaId: 2,
        ponenteId: 20,
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(nuevaActividad, agendaExistente, {
        salas: salasMock,
        ponentes: ponentesMock,
      });

      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictosHorario).toHaveLength(1);
      expect(resultado.conflictosHorario[0].mensaje).toContain('Conferencia Inaugural');
    });

    it('no detecta conflicto si los horarios no se solapan', () => {
      const nuevaActividad = {
        nombre: 'Actividad de la Tarde',
        fecha: '2026-10-21',
        horaInicio: '11:00', // Justo cuando termina la inaugural
        horaFin: '13:00',
        salaId: 1,
        ponenteId: 10,
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(nuevaActividad, agendaExistente, {
        salas: salasMock,
        ponentes: ponentesMock,
      });

      expect(resultado.hayConflicto).toBe(false);
      expect(resultado.motivos).toHaveLength(0);
    });
  });

  describe('Criterio 3: Actividades simultáneas intencionales (talleres paralelos)', () => {
    const agendaConSimultanea = [
      {
        id: 201,
        nombre: 'Taller Paralelo A: Robótica',
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
        salaId: 1, // Auditorio Central
        ponenteId: 10,
        permiteSimultaneidad: true,
      },
    ];

    it('permite dos actividades en el mismo horario sin alerta de horario si ambas son simultáneas en distintas salas y con distintos ponentes', () => {
      const tallerB = {
        nombre: 'Taller Paralelo B: Inteligencia Artificial',
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
        salaId: 2, // Laboratorio 1 (distinta sala)
        ponenteId: 20, // Distinto ponente
        permiteSimultaneidad: true,
      };

      const resultado = detectarConflictosActividad(tallerB, agendaConSimultanea, {
        salas: salasMock,
        ponentes: ponentesMock,
      });

      expect(resultado.hayConflicto).toBe(false);
      expect(resultado.conflictosHorario).toHaveLength(0);
      expect(resultado.conflictosSala).toHaveLength(0);
    });

    it('alerta de conflicto de sala si dos actividades simultáneas intentan usar la misma sala', () => {
      const tallerMismaSala = {
        nombre: 'Taller Paralelo C: Intenta compartir sala',
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
        salaId: 1, // ¡Misma sala 1!
        ponenteId: 20,
        permiteSimultaneidad: true,
      };

      const resultado = detectarConflictosActividad(tallerMismaSala, agendaConSimultanea, {
        salas: salasMock,
        ponentes: ponentesMock,
      });

      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictosSala).toHaveLength(1);
      expect(resultado.conflictosSala[0].mensaje).toContain('Auditorio Central');
      // No debe haber conflicto de horario puro gracias a la simultaneidad
      expect(resultado.conflictosHorario).toHaveLength(0);
    });

    it('alerta de conflicto de ponente si dos actividades simultáneas intentan asignar al mismo ponente', () => {
      const tallerMismoPonente = {
        nombre: 'Taller Paralelo D: Mismo Ponente',
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
        salaId: 2,
        ponenteId: 10, // ¡Mismo ponente que el Taller A!
        permiteSimultaneidad: true,
      };

      const resultado = detectarConflictosActividad(tallerMismoPonente, agendaConSimultanea, {
        salas: salasMock,
        ponentes: ponentesMock,
      });

      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictosPonente).toHaveLength(1);
      expect(resultado.conflictosPonente[0].mensaje).toContain('María Gómez');
    });

    it('permite compartir sala si ambas son simultáneas y la sala admite simultaneidad', () => {
      const salasConSimultaneidad = salasMock.map((s) =>
        s.id === 1 ? { ...s, permiteSimultaneidad: true } : s
      );
      const tallerMismaSala = {
        nombre: 'Taller Paralelo C',
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
        salaId: 1,
        ponenteId: 20,
        permiteSimultaneidad: true,
      };

      const resultado = detectarConflictosActividad(tallerMismaSala, agendaConSimultanea, {
        salas: salasConSimultaneidad,
        ponentes: ponentesMock,
      });

      expect(resultado.conflictosSala).toHaveLength(0);
      expect(resultado.conflictosHorario).toHaveLength(0);
      expect(resultado.hayCruces).toBe(false);
    });

    it('aunque la sala admita simultaneidad, exige que ambas actividades estén marcadas como simultáneas', () => {
      const salasConSimultaneidad = salasMock.map((s) =>
        s.id === 1 ? { ...s, permiteSimultaneidad: true } : s
      );
      const noSimultanea = {
        nombre: 'Charla no paralela',
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
        salaId: 1,
        ponenteId: 20,
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(noSimultanea, agendaConSimultanea, {
        salas: salasConSimultaneidad,
        ponentes: ponentesMock,
      });

      expect(resultado.conflictosSala).toHaveLength(1);
      expect(resultado.hayCruces).toBe(true);
    });
  });

  describe('Actividades canceladas', () => {
    it('no cuenta como cruce una actividad cancelada', () => {
      const agenda = [
        {
          id: 300,
          nombre: 'Charla cancelada',
          fecha: '2026-10-21',
          horaInicio: '09:00',
          horaFin: '10:00',
          salaId: 1,
          ponenteId: 10,
          permiteSimultaneidad: false,
          estado: 'cancelada',
        },
      ];
      const nueva = {
        nombre: 'Charla de reemplazo',
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '10:00',
        salaId: 1,
        ponenteId: 10,
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(nueva, agenda, { salas: salasMock, ponentes: ponentesMock });

      expect(resultado.hayCruces).toBe(false);
      expect(resultado.motivos).toHaveLength(0);
    });
  });

  describe('Criterio 4: Rechazo y validación de campos obligatorios', () => {
    it('rechaza cuando faltan datos obligatorios: nombre, fecha, hora inicio, hora fin o sala', () => {
      const formVacio = {};
      const validacion = validarActividad(formVacio);

      expect(validacion.esValido).toBe(false);
      expect(validacion.errores.nombre).toBeDefined();
      expect(validacion.errores.fecha).toBeDefined();
      expect(validacion.errores.horaInicio).toBeDefined();
      expect(validacion.errores.horaFin).toBeDefined();
      expect(validacion.errores.salaId).toBeDefined();
    });

    it('rechaza cuando la hora de fin es anterior o igual a la hora de inicio', () => {
      const formHorarioInvalido = {
        nombre: 'Actividad Test',
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '13:00',
        salaId: '1',
      };

      const validacion = validarActividad(formHorarioInvalido);
      expect(validacion.esValido).toBe(false);
      expect(validacion.errores.horaFin).toContain('posterior a la hora de inicio');
    });

    it('acepta cuando todos los campos obligatorios están presentes y correctos', () => {
      const formCorrecto = {
        nombre: 'Conferencia Válida',
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '10:30',
        salaId: '1',
      };

      const validacion = validarActividad(formCorrecto);
      expect(validacion.esValido).toBe(true);
      expect(Object.keys(validacion.errores)).toHaveLength(0);
    });
  });

  describe('Criterio 5: Revalidación de conflictos al modificar horario, sala o ponente', () => {
    const agendaExistente = [
      {
        id: 301,
        nombre: 'Actividad que se va a editar',
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '10:00',
        salaId: 1,
        ponenteId: 10,
        permiteSimultaneidad: false,
      },
      {
        id: 302,
        nombre: 'Actividad Tarde',
        fecha: '2026-10-21',
        horaInicio: '15:00',
        horaFin: '17:00',
        salaId: 2,
        ponenteId: 20,
        permiteSimultaneidad: false,
      },
    ];

    it('al editar no genera conflicto consigo misma', () => {
      // Modificamos solo el nombre, conservando su propio horario y sala
      const actividadModificada = {
        id: 301,
        nombre: 'Nuevo nombre de actividad',
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '10:00',
        salaId: 1,
        ponenteId: 10,
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(actividadModificada, agendaExistente, {
        salas: salasMock,
        ponentes: ponentesMock,
        actividadIdExcluir: 301,
      });

      expect(resultado.hayConflicto).toBe(false);
    });

    it('revalida y detecta conflicto si se traslada el horario y sala al de otra actividad existente', () => {
      // Modificamos la actividad 301 para moverla a las 15:30 en sala 2 (choca con 302)
      const actividadModificada = {
        id: 301,
        nombre: 'Actividad movida a la tarde',
        fecha: '2026-10-21',
        horaInicio: '15:30',
        horaFin: '16:30',
        salaId: 2, // Sala de la actividad 302
        ponenteId: 10,
        permiteSimultaneidad: false,
      };

      const resultado = detectarConflictosActividad(actividadModificada, agendaExistente, {
        salas: salasMock,
        ponentes: ponentesMock,
        actividadIdExcluir: 301,
      });

      expect(resultado.hayConflicto).toBe(true);
      expect(resultado.conflictosSala).toHaveLength(1);
      expect(resultado.conflictosSala[0].actividadConflictiva.id).toBe(302);
      // Misma sala: un solo motivo (de sala), igual que el backend
      expect(resultado.conflictosHorario).toHaveLength(0);
    });
  });
});

describe('nombre visible del ponente', () => {
  it('usa nombreCompleto, que es lo que envía la API de conferencistas del evento', () => {
    expect(nombrePonente({ personaId: 5, nombreCompleto: 'Ana Autora' })).toBe('Ana Autora');
  });

  it('acepta nombres + apellidos o nombre, y solo como último recurso muestra el ID', () => {
    expect(nombrePonente({ nombres: 'María', apellidos: 'Gómez' })).toBe('María Gómez');
    expect(nombrePonente({ nombre: 'Luis Pérez' })).toBe('Luis Pérez');
    expect(nombrePonente({ personaId: 9 })).toBe('Ponente #9');
    expect(nombrePonente(null)).toBe('');
  });
});
