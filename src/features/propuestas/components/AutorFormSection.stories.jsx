import AutorFormSection from './AutorFormSection';
import { ROLES_AUTOR } from '../propuestaUtils';

export default {
  title: 'Features/Propuestas/AutorFormSection',
  component: AutorFormSection,
  parameters: {
    layout: 'padded',
  },
};

export const NuevoAutor = {
  args: {
    onAgregarAutor: (autor) => console.log('Autor agregado:', autor),
    autorEnEdicion: null,
  },
};

export const ModoEdicion = {
  args: {
    autorEnEdicion: {
      id: 1,
      nombre: 'María',
      apellidos: 'Fernández',
      nombreCompleto: 'María Fernández',
      correo: 'maria.fernandez@ufps.edu.co',
      filiacion: 'Universidad Francisco de Paula Santander',
      rol: ROLES_AUTOR.AUTOR_PRINCIPAL,
    },
    onAgregarAutor: (autor) => console.log('Autor actualizado:', autor),
    onCancelarEdicion: () => console.log('Edición cancelada'),
  },
};
