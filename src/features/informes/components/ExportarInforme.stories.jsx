import ExportarInforme from './ExportarInforme';
import { crearInformesApiMock } from '../mocks/informesMock';

export default {
  title: 'Informes/ExportarInforme',
  component: ExportarInforme,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="p-6"><Story /></div>],
  args: {
    parametros: { tipo: 'GASTOS', eventoId: 7 },
    descargar: () => {},
  },
};

/** Criterio 3: descarga el PDF o el Excel con el nombre que da el backend. */
export const Normal = {
  args: { api: crearInformesApiMock() },
};

/** Criterio 4: la primera exportación falla por un problema técnico; «Reintentar» la completa. */
export const FallaYReintento = {
  args: { api: crearInformesApiMock({ fallosExportacion: 1 }) },
};

/** Criterio 4: sin conexión con el servidor (también se puede reintentar). */
export const SinConexion = {
  args: { api: crearInformesApiMock({ sinConexion: true }) },
};

/** Criterio 2: los filtros no arrojan resultados (409 INFORME_SIN_DATOS, no se reintenta). */
export const SinDatos = {
  args: { api: crearInformesApiMock(), parametros: { tipo: 'GASTOS', eventoId: 8 } },
};

/** Versión compacta del encabezado del dashboard de indicadores. */
export const Compacto = {
  args: { api: crearInformesApiMock(), compacto: true, titulo: 'Descargar indicadores', parametros: { tipo: 'INDICADORES', eventoId: 7 } },
};
