import IndicadoresEventoPage from './IndicadoresEventoPage';
import { crearIndicadoresApiMock } from '../features/indicadores/mocks/indicadoresMock';
import { crearInformesApiMock } from '../features/informes/mocks/informesMock';

export default {
  title: 'Pages/IndicadoresEventoPage',
  component: IndicadoresEventoPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  // HU-30: la descarga de los indicadores usa la API de informes simulada y no descarga archivos.
  args: { apiInformes: crearInformesApiMock(), descargar: () => {} },
};

/** Criterio 1: evento con información en todos los grupos (tarjetas, gráficas y tabla). */
export const EventoCompleto = {
  args: { eventoIdProp: 7, api: crearIndicadoresApiMock() },
};

/** Criterio 3: cada «Actualizar» recalcula; en este mock suma inscripciones y asistencias en cada llamada. */
export const ActualizarRecalcula = {
  args: { eventoIdProp: 7, api: crearIndicadoresApiMock({ crece: true }) },
};

/** Criterio 2: evento sin ninguna información; avisos en tarjetas, gráficas y tabla, sin error. */
export const SinDatos = {
  args: { eventoIdProp: 8, api: crearIndicadoresApiMock() },
};

/** Criterio 2: inscritos sin asistencia, sin propuestas, encuesta solo de texto y presupuesto sin aprobar. */
export const DatosParciales = {
  args: { eventoIdProp: 9, api: crearIndicadoresApiMock() },
};

/** Evento de la memoria histórica (HU-28): indicadores definitivos. */
export const EventoArchivado = {
  args: { eventoIdProp: 10, api: crearIndicadoresApiMock() },
};

/** La sesión no tiene REPORTES_VER, EVENTOS_EDITAR ni es administrador (403). */
export const SinPermiso = {
  args: { eventoIdProp: 7, api: crearIndicadoresApiMock({ prohibido: true }) },
};

/** El evento no existe (404). */
export const EventoInexistente = {
  args: { eventoIdProp: 99, api: crearIndicadoresApiMock() },
};

/** El servidor no responde. */
export const SinConexion = {
  args: { eventoIdProp: 7, api: crearIndicadoresApiMock({ falla: true }) },
};

/** HU-30, Criterio 4: la primera descarga falla por un problema técnico y «Reintentar» la completa. */
export const DescargaConReintento = {
  args: { eventoIdProp: 7, api: crearIndicadoresApiMock(), apiInformes: crearInformesApiMock({ fallosExportacion: 1 }) },
};
