import HomeEventosGallery from './HomeEventosGallery';
import { EVENTOS_BASE_INSTITUCIONALES } from '../homeUtils';

export default {
  title: 'Features/Home/HomeEventosGallery',
  component: HomeEventosGallery,
  tags: ['autodocs'],
};

export const VariosEventos = {
  args: {
    eventos: EVENTOS_BASE_INSTITUCIONALES,
  },
};

export const UnSoloEvento = {
  args: {
    eventos: [EVENTOS_BASE_INSTITUCIONALES[0]],
  },
};
