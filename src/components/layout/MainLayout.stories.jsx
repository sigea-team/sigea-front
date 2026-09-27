import React from 'react';
import MainLayout from './MainLayout';

export default {
  title: 'Layout/MainLayout',
  component: MainLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    children: (
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 shadow-sm">
        <h2 className="font-serif-title text-2xl text-[#1f2023] mb-4">Contenido del Layout</h2>
        <p className="text-sm text-[#5b5f66] leading-relaxed">
          Este es el área principal de contenido del MainLayout. A la izquierda se muestra el panel institucional rojo SIGEA / UFPS en pantallas medianas y grandes (≥ 980px).
        </p>
      </div>
    ),
  },
};

export const FormPlaceholder = {
  args: {
    children: (
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 shadow-sm space-y-4">
        <h2 className="font-serif-title text-2xl text-[#1f2023]">Vista de Prueba</h2>
        <p className="text-sm text-[#5b5f66]">Muestra de contenedor interno de formulario.</p>
        <div className="h-32 bg-[#f7f7f8] rounded-[8px] border border-dashed border-[#d8dadf] flex items-center justify-center text-sm text-[#9ca0a6]">
          Área de Formulario o Tablas
        </div>
      </div>
    ),
  },
};
