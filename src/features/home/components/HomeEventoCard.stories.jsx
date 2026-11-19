import HomeEventoCard from './HomeEventoCard';
import { EVENTOS_BASE_INSTITUCIONALES } from '../homeUtils';

export default {
  title: 'Features/Home/HomeEventoCard',
  component: HomeEventoCard,
  tags: ['autodocs'],
};

export const Presencial = {
  args: {
    evento: {
      ...EVENTOS_BASE_INSTITUCIONALES[0],
      convocatorias: [
        { id: 1, titulo: 'Call for Papers Hackathon 2026' },
      ],
    },
  },
};

export const Hibrido = {
  args: {
    evento: EVENTOS_BASE_INSTITUCIONALES[1],
  },
};

export const Virtual = {
  args: {
    evento: EVENTOS_BASE_INSTITUCIONALES[2],
  },
};
