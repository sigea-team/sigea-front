import AuditoriaTabla from './AuditoriaTabla';
import { REGISTROS_AUDITORIA_MOCK } from '../mockAuditoria';

export default {
  title: 'Features/Auditoria/AuditoriaTabla',
  component: AuditoriaTabla,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { onVerDetalle: (r) => alert(`Ver detalle del registro #${r.id}`), onCambiarPagina: () => {} },
};

export const ConRegistros = {
  args: {
    registros: REGISTROS_AUDITORIA_MOCK,
    pagina: 0,
    tamano: 10,
    totalElementos: REGISTROS_AUDITORIA_MOCK.length,
    totalPaginas: 1,
  },
};

export const SegundaPagina = {
  args: {
    registros: REGISTROS_AUDITORIA_MOCK.slice(0, 3),
    pagina: 1,
    tamano: 10,
    totalElementos: 13,
    totalPaginas: 2,
  },
};

export const OperacionDelSistema = {
  args: {
    registros: [{ ...REGISTROS_AUDITORIA_MOCK[3], id: 99, usuarioId: null, usuarioCorreo: null, usuarioNombre: 'Sistema' }],
    totalElementos: 1,
    totalPaginas: 1,
  },
};

export const Vacia = {
  args: { registros: [], totalElementos: 0, totalPaginas: 1 },
};

export const Cargando = {
  args: { registros: [], cargando: true },
};
