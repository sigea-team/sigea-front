import { useState } from 'react';
import TextArea from './TextArea';

export default {
  title: 'Features/Eventos/TextArea',
  component: TextArea,
  tags: ['autodocs'],
};

export const Vacio = {
  args: { label: 'Objetivo', id: 'objetivo', value: '', onChange: () => {}, placeholder: '¿Qué busca lograr el evento?' },
};

export const ConError = {
  args: { label: 'Descripción', id: 'descripcion', value: '', onChange: () => {}, error: 'Revisa este campo.' },
};

export const Interactivo = {
  render: () => {
    const [valor, setValor] = useState('');
    return (
      <div className="max-w-md">
        <TextArea
          label="Descripción"
          id="descripcion-interactiva"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          helperText="Temática y público al que se dirige."
        />
      </div>
    );
  },
};
