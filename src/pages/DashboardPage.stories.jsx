import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

const mockEventos = [
  { id: 1, nombre: 'Congreso Internacional de Computación 2026', fechaInicio: '2026-11-20', fechaFin: '2026-11-23', modalidad: 'hibrida', estado: 'habilitado' },
  { id: 2, nombre: 'Semana de la Ingeniería de Sistemas', fechaInicio: '2026-12-01', fechaFin: '2026-12-05', modalidad: 'presencial', estado: 'en_configuracion' },
];

const mockConvocatorias = [
  { id: 1, titulo: 'Convocatoria de Ponencias Científicas 2026', eventoNombre: 'Congreso Internacional 2026', fechaFin: '2026-11-15', estado: 'PUBLICADA' },
  { id: 2, titulo: 'Recepción de Posters y Posters Académicos', eventoNombre: 'Semana de la Ingeniería', fechaFin: '2026-11-28', estado: 'BORRADOR' },
];

const mockApiEventos = {
  listarEventos: async () => mockEventos,
};

const mockApiConvocatorias = {
  listarConvocatorias: async () => mockConvocatorias,
};

const mockApiPropuestas = {
  listarMisPropuestas: async () => [{ id: 1, titulo: 'Modelo de Deep Learning para Detección' }],
};

export default {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage
        apiEventos={mockApiEventos}
        apiConvocatorias={mockApiConvocatorias}
        apiPropuestas={mockApiPropuestas}
      />
    </MemoryRouter>
  ),
};
