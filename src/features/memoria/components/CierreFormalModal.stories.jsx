import CierreFormalModal from './CierreFormalModal';
import { crearMemoriaApiMock } from '../mocks/memoriaMock';

export default {
  title: 'Features/Memoria/CierreFormalModal',
  component: CierreFormalModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {}, onCerrado: () => {} },
};

const evento = { id: 2, nombre: 'Congreso de Ingeniería de Sistemas 2025', estado: 'cerrado', fechaFin: '2025-10-23' };
const eventos = [evento];

/** Con procesos pendientes: hay que confirmarlos para cerrar (CU-32, flujo alterno). */
export const ConPendientes = {
  args: { evento, api: crearMemoriaApiMock({ memorias: [], eventos }) },
};

/** Sin pendientes: se cierra directamente, con un resumen opcional (Criterio 1). */
export const SinPendientes = {
  args: { evento, api: crearMemoriaApiMock({ memorias: [], eventos, pendientes: [] }) },
};

/** El evento todavía no ha terminado: se explica el motivo y no se ofrece cerrar. */
export const NoFinalizado = {
  args: {
    evento: { ...evento, estado: 'en_ejecucion' },
    api: crearMemoriaApiMock({ memorias: [], eventos, motivoNoCerrable: 'El evento termina el 2026-11-30. El cierre formal se hace a partir de su último día.' }),
  },
};

/** Error de conexión al revisar el evento. */
export const ErrorDeConexion = {
  args: { evento, api: crearMemoriaApiMock({ memorias: [], eventos, fallarCarga: true }) },
};
