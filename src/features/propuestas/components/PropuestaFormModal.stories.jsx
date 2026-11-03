import PropuestaFormModal from './PropuestaFormModal';
import { crearPropuestasApiMock } from '../mocks/propuestasMock';

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

const base = {
  isOpen: true,
  convocatoria: convocatoriaMock,
  onClose: () => console.log('Cerrar modal'),
  onPropuestaEnviada: (data) => console.log('Propuesta enviada:', data),
};

/** HU-14, Criterio 1: envío con autores y documentos; el sistema confirma la recepción (versión 1). */
export const Abierto = {
  args: { ...base, api: crearPropuestasApiMock() },
};

/** HU-14, Criterio 2: el backend rechaza un archivo cuyo contenido no corresponde a su formato. */
export const ArchivoRechazado = {
  args: { ...base, api: crearPropuestasApiMock({ fallarEnvio: 'ARCHIVO_INVALIDO' }) },
};

/** HU-14, Criterio 2: la convocatoria cerró mientras el autor llenaba el formulario. */
export const ConvocatoriaCerrada = {
  args: { ...base, api: crearPropuestasApiMock({ fallarEnvio: 'CONVOCATORIA_CERRADA' }) },
};
