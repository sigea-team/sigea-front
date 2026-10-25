import ConferencistaPublicoCard from './ConferencistaPublicoCard';
import { PERFILES_MOCK } from '../mocks/conferencistasMock';

export default {
  title: 'Features/Conferencistas/ConferencistaPublicoCard',
  component: ConferencistaPublicoCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-3xl p-6 bg-[#f7f7f8]"><Story /></div>],
};

const perfil = PERFILES_MOCK[0];

export const TrayectoriaCompleta = {
  args: {
    conferencista: {
      personaId: 12, nombreCompleto: 'Ana María Pérez Gómez', tipoParticipacion: 'conferencista',
      tema: 'Inteligencia artificial aplicada a la educación', ...perfil,
    },
  },
};

export const SoloBiografia = {
  args: {
    conferencista: {
      personaId: 30, nombreCompleto: 'Diego Torres', tipoParticipacion: 'ponente', tema: null, cargoActual: null,
      institucion: null, biografia: 'Ingeniero de software con experiencia en desarrollo móvil.', enlacePerfil: null,
      estudios: [], publicaciones: [], fechaActualizacion: '2026-10-01T09:00:00',
    },
  },
};
