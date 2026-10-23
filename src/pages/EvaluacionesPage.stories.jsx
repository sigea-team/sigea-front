import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import EvaluacionesPage from './EvaluacionesPage';

export default {
  title: 'Pages/EvaluacionesPage',
  component: EvaluacionesPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => (
    <MemoryRouter initialEntries={['/evaluaciones']}>
      <EvaluacionesPage />
    </MemoryRouter>
  ),
};
