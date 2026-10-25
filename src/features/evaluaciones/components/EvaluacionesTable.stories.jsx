import EvaluacionesTable from './EvaluacionesTable';

export default {
  title: 'Features/Evaluaciones/EvaluacionesTable',
  component: EvaluacionesTable,
  tags: ['autodocs'],
};

const MOCK_ASIGNACIONES = [
  {
    asignacionId: 101,
    propuestaId: 1,
    propuestaTitulo: 'Inteligencia Artificial aplicada al diagnóstico precoz de patologías cardiovasculares',
    convocatoriaTitulo: 'V Simposio Internacional de Ingeniería y Salud 2026',
    autores: ['Dr. Carlos Mendoza', 'Ing. Sofía Duarte'],
    fechaAsignacion: '2026-10-15T10:00:00',
    fechaCierre: '2026-11-30T23:59:59',
    estado: 'pendiente',
    evaluaciones: [],
  },
  {
    asignacionId: 102,
    propuestaId: 2,
    propuestaTitulo: 'Marco de Ciberseguridad Zero-Trust para Entornos de Nube Híbrida en el Sector Financiero',
    convocatoriaTitulo: 'Congreso Nacional de Tecnologías Emergentes 2026',
    autores: ['MSc. Valentina Ríos'],
    fechaAsignacion: '2026-10-18T14:30:00',
    fechaCierre: '2026-12-15T18:00:00',
    estado: 'completada',
    evaluaciones: [
      { criterioId: 1, pesoPorcentual: 35, calificacion: 8.5 },
      { criterioId: 2, pesoPorcentual: 35, calificacion: 8.0 },
      { criterioId: 3, pesoPorcentual: 15, calificacion: 9.0 },
      { criterioId: 4, pesoPorcentual: 15, calificacion: 8.0 },
    ],
  },
  {
    asignacionId: 103,
    propuestaId: 3,
    propuestaTitulo: 'Optimización de Cadenas de Suministro con Algoritmos Genéticos y Gemelos Digitales',
    convocatoriaTitulo: 'Jornadas de Investigación en Logística y Operaciones 2026',
    autores: ['Dr. Fernando Castro'],
    fechaAsignacion: '2026-09-01T08:00:00',
    fechaCierre: '2026-09-30T23:59:59', // Cerrada
    estado: 'completada',
    evaluaciones: [
      { criterioId: 1, pesoPorcentual: 35, calificacion: 6.0 },
      { criterioId: 2, pesoPorcentual: 35, calificacion: 6.5 },
      { criterioId: 3, pesoPorcentual: 15, calificacion: 7.0 },
      { criterioId: 4, pesoPorcentual: 15, calificacion: 6.5 },
    ],
  },
];

export const ConAsignaciones = {
  args: {
    asignaciones: MOCK_ASIGNACIONES,
    cargando: false,
    hayFiltros: false,
    onAbrirEvaluacion: (item) => console.log('Abrir evaluación:', item),
    onVerResultado: (item) => console.log('Ver resultado:', item),
  },
};

export const Vacia = {
  args: {
    asignaciones: [],
    cargando: false,
    hayFiltros: false,
    onAbrirEvaluacion: () => {},
    onVerResultado: () => {},
  },
};

export const Cargando = {
  args: {
    asignaciones: [],
    cargando: true,
    hayFiltros: false,
    onAbrirEvaluacion: () => {},
    onVerResultado: () => {},
  },
};
