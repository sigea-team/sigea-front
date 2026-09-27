import React, { useState } from 'react';
import MainLayout from './MainLayout';
import Button from './Button';

export default {
  title: 'UI/MainLayout',
  component: MainLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: { control: 'text' },
    activeNav: {
      control: { type: 'select' },
      options: ['dashboard', 'convocatorias', 'eventos', 'certificados', 'configuracion'],
    },
    onLogout: { action: 'logged out' },
    onSelectNav: { action: 'selected nav' },
  },
};

export const Default = {
  args: {
    title: 'Dashboard Principal',
    activeNav: 'dashboard',
    usuario: {
      nombreCompleto: 'Carlos Andrés Gómez',
      rol: 'Organizador',
    },
    children: (
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e]">
            SIGEA — Panel General
          </span>
          <h2 className="font-serif-title text-2xl text-[#1f2023] mt-1">
            Bienvenido al Sistema de Gestión de Eventos
          </h2>
          <p className="text-sm text-[#5b5f66] mt-1">
            Resumen de actividad reciente, convocatorias abiertas e inscritos en eventos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-xs font-medium text-[#5b5f66]">Convocatorias Activas</p>
            <p className="font-serif-title text-3xl text-[#a6192e] mt-2">12</p>
          </div>
          <div className="p-5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-xs font-medium text-[#5b5f66]">Eventos Programados</p>
            <p className="font-serif-title text-3xl text-[#1f2023] mt-2">8</p>
          </div>
          <div className="p-5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-xs font-medium text-[#5b5f66]">Certificados Emitidos</p>
            <p className="font-serif-title text-3xl text-[#1f2023] mt-2">145</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline">Descargar Reporte</Button>
          <Button variant="primary">Nueva Convocatoria</Button>
        </div>
      </div>
    ),
  },
};

export const ConvocatoriasView = {
  args: {
    title: 'Gestión de Convocatorias',
    activeNav: 'convocatorias',
    usuario: {
      nombreCompleto: 'Dra. Elena Rossi',
      rol: 'Comité Evaluador',
    },
    children: (
      <div className="space-y-4">
        <h2 className="font-serif-title text-2xl text-[#1f2023]">Convocatorias de Investigación 2026</h2>
        <p className="text-sm text-[#5b5f66]">
          Listado de propuestas recibidas para ponencias y artículos académicos.
        </p>
        <div className="h-48 rounded-[8px] border border-dashed border-[#d8dadf] bg-[#f7f7f8] flex items-center justify-center text-sm text-[#9ca0a6]">
          Tabla de Convocatorias
        </div>
      </div>
    ),
  },
};

export const Interactive = {
  render: () => {
    const [currentNav, setCurrentNav] = useState('dashboard');

    const titles = {
      dashboard: 'Dashboard Principal',
      convocatorias: 'Gestión de Convocatorias',
      eventos: 'Agenda de Eventos Académicos',
      certificados: 'Módulo de Certificación',
      configuracion: 'Configuración del Sistema',
    };

    return (
      <MainLayout
        title={titles[currentNav] || 'Panel SIGEA'}
        activeNav={currentNav}
        onSelectNav={(navId) => setCurrentNav(navId)}
        onLogout={() => alert('Sesión cerrada')}
      >
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e]">
            Pestaña Activa: {currentNav}
          </span>
          <h2 className="font-serif-title text-2xl text-[#1f2023]">
            {titles[currentNav]}
          </h2>
          <p className="text-sm text-[#5b5f66]">
            Haz clic en los elementos de la barra lateral (Sidebar) para cambiar la vista interactiva.
          </p>
        </div>
      </MainLayout>
    );
  },
};
