import { CalendarPlus } from 'lucide-react';
import ModalShell from './ModalShell';
import Button from '../../../components/ui/Button';

export default {
  title: 'Features/Eventos/ModalShell',
  component: ModalShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export const Basico = {
  args: {
    titulo: 'Crear evento',
    subtitulo: 'El evento quedará en configuración hasta que se apruebe y publique.',
    icono: CalendarPlus,
    onClose: () => {},
    pie: (
      <>
        <Button variant="outline">Cancelar</Button>
        <Button variant="primary">Crear evento</Button>
      </>
    ),
    children: <p className="text-sm text-[#5b5f66]">Contenido del modal.</p>,
  },
};
