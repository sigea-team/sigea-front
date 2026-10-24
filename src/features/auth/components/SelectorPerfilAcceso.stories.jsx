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

export const ModoAdministrador = {
  args: {
    modoAcceso: 'administrador',
    onChangeModo: (modo) => console.log('Modo cambiado:', modo),
  },
};

/** HU-12: conferencista invitado que ingresa a ver y actualizar su trayectoria. */
export const ModoConferencista = {
  args: {
    modoAcceso: 'conferencista',
    onChangeModo: (modo) => console.log('Modo cambiado:', modo),
  },
};
