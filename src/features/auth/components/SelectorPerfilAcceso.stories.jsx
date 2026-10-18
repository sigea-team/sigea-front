import SelectorPerfilAcceso from './SelectorPerfilAcceso';

export default {
  title: 'Features/Auth/SelectorPerfilAcceso',
  component: SelectorPerfilAcceso,
  parameters: {
    layout: 'centered',
  },
};

export const ModoAsistente = {
  args: {
    modoAcceso: 'asistente',
    onChangeModo: (modo) => console.log('Modo cambiado:', modo),
  },
};

export const ModoPonente = {
  args: {
    modoAcceso: 'ponente',
    onChangeModo: (modo) => console.log('Modo cambiado:', modo),
  },
};
