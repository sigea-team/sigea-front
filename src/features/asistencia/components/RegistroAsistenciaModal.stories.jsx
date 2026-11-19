import RegistroAsistenciaModal from './RegistroAsistenciaModal';
import EscanerSimulado from '../mocks/EscanerSimulado';
import { ACTIVIDAD_ASISTENCIA_MOCK, EVENTO_ASISTENCIA_MOCK, crearAsistenciaApiMock } from '../mocks/asistenciaMock';

export default {
  title: 'Features/Asistencia/RegistroAsistenciaModal',
  component: RegistroAsistenciaModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const base = {
  isOpen: true,
  evento: EVENTO_ASISTENCIA_MOCK,
  actividad: ACTIVIDAD_ASISTENCIA_MOCK,
  Escaner: EscanerSimulado,
  onClose: () => {},
};

/**
 * Criterios 2 y 3: los botones del escáner simulado leen QR válidos, ya registrados, de otro evento, de alguien que
 * no está inscrito en la actividad y desconocidos. También se registra a mano y se reenvía el QR.
 */
export const Escaneo = {
  args: { ...base, api: crearAsistenciaApiMock() },
};

/** Sin asistencias todavía. */
export const SinAsistencias = {
  args: { ...base, api: crearAsistenciaApiMock({ asistenciasIniciales: [] }) },
};

/** El usuario registra asistencia pero no tiene permiso para ver la lista de inscritos. */
export const SinPermisoInscritos = {
  args: { ...base, api: crearAsistenciaApiMock({ sinPermisoInscritos: true }) },
};

/** Evento cerrado: cada lectura se rechaza con EVENTO_NO_DISPONIBLE. */
export const EventoCerrado = {
  args: { ...base, api: crearAsistenciaApiMock({ eventoEstado: 'cerrado' }) },
};

/** Con la cámara real (html5-qrcode). En Storybook necesita permiso de cámara. */
export const ConCamara = {
  args: { ...base, Escaner: undefined, api: crearAsistenciaApiMock() },
};
