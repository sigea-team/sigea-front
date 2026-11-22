import MemoriaHistoricaModal from './MemoriaHistoricaModal';
import { crearMemoriaApiMock } from '../mocks/memoriaMock';

export default {
  title: 'Features/Memoria/MemoriaHistoricaModal',
  component: MemoriaHistoricaModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {} },
};

const evento = { id: 7, nombre: 'Semana de Ingeniería de Sistemas 2026' };

/** Memoria completa, solo consulta (Criterio 2): resumen, configuración, propuestas, agenda, participantes y encuestas. */
export const Consulta = {
  args: { evento, api: crearMemoriaApiMock() },
};

/** Con la autorización especial aparece «Eliminar con autorización especial» (Criterio 3). */
export const ConAutorizacionEspecial = {
  args: { evento, api: crearMemoriaApiMock(), onEliminar: () => {} },
};

/** El evento todavía no tiene cierre formal (404 MEMORIA_NO_ENCONTRADA). */
export const SinMemoria = {
  args: { evento: { id: 99, nombre: 'Seminario sin cerrar' }, api: crearMemoriaApiMock() },
};
