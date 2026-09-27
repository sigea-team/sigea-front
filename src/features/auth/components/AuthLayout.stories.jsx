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
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 shadow-sm">
        <h2 className="font-serif-title text-2xl text-[#1f2023] mb-4">Contenido de Autenticación</h2>
        <p className="text-sm text-[#5b5f66]">Vista previa del AuthLayout.</p>
      </div>
    ),
  },
};
