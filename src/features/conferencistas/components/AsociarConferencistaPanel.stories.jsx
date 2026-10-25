import AsociarConferencistaPanel from './AsociarConferencistaPanel';
import { crearConferencistasApiMock } from '../mocks/conferencistasMock';

export default {
  title: 'Features/Conferencistas/AsociarConferencistaPanel',
  component: AsociarConferencistaPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-3xl p-6 bg-white"><Story /></div>],
};

const api = crearConferencistasApiMock();

/** Criterio 3: la persona ya tiene trayectoria; solo se indica su participación en el evento. */
export const ConTrayectoria = {
  args: {
    coincidencia: {
      personaId: 15, nombreCompleto: 'Carlos Andrés Rojas Duarte', tipoDocumento: 'CC', numeroDocumento: '88234567',
      correo: 'carlos.rojas@uis.edu.co', coincidePor: 'documento', tienePerfil: true, yaAsociadoAlEvento: false, eventosPrevios: 1,
    },
    eventoId: 3, api, onAsociado: () => {}, onCancelar: () => {},
  },
};

/** Criterio 3: participante registrado sin trayectoria; se pide la biografía para asociarlo. */
export const SinTrayectoria = {
  args: {
    coincidencia: {
      personaId: 27, nombreCompleto: 'Jorge Enrique Villamizar Ortega', tipoDocumento: 'CC', numeroDocumento: '60345678',
      correo: 'jorge.villamizar@ufps.edu.co', coincidePor: 'correo', tienePerfil: false, yaAsociadoAlEvento: false, eventosPrevios: 0,
    },
    eventoId: 3, api, onAsociado: () => {}, onCancelar: () => {},
  },
};
