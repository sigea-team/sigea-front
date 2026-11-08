import React from 'react';
import AsignarSalaEventoModal from './AsignarSalaEventoModal';

export default {
  title: 'Features/Salas/AsignarSalaEventoModal',
  component: AsignarSalaEventoModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

const mockSalas = [
  { id: 1, nombre: 'Auditorio Mayor', tipo: 'fisica', ubicacion: 'Edificio A', aforoMaximo: 250, disponibilidad: [] },
  { id: 2, nombre: 'Sala Virtual Zoom 1', tipo: 'virtual', ubicacion: 'https://zoom.us/j/12345', aforoMaximo: 500, disponibilidad: [] },
];

const mockEventos = [
  { id: 10, nombre: 'Congreso Internacional de Computación 2026' },
  { id: 11, nombre: 'Semana de la Ingeniería 2026' },
];

export const Default = {
  args: {
    isOpen: true,
    salasDisponibles: mockSalas,
    eventos: mockEventos,
    eventoActualId: '10',
    onClose: () => {},
    onAsignar: () => {},
  },
};
