import React, { useState } from 'react';
import Select from './Select';

const sampleOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

export default {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export const Default = {
  args: {
    label: 'Tipo de Documento',
    options: sampleOptions,
    placeholder: 'Seleccione un documento',
  },
};

export const Required = {
  args: {
    label: 'Afiliación Institucional',
    options: [
      { value: '1', label: 'Estudiante Pregrado' },
      { value: '2', label: 'Estudiante Posgrado' },
      { value: '3', label: 'Docente / Investigador' },
      { value: '4', label: 'Egresado' },
    ],
    placeholder: 'Seleccione su vinculación',
    required: true,
  },
};

export const WithHelperText = {
  args: {
    label: 'Rol Preferido',
    options: sampleOptions,
    helperText: 'Indique su documento de identidad registrado.',
  },
};

export const WithError = {
  args: {
    label: 'Tipo de Documento',
    options: sampleOptions,
    error: 'El tipo de documento es obligatorio',
    required: true,
  },
};

export const Disabled = {
  args: {
    label: 'Selección Inhabilitada',
    options: sampleOptions,
    value: 'CC',
    disabled: true,
  },
};

export const InteractiveState = {
  render: () => {
    const [selected, setSelected] = useState('');
    return (
      <div className="max-w-md">
        <Select
          label="Selección de Rol"
          options={[
            { value: 'asistente', label: 'Asistente' },
            { value: 'ponente', label: 'Ponente' },
            { value: 'organizador', label: 'Organizador' },
          ]}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          helperText={selected ? `Seleccionado: ${selected}` : 'Por favor seleccione una opción'}
        />
      </div>
    );
  },
};
