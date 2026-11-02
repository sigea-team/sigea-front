import SalaFormModal from './SalaFormModal';
import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';

export default {
  title: 'Features/Salas/SalaFormModal',
  component: SalaFormModal,
  tags: ['autodocs'],
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/** Registrar nueva sala física o virtual con franjas iniciales (Criterios 1 y 3) */
export const RegistrarNuevaSala = {
  args: {
    isOpen: true,
    sala: null,
    evento: evento(3) || { id: 3, nombre: 'Congreso Internacional de TIC 2026' },
    salasExistentes: [
      { id: 1, nombre: 'Auditorio Mayor' },
      { id: 2, nombre: 'Sala Virtual Zoom 1' },
    ],
    actividadesSala: [],
    onClose: () => {},
    onSubmit: async (datos) => {
      console.log('Registrar sala', datos);
    },
  },
};

/** Editar sala existente con advertencia de sobrecupo al reducir aforo (Criterio 4) */
export const EditarConConflictoAforo = {
  args: {
    isOpen: true,
    sala: {
      id: 1,
      nombre: 'Auditorio Mayor',
      tipo: 'fisica',
      ubicacion: 'Edificio Cread, 1er piso',
      aforoMaximo: 250,
      disponibilidad: [
        { id: 101, fecha: '2026-10-21', horaInicio: '08:00', horaFin: '13:00' },
      ],
    },
    evento: evento(3) || { id: 3, nombre: 'Congreso Internacional de TIC 2026' },
    salasExistentes: [{ id: 1, nombre: 'Auditorio Mayor' }],
    actividadesSala: [
      { id: 501, nombre: 'Conferencia Inaugural', inscripcionesActivas: 180 },
    ],
    onClose: () => {},
    onSubmit: async (datos) => {
      console.log('Actualizar sala', datos);
    },
  },
};

