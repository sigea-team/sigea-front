import DisponibilidadSalaModal from './DisponibilidadSalaModal';

export default {
  title: 'Features/Salas/DisponibilidadSalaModal',
  component: DisponibilidadSalaModal,
  tags: ['autodocs'],
};

export const ConFranjasYConflictoDetectado = {
  args: {
    isOpen: true,
    sala: {
      id: 1,
      nombre: 'Auditorio Mayor Eustorgio Gómez',
      tipo: 'fisica',
      aforoMaximo: 250,
      disponibilidad: [
        { id: 101, fecha: '2026-10-21', horaInicio: '08:00', horaFin: '13:00' },
      ],
    },
    actividadesSala: [
      {
        id: 99,
        nombre: 'Conferencia de Inteligencia Artificial',
        fecha: '2026-10-21',
        horaInicio: '15:00',
        horaFin: '17:00',
      },
    ],
    onClose: () => {},
    onGuardar: async (salaId, franjas) => {
      console.log('Guardar disponibilidad', salaId, franjas);
    },
  },
};

