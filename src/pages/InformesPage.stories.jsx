import InformesPage from './InformesPage';
import { crearCatalogosMock, crearInformesApiMock } from '../features/informes/mocks/informesMock';

export default {
  title: 'Pages/InformesPage',
  component: InformesPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { catalogos: crearCatalogosMock(), descargar: () => {} },
};

/** Criterios 1 a 3: elegir el tipo y los filtros, generar la vista previa y exportar. Evento 7 con datos, 8 sin datos. */
export const Normal = {
  args: { api: crearInformesApiMock() },
};

/** Llega desde el dashboard de indicadores con el tipo y el evento ya elegidos. */
export const DesdeDashboard = {
  args: { api: crearInformesApiMock(), parametrosIniciales: { tipo: 'INDICADORES', eventoId: 7 } },
};

/** Más de 50 registros: vista previa paginada. */
export const MuchosRegistros = {
  args: { api: crearInformesApiMock({ muchos: true }) },
};

/** Criterio 4: la primera exportación falla y se puede reintentar. */
export const ExportacionFalla = {
  args: { api: crearInformesApiMock({ fallosExportacion: 1 }) },
};

/** El informe supera el máximo de registros (422): se pide acotar los filtros. */
export const DemasiadoGrande = {
  args: { api: crearInformesApiMock({ demasiadoGrande: true }) },
};

/** No se pudo cargar el catálogo de tipos (sin conexión): «Reintentar». */
export const SinConexion = {
  args: { api: crearInformesApiMock({ catalogoFalla: true }) },
};

/** La cuenta no tiene REPORTES_VER, EVENTOS_EDITAR ni es administrador (403). */
export const SinPermiso = {
  args: { api: crearInformesApiMock({ prohibido: true }) },
};
