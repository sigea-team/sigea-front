import React, { useState } from 'react';
import Input from './Input';

export default {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'password', 'email', 'tel', 'number'],
    },
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
    label: 'Nombre completo',
    placeholder: 'Ej. Juan Pérez',
    name: 'nombre',
  },
};

export const Required = {
  args: {
    label: 'Correo Electrónico',
    placeholder: 'correo@ejemplo.com',
    type: 'email',
    required: true,
  },
};

export const WithHelperText = {
  args: {
    label: 'Teléfono de Contacto',
    placeholder: 'Ej. 3001234567',
    type: 'tel',
    helperText: 'Número de 10 dígitos sin espacios ni guiones.',
  },
};

export const WithError = {
  args: {
    label: 'Correo Electrónico',
    value: 'correo-invalido',
    error: 'Ingrese un formato de correo electrónico válido',
    required: true,
  },
};

export const Disabled = {
  args: {
    label: 'Campo Inhabilitado',
    value: 'Valor no editable',
    disabled: true,
  },
};

export const WithRightElement = {
  args: {
    label: 'Contraseña',
    type: 'password',
    placeholder: 'Tu contraseña',
    required: true,
    rightElement: (
      <button type="button" className="hover:text-[#1f2023] focus:outline-none cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    ),
  },
};

export const InteractiveState = {
  render: () => {
    const [val, setVal] = useState('');
    return (
      <div className="max-w-md">
        <Input
          label="Campo Interactivo"
          placeholder="Escribe algo aquí..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          helperText={val ? `Has escrito: ${val.length} caracteres` : 'Escribe para probar el estado'}
        />
      </div>
    );
  },
};
