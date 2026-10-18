import AutoresList from './AutoresList';
import { ROLES_AUTOR } from '../propuestaUtils';

export default {
  title: 'Features/Propuestas/AutoresList',
  component: AutoresList,
  parameters: {
    layout: 'padded',
  },
};

export const ConAutoresDiferenciados = {
  args: {
    autores: [
      {
        id: 1,
        nombreCompleto: 'Dr. Roberto Gómez Bolaños',
        correo: 'roberto.gomez@ufps.edu.co',
        filiacion: 'Universidad Francisco de Paula Santander',
        rol: ROLES_AUTOR.AUTOR_PRINCIPAL,
      },
      {
        id: 2,
        nombreCompleto: 'Ing. Sandra Patricia Castro',
        correo: 'sandra.castro@ufps.edu.co',
        filiacion: 'Grupo de Investigación GIDIS',
        rol: ROLES_AUTOR.COAUTOR,
      },
      {
        id: 3,
        nombreCompleto: 'Lic. Fernando Ortiz',
        correo: 'fernando.ortiz@unisimon.edu.co',
        filiacion: 'Universidad Simón Bolívar',
        rol: ROLES_AUTOR.PONENTE,
      },
    ],
    onEditar: (autor) => console.log('Editar:', autor),
    onEliminar: (id) => console.log('Eliminar:', id),
  },
};

export const ListaVacia = {
  args: {
    autores: [],
  },
};
