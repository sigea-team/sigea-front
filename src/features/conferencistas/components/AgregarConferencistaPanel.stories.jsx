import AgregarConferencistaPanel from './AgregarConferencistaPanel';
import { crearConferencistasApiMock } from '../mocks/conferencistasMock';

export default {
  title: 'Features/Conferencistas/AgregarConferencistaPanel',
  component: AgregarConferencistaPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-3xl p-6 bg-white"><Story /></div>],
};

/**
 * Criterio 3: lista de registrados para vincular (los que ya están en el evento aparecen marcados).
 * Para invitar a uno nuevo escribe nombre y correo. Prueba el correo carlos.rojas@uis.edu.co
 * (ya registrado: ofrece vincularlo) o diego.torres@softcucuta.co (ya tiene invitación vigente).
 */
export const EventoHabilitado = {
  args: { eventoId: 3, api: crearConferencistasApiMock(), onVincular: () => {}, onInvitado: () => {} },
};

/** Sin conferencistas registrados todavía: solo queda invitar. */
export const SinRegistrados = {
  args: {
    eventoId: 4,
    api: crearConferencistasApiMock({ perfiles: [], participaciones: [] }),
    onVincular: () => {},
    onInvitado: () => {},
  },
};
