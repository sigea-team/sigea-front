import ConvocatoriasTable from './ConvocatoriasTable';

export default {
  title: 'Features/Convocatorias/ConvocatoriasTable',
  component: ConvocatoriasTable,
  tags: ['autodocs'],
};

const MOCK_CONVOCATORIAS = [
  {
    id: 1,
    eventoNombre: 'Semana de la Ingeniería de Sistemas 2026-2',
    titulo: 'Convocatoria de Ponencias y Artículos de Investigación 2026',
    descripcion: 'Recepción de artículos científicos en formato IEEE.',
    fechaApertura: '2026-10-01T08:00',
    fechaCierre: '2026-11-15T23:59',
    estado: 'BORRADOR',
  },
  {
    id: 2,
    eventoNombre: 'Encuentro de Semilleros de Investigación UFPS',
    titulo: 'Convocatoria Posters Científicos',
    descripcion: 'Espacio para socialización de posters de investigación.',
    fechaApertura: '2026-09-01T08:00',
    fechaCierre: '2026-09-30T18:00',
    estado: 'ABIERTA',
  },
];

export const ConDatos = {
  args: {
    convocatorias: MOCK_CONVOCATORIAS,
    cargando: false,
    hayFiltros: false,
    onEditar: (item) => console.log('Editar:', item),
    onEliminar: (item) => console.log('Eliminar:', item),
    onIntentarEnviar: (item) => console.log('Intentar enviar:', item),
  },
};

export const Vacia = {
  args: {
    convocatorias: [],
    cargando: false,
    hayFiltros: false,
    onEditar: () => {},
    onEliminar: () => {},
    onIntentarEnviar: () => {},
  },
};

export const Cargando = {
  args: {
    convocatorias: [],
    cargando: true,
    hayFiltros: false,
    onEditar: () => {},
    onEliminar: () => {},
    onIntentarEnviar: () => {},
  },
};
