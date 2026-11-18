/**
 * @file homeUtils.js
 * @description Utilidades de procesamiento y normalización de eventos, convocatorias y agenda
 * para la vista pública inicial de SIGEA (UFPS Cúcuta).
 * @module features/home/homeUtils
 */

/**
 * Eventos institucionales emblemáticos del Programa de Ingeniería de Sistemas - UFPS Cúcuta.
 * Sirven como base enriquecida y catálogo para la comunidad académica.
 */
export const EVENTOS_BASE_INSTITUCIONALES = [
  {
    id: 1,
    nombre: 'Hackathon UFPS 2026',
    semestre: '2026-2',
    descripcion: 'Maratón intensiva de desarrollo tecnológico e innovación donde estudiantes y desarrolladores crean soluciones de impacto para problemáticas reales de la región fronteriza.',
    objetivo: 'Fomentar el trabajo en equipo, la creatividad y la aplicación práctica de ciencia de la computación e inteligencia artificial.',
    tipo: 'Hackathon',
    modalidad: 'presencial',
    lugar: 'Auditorio Virginia Gutiérrez de Pineda y Laboratorios de Informática — UFPS Campus Central',
    fechaInicio: '2026-11-08',
    fechaFin: '2026-12-08',
    destacado: true,
    estado: 'en_curso',
    lineasTematicas: ['Inteligencia Artificial', 'Desarrollo Web & Móvil', 'Ciencia de Datos', 'Innovación Social'],
    temasClave: ['IA Aplicada', 'Soluciones Cloud', 'Seguridad Digital'],
  },
  {
    id: 2,
    nombre: 'Jornadas de Ingeniería de Sistemas y Computación (JIS)',
    semestre: '2026-2',
    descripcion: 'Espacio insignia de divulgación científica y profesional que reúne a conferencistas internacionales, egresados destacados y ponentes de la academia y la industria tecnológica.',
    objetivo: 'Actualizar a la comunidad universitaria en las tendencias emergentes en computación y promover la investigación formativa.',
    tipo: 'Congreso',
    modalidad: 'hibrida',
    lugar: 'Auditorio Eustorgio Colmenares Baptista y Transmisión Institucional UFPS',
    fechaInicio: '2026-11-20',
    fechaFin: '2026-11-25',
    destacado: true,
    estado: 'proximo',
    lineasTematicas: ['Arquitectura de Software', 'Ciberseguridad', 'Computación en la Nube', 'DevOps'],
    temasClave: ['Arquitectura Moderna', 'Seguridad en Redes', 'Microservicios'],
  },
  {
    id: 3,
    nombre: 'Simposio Internacional de Inteligencia Artificial & Visión por Computador',
    semestre: '2026-2',
    descripcion: 'Encuentro científico de investigadores y estudiantes de posgrado enfocado en avances en deep learning, procesamiento de lenguaje natural y ética en sistemas inteligentes.',
    objetivo: 'Socializar proyectos de investigación de alto impacto y estrechar lazos de cooperación científica interinstitucional.',
    tipo: 'Simposio',
    modalidad: 'virtual',
    lugar: 'Salas Virtuales SIGEA & Auditorio Virtual UFPS',
    fechaInicio: '2026-12-01',
    fechaFin: '2026-12-04',
    destacado: false,
    estado: 'proximo',
    lineasTematicas: ['Machine Learning', 'Visión Artificial', 'Ética y Gobernanza de IA'],
    temasClave: ['LLMs', 'Modelos Generativos', 'Bioinformática'],
  },
  {
    id: 4,
    nombre: 'Workshop de Semilleros de Investigación y Pósters Estudiantiles',
    semestre: '2026-2',
    descripcion: 'Exposición y sustentación de trabajos de grado, pósters científicos y proyectos formativos desarrollados por los grupos y semilleros de investigación de Ingeniería de Sistemas.',
    objetivo: 'Impulsar el espíritu investigativo en pregrado y preparar a los futuros ingenieros en redacción y sustentación de artículos científicos.',
    tipo: 'Workshop',
    modalidad: 'presencial',
    lugar: 'Edificio de Aulas Sur y Plazoleta de Ingeniería — UFPS Cúcuta',
    fechaInicio: '2026-12-10',
    fechaFin: '2026-12-12',
    destacado: false,
    estado: 'proximo',
    lineasTematicas: ['Semilleros de Investigación', 'Proyectos de Grado', 'Pósters Científicos'],
    temasClave: ['Investigación Formativa', 'Tesis de Pregrado'],
  },
];

/**
 * Normaliza la modalidad de un evento a una etiqueta legible y consistente.
 * @param {string} modalidad
 * @returns {string}
 */
export function normalizarModalidad(modalidad) {
  const m = (modalidad || '').trim().toLowerCase();
  if (m === 'virtual') return 'Virtual';
  if (m === 'hibrida' || m === 'híbrida') return 'Híbrida';
  return 'Presencial';
}

/**
 * Formatea una fecha ISO o string al formato legible institucional en español.
 * @param {string} fechaStr - Ej: '2026-11-08' o '2026-11-18T08:04:00'
 * @param {{ incluirHora?: boolean }} [opciones]
 * @returns {string}
 */
export function formatearFecha(fechaStr, { incluirHora = false } = {}) {
  if (!fechaStr) return 'Fecha por definir';
  const fecha = new Date(fechaStr);
  if (Number.isNaN(fecha.getTime())) return fechaStr;

  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  if (incluirHora) {
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia} ${mes} ${anio}, ${horas}:${minutos}`;
  }

  return `${dia} ${mes} ${anio}`;
}

/**
 * Formatea el rango de fechas de un evento (ej. '08 nov 2026 — 08 dic 2026').
 * @param {string} inicio
 * @param {string} fin
 * @returns {string}
 */
export function formatearRangoFechas(inicio, fin) {
  if (!inicio && !fin) return 'Fechas por confirmar';
  if (inicio && !fin) return `Desde el ${formatearFecha(inicio)}`;
  if (!inicio && fin) return `Hasta el ${formatearFecha(fin)}`;
  return `${formatearFecha(inicio)} — ${formatearFecha(fin)}`;
}

/**
 * Determina el estado de desarrollo de un evento respecto a la fecha actual.
 * @param {string} fechaInicio
 * @param {string} fechaFin
 * @returns {'en_curso'|'proximo'|'finalizado'}
 */
export function calcularEstadoEvento(fechaInicio, fechaFin) {
  const ahora = new Date();
  const inicio = fechaInicio ? new Date(fechaInicio) : null;
  const fin = fechaFin ? new Date(fechaFin) : null;

  if (fin && ahora > fin) {
    return 'finalizado';
  }
  if (inicio && ahora < inicio) {
    return 'proximo';
  }
  return 'en_curso';
}

/**
 * Combina la lista de eventos con las convocatorias públicas correspondientes.
 * @param {Array<Object>} [eventosBase=[]]
 * @param {Array<Object>} [convocatoriasPublicas=[]]
 * @returns {Array<Object>}
 */
export function combinarEventosConConvocatorias(
  eventosBase = [],
  convocatoriasPublicas = []
) {
  const mapa = new Map();

  // 1. Agregar eventos base
  (eventosBase || []).forEach((ev) => {
    mapa.set(Number(ev.id), {
      ...ev,
      convocatorias: [],
      modalidadTexto: normalizarModalidad(ev.modalidad),
      estadoCalculado: ev.estado || calcularEstadoEvento(ev.fechaInicio, ev.fechaFin),
    });
  });

  // 2. Vincular convocatorias públicas o registrar eventos nuevos que vengan en las convocatorias
  (convocatoriasPublicas || []).forEach((conv) => {
    const evId = Number(conv.eventoId);
    if (!evId) return;

    if (!mapa.has(evId)) {
      mapa.set(evId, {
        id: evId,
        nombre: conv.eventoNombre || `Evento #${evId}`,
        semestre: '2026-2',
        descripcion: conv.descripcion || 'Evento académico organizado por el Programa de Ingeniería de Sistemas.',
        objetivo: 'Espacio de divulgación y participación académica e investigativa.',
        tipo: 'Evento Académico',
        modalidad: 'presencial',
        modalidadTexto: 'Presencial',
        lugar: 'Campus Central UFPS — Cúcuta',
        fechaInicio: conv.fechaApertura ? conv.fechaApertura.split('T')[0] : '',
        fechaFin: conv.fechaCierre ? conv.fechaCierre.split('T')[0] : '',
        destacado: false,
        estado: 'en_curso',
        estadoCalculado: 'en_curso',
        lineasTematicas: ['Ingeniería de Sistemas', 'Investigación'],
        temasClave: ['Académico'],
        convocatorias: [conv],
      });
    } else {
      const actual = mapa.get(evId);
      actual.convocatorias.push(conv);
      // Si el nombre del backend es más específico, actualizarlo si no era el genérico
      if (conv.eventoNombre && actual.nombre.toLowerCase().includes('evento #')) {
        actual.nombre = conv.eventoNombre;
      }
    }
  });

  return Array.from(mapa.values());
}

/**
 * Filtra la lista de eventos por texto de búsqueda, modalidad y estado temporal.
 * @param {Array<Object>} eventos
 * @param {{ busqueda?: string, modalidad?: string, estado?: string }} filtros
 * @returns {Array<Object>}
 */
export function filtrarEventos(eventos = [], { busqueda = '', modalidad = 'todas', estado = 'todos' } = {}) {
  const q = (busqueda || '').trim().toLowerCase();
  const modFiltro = (modalidad || 'todas').toLowerCase();
  const estFiltro = (estado || 'todos').toLowerCase();

  return eventos.filter((ev) => {
    // 1. Filtro textual
    if (q) {
      const matchNombre = (ev.nombre || '').toLowerCase().includes(q);
      const matchDesc = (ev.descripcion || '').toLowerCase().includes(q);
      const matchSemestre = (ev.semestre || '').toLowerCase().includes(q);
      const matchTemas = (ev.temasClave || []).some((t) => (t || '').toLowerCase().includes(q));
      const matchLineas = (ev.lineasTematicas || []).some((t) => (t || '').toLowerCase().includes(q));
      if (!matchNombre && !matchDesc && !matchSemestre && !matchTemas && !matchLineas) {
        return false;
      }
    }

    // 2. Filtro de modalidad
    if (modFiltro !== 'todas') {
      const evMod = (ev.modalidad || '').toLowerCase();
      if (modFiltro === 'hibrida') {
        if (!evMod.includes('hibrid') && !evMod.includes('híbrid')) return false;
      } else if (evMod !== modFiltro) {
        return false;
      }
    }

    // 3. Filtro de estado
    if (estFiltro !== 'todos') {
      const evEstado = ev.estadoCalculado || ev.estado || 'en_curso';
      if (estFiltro === 'activos' && evEstado === 'finalizado') return false;
      if (estFiltro === 'finalizados' && evEstado !== 'finalizado') return false;
      if (estFiltro === 'proximos' && evEstado !== 'proximo') return false;
    }

    return true;
  });
}

/**
 * Beneficios por rol de usuario al registrarse en SIGEA.
 */
export const BENEFICIOS_POR_ROL = [
  {
    id: 'asistente',
    rol: 'Asistentes y Estudiantes',
    tag: 'Participación Activa',
    descripcion: 'Disfruta al máximo de cada jornada académica con acceso a cupos, programación personalizada y certificaciones oficiales.',
    beneficios: [
      'Inscripción rápida a conferencias magistrales, workshops y hackatones.',
      'Reserva de cupos en salas presenciales y acceso a transmisiones virtuales.',
      'Descarga inmediata de certificados digitales con código de verificación QR.',
      'Historial completo de eventos y horas académicas acumuladas.',
    ],
    ctaTexto: 'Crear cuenta de Asistente',
    ctaRuta: '/registro?rol=asistente',
  },
  {
    id: 'autor',
    rol: 'Autores e Investigadores',
    tag: 'Producción Científica',
    descripcion: 'Publica y divulga tus proyectos de investigación bajo el estándar institucional de calidad de la UFPS.',
    beneficios: [
      'Envío de ponencias, artículos científicos y pósters a convocatorias abiertas.',
      'Seguimiento en línea del dictamen y comentarios del comité evaluador.',
      'Carga de versiones definitivas aprobadas con historial de cambios.',
      'Certificados oficiales de ponente y divulgación científica.',
    ],
    ctaTexto: 'Postular como Autor',
    ctaRuta: '/registro?rol=autor',
  },
  {
    id: 'conferencista',
    rol: 'Conferencistas Invitados',
    tag: 'Presencia & Trayectoria',
    descripcion: 'Visibiliza tu perfil profesional y académico ante la comunidad de ingenieros y estudiantes.',
    beneficios: [
      'Perfil público visible con biografía, publicaciones y filiación institucional.',
      'Configuración de disponibilidad de agenda y requerimientos técnicos.',
      'Interacción directa con la organización del evento.',
      'Constancia formal de conferencista internacional o nacional.',
    ],
    ctaTexto: 'Ingreso para Conferencistas',
    ctaRuta: '/login',
  },
  {
    id: 'evaluador',
    rol: 'Comité y Pares Evaluadores',
    tag: 'Rigor y Calidad Académica',
    descripcion: 'Evalúa propuestas mediante rúbricas objetivas y participa activamente en el arbitraje científico.',
    beneficios: [
      'Bandeja personalizada de propuestas asignadas con proceso a doble ciego.',
      'Calificación cuantitativa y cualitativa según criterios institucionales.',
      'Generación de retroalimentación constructiva para los autores.',
      'Certificado de participación como par evaluador oficial UFPS.',
    ],
    ctaTexto: 'Acceso Evaluadores',
    ctaRuta: '/login',
  },
];
