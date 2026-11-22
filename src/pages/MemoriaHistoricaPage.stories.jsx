import MemoriaHistoricaPage from './MemoriaHistoricaPage';
import { crearMemoriaApiMock } from '../features/memoria/mocks/memoriaMock';

export default {
  title: 'Pages/MemoriaHistoricaPage',
  component: MemoriaHistoricaPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const admin = { nombreCompleto: 'Admin SIGEA', rol: 'ADMIN', permisos: [] };

/** Archivo de eventos cerrados formalmente, con filtros por nombre, semestre y familia de ediciones (Criterio 2). */
export const Archivo = {
  args: { api: crearMemoriaApiMock(), usuarioProp: admin },
};

/** Con la autorización especial MEMORIA_HISTORICA_ELIMINAR aparece «Eliminar» en cada evento (Criterio 3). */
export const ConAutorizacionEspecial = {
  args: { api: crearMemoriaApiMock(), usuarioProp: { ...admin, permisos: ['MEMORIA_HISTORICA_ELIMINAR'] } },
};

/** Todavía no hay eventos cerrados formalmente. */
export const Vacia = {
  args: { api: crearMemoriaApiMock({ memorias: [] }), usuarioProp: admin },
};

/** Error de conexión. */
export const ErrorDeConexion = {
  args: { api: crearMemoriaApiMock({ fallarCarga: true }), usuarioProp: admin },
};
