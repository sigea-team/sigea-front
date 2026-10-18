import PropuestaFormModal from './PropuestaFormModal';

export default {
  title: 'Features/Propuestas/PropuestaFormModal',
  component: PropuestaFormModal,
  parameters: {
    layout: 'fullscreen',
  },
};

const convocatoriaMock = {
  id: 1,
  titulo: 'Convocatoria Ponencias de Investigación 2026',
  eventoNombre: 'Semana de la Ingeniería de Sistemas 2026-2',
  fechaApertura: '2026-10-01T08:00',
  fechaCierre: '2026-11-30T18:00',
  estado: 'PUBLICADA',
};

export const Abierto = {
  args: {
    isOpen: true,
    convocatoria: convocatoriaMock,
    onClose: () => console.log('Cerrar modal'),
    onPropuestaEnviada: (data) => console.log('Propuesta enviada:', data),
  },
};
