import ConvocatoriaFormModal from './ConvocatoriaFormModal';

export default {
  title: 'Features/Convocatorias/ConvocatoriaFormModal',
  component: ConvocatoriaFormModal,
  tags: ['autodocs'],
};

export const ModoCrear = {
  args: {
    isOpen: true,
    convocatoria: null,
    onClose: () => console.log('Cerrar'),
    onSubmit: async (datos) => console.log('Guardar:', datos),
  },
};

export const ModoEditarBorrador = {
  args: {
    isOpen: true,
    convocatoria: {
      id: 1,
      eventoId: '101',
      eventoNombre: 'Semana de la Ingeniería de Sistemas 2026-2',
      titulo: 'Convocatoria de Ponencias y Artículos de Investigación 2026',
      descripcion: 'Convocatoria académica de artículos en ingeniería de software.',
      requisitos: 'Formato IEEE, máximo 6 páginas, PDF.',
      fechaApertura: '2026-10-01T08:00',
      fechaCierre: '2026-11-15T23:59',
      estado: 'BORRADOR',
    },
    onClose: () => console.log('Cerrar'),
    onSubmit: async (datos) => console.log('Actualizar:', datos),
  },
};
