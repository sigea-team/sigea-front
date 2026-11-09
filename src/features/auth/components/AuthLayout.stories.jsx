import React from 'react';
import AuthLayout from './AuthLayout';

export default {
  title: 'Features/Auth/AuthLayout',
  component: AuthLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    children: (
      <div className="bg-white rounded-[16px] border border-border p-8 shadow-sm">
        <h2 className="font-serif-title text-2xl text-ink-900 mb-4">Contenido de Autenticación</h2>
        <p className="text-sm text-ink-600">Vista previa del AuthLayout.</p>
      </div>
    ),
  },
};
