/**
 * @file memoriaMock.js
 * @description API simulada de la memoria histórica (HU-28) para Storybook y las pruebas en navegador. Mantiene el
 * estado en memoria y responde con la misma forma que el backend, incluidos los errores 409/400/404.
 * @module features/memoria/mocks/memoriaMock
 */

const espera = (valor, ms = 150) => new Promise((resolver) => setTimeout(() => resolver(valor), ms));

const errorApi = (status, codigo, message, extra = {}) => {
  const err = new Error(message);
  err.response = { status, data: { status, codigo, message, ...extra } };
  return Promise.reject(err);
};

/** Indicadores como los calcula el backend al cierre (16 códigos; los que no tienen dato no se guardan). */
export function indicadoresEjemplo(fecha = '2026-10-06T09:30:00') {
  const lista = [
    ['INSCRITOS', 'Participantes inscritos', 186, 'personas'],
    ['ASISTENTES', 'Participantes con asistencia registrada', 152, 'personas'],
    ['TASA_ASISTENCIA', 'Tasa de asistencia de los inscritos', 81.72, '%'],
    ['ASISTENCIAS_REGISTRADAS', 'Registros de asistencia a actividades', 498, 'registros'],
    ['ACTIVIDADES_REALIZADAS', 'Actividades programadas (no canceladas)', 18, 'actividades'],
    ['ACTIVIDADES_CANCELADAS', 'Actividades canceladas', 1, 'actividades'],
    ['PROPUESTAS_RECIBIDAS', 'Propuestas recibidas', 42, 'propuestas'],
    ['PROPUESTAS_APROBADAS', 'Propuestas aprobadas (incluye con ajustes)', 27, 'propuestas'],
    ['PROPUESTAS_RECHAZADAS', 'Propuestas rechazadas', 15, 'propuestas'],
    ['TASA_APROBACION', 'Tasa de aprobación de propuestas', 64.29, '%'],
    ['CONFERENCISTAS', 'Conferencistas y ponentes', 9, 'personas'],
    ['RESPUESTAS_ENCUESTAS', 'Respuestas a encuestas de satisfacción', 97, 'respuestas'],
    ['SATISFACCION_PROMEDIO', 'Satisfacción promedio (preguntas de escala)', 86.4, '%'],
    ['PRESUPUESTO_APROBADO', 'Presupuesto aprobado', 18500000, 'COP'],
    ['PRESUPUESTO_EJECUTADO', 'Presupuesto ejecutado', 16230000, 'COP'],
    ['EJECUCION_PRESUPUESTAL', 'Porcentaje de ejecución presupuestal', 87.73, '%'],
  ];
  return lista.map(([codigo, nombre, valor, unidad]) => ({ codigo, nombre, valor, unidad, fechaCalculo: fecha }));
}

/**
 * Contenido consolidado con la forma que guarda el backend en `memorias_historicas.contenido`.
 * @param {{ id: number, nombre: string, semestre?: string, fechaInicio?: string, fechaFin?: string }} evento
 * @param {Array<Object>} [pendientes]
 */
export function contenidoEjemplo(evento, pendientes = []) {
  return {
    version: 1,
    evento: {
      id: evento.id,
      nombre: evento.nombre,
      objetivo: 'Socializar los avances de investigación y extensión del programa de Ingeniería de Sistemas.',
      descripcion: 'Conferencias, talleres y ponencias de estudiantes, docentes e invitados nacionales.',
      tipoEvento: evento.tipo || 'Congreso',
      modalidad: evento.modalidad || 'presencial',
      fechaInicio: evento.fechaInicio || '2026-10-01',
      fechaFin: evento.fechaFin || '2026-10-03',
      semestre: evento.semestre || '2026-2',
      estado: 'cerrado',
      eventoBaseId: evento.eventoBaseId ?? null,
      eventoBaseNombre: evento.eventoBaseId ? 'Semana de Ingeniería de Sistemas' : null,
    },
    comiteOrganizador: [
      { personaId: 1, nombre: 'Laura Gómez', correo: 'laura.gomez@ufps.edu.co', rol: 'coordinador', activo: true, fechaAsignacion: '2026-06-01T10:00:00', fechaRetiro: null },
      { personaId: 2, nombre: 'Carlos Ruiz', correo: 'carlos.ruiz@ufps.edu.co', rol: 'logistica', activo: true, fechaAsignacion: '2026-06-03T10:00:00', fechaRetiro: null },
    ],
    lineasTematicas: [
      { id: 1, nombre: 'Inteligencia artificial', descripcion: null },
      { id: 2, nombre: 'Ingeniería de software', descripcion: null },
    ],
    tiposActividad: [
      { id: 1, nombre: 'Conferencia', descripcion: null },
      { id: 2, nombre: 'Taller', descripcion: null },
    ],
    presupuesto: {
      rubros: [
        { id: 1, nombre: 'Refrigerios', cantidad: 400, valorUnitarioProyectado: 12000, totalProyectado: 4800000, activo: true, ejecutado: 4650000 },
        { id: 2, nombre: 'Honorarios conferencistas', cantidad: 3, valorUnitarioProyectado: 3500000, totalProyectado: 10500000, activo: true, ejecutado: 10500000 },
        { id: 3, nombre: 'Material impreso', cantidad: 300, valorUnitarioProyectado: 4000, totalProyectado: 1200000, activo: true, ejecutado: 1080000 },
      ],
      totalProyectado: 16500000,
      aprobado: { valor: 18500000, fechaAprobacion: '2026-08-15T09:00:00', evidenciaUrl: 'https://drive.example/acta-presupuesto.pdf' },
      totalEjecutado: 16230000,
    },
    convocatorias: [
      {
        id: 1,
        titulo: 'Convocatoria de ponencias 2026',
        estado: 'cerrada',
        fechaApertura: '2026-07-01',
        fechaCierre: '2026-08-30',
        umbralAceptacion: 7,
        umbralAjustes: 5,
        propuestas: [
          { id: 11, titulo: 'Detección de plagio con modelos de lenguaje', estado: 'aprobada', fechaEnvio: '2026-08-10T15:00:00', lineaTematica: 'Inteligencia artificial', autores: [{ personaId: 5, nombre: 'Andrea Pérez', rol: 'autor_principal', orden: 1 }, { personaId: 6, nombre: 'Julián Mora', rol: 'coautor', orden: 2 }], puntuacionPonderada: 8.6, clasificacion: 'aprobada', versionDefinitiva: 2, evaluacionesCompletadas: 2, evaluacionesAsignadas: 2 },
          { id: 12, titulo: 'Microservicios en la gestión académica', estado: 'ajustes', fechaEnvio: '2026-08-12T11:00:00', lineaTematica: 'Ingeniería de software', autores: [{ personaId: 7, nombre: 'Sofía Rincón', rol: 'autor_principal', orden: 1 }], puntuacionPonderada: 6.1, clasificacion: 'aprobada_con_ajustes', versionDefinitiva: null, evaluacionesCompletadas: 2, evaluacionesAsignadas: 2 },
          { id: 13, titulo: 'Gamificación en cursos de programación', estado: 'rechazada', fechaEnvio: '2026-08-20T09:00:00', lineaTematica: 'Ingeniería de software', autores: [{ personaId: 8, nombre: 'Mateo Díaz', rol: 'autor_principal', orden: 1 }], puntuacionPonderada: 4.2, clasificacion: 'rechazada', versionDefinitiva: null, evaluacionesCompletadas: 1, evaluacionesAsignadas: 2 },
        ],
      },
    ],
    conferencistas: [
      { personaId: 20, nombre: 'María Fernanda Castro', correo: 'mf.castro@example.com', tipoParticipacion: 'conferencista_invitado', tema: 'IA responsable' },
      { personaId: 5, nombre: 'Andrea Pérez', correo: 'andrea.perez@ufps.edu.co', tipoParticipacion: 'ponente', tema: 'Detección de plagio' },
    ],
    agenda: {
      diasPublicados: ['2026-10-01', '2026-10-02'],
      actividades: [
        { id: 31, nombre: 'Conferencia inaugural: IA responsable', tipoActividad: 'Conferencia', lineaTematica: 'Inteligencia artificial', fecha: '2026-10-01', horaInicio: '08:00:00', horaFin: '09:30:00', sala: 'Auditorio Eustorgio Colmenares', tipoSala: 'fisica', modalidad: 'presencial', ponente: 'María Fernanda Castro', estado: 'programada', propuestaId: null, inscritos: 160, asistentes: 138 },
        { id: 32, nombre: 'Detección de plagio con modelos de lenguaje', tipoActividad: 'Conferencia', lineaTematica: 'Inteligencia artificial', fecha: '2026-10-01', horaInicio: '10:00:00', horaFin: '11:00:00', sala: 'Sala SG-401', tipoSala: 'fisica', modalidad: 'presencial', ponente: 'Andrea Pérez', estado: 'programada', propuestaId: 11, inscritos: 60, asistentes: 51 },
        { id: 33, nombre: 'Taller de pruebas automatizadas', tipoActividad: 'Taller', lineaTematica: 'Ingeniería de software', fecha: '2026-10-02', horaInicio: '14:00:00', horaFin: '17:00:00', sala: 'Laboratorio LS-2', tipoSala: 'fisica', modalidad: 'presencial', ponente: null, estado: 'cancelada', propuestaId: null, inscritos: 25, asistentes: 0 },
      ],
    },
    participantes: [
      { inscripcionId: 101, personaId: 40, nombre: 'Daniela Suárez', tipoDocumento: 'CC', numeroDocumento: '1090456789', correo: 'daniela.suarez@ufps.edu.co', categoria: 'estudiante', fechaInscripcion: '2026-09-10T08:00:00', actividadesInscritas: 3, actividadesAsistidas: 2 },
      { inscripcionId: 102, personaId: 41, nombre: 'Esteban Vargas', tipoDocumento: 'CC', numeroDocumento: '1090111222', correo: 'esteban.vargas@ufps.edu.co', categoria: 'docente', fechaInscripcion: '2026-09-12T10:30:00', actividadesInscritas: 2, actividadesAsistidas: 0 },
    ],
    asistencia: { registros: 498, personasConAsistencia: 152, porQr: 471, manuales: 27 },
    encuestas: [
      {
        id: 51,
        titulo: 'Satisfacción general del evento',
        actividad: null,
        anonima: true,
        estado: 'cerrada',
        fechaPublicacion: '2026-10-03T18:00:00',
        fechaCierre: '2026-10-06T09:30:00',
        respuestas: 97,
        preguntas: [
          { texto: '¿Qué tan satisfecho quedaste con el evento?', tipo: 'escala', escalaMinima: 1, escalaMaxima: 5, respuestas: 97, promedio: 4.46, opciones: [], textos: [] },
          { texto: '¿Volverías a participar?', tipo: 'opcion', escalaMinima: null, escalaMaxima: null, respuestas: 95, promedio: null, opciones: [{ texto: 'Sí', respuestas: 88 }, { texto: 'No', respuestas: 7 }], textos: [] },
          { texto: 'Comentarios', tipo: 'texto', escalaMinima: null, escalaMaxima: null, respuestas: 3, promedio: null, opciones: [], textos: ['Excelente organización', 'Más talleres prácticos', 'Mejorar el sonido del auditorio'] },
        ],
      },
    ],
    certificados: {
      porTipo: { asistente: 1 },
      detalle: [
        { id: 61, personaId: 40, nombre: 'Daniela Suárez', numeroDocumento: '1090456789', tipo: 'asistente', actividad: null, porcentajeAsistencia: 66.67, fechaGeneracion: '2026-10-05T12:00:00', archivoUrl: 'https://drive.example/certificado-61.pdf' },
      ],
    },
    indicadores: indicadoresEjemplo(),
    pendientesAlCierre: pendientes,
  };
}

const RESUMEN_CODIGOS = ['INSCRITOS', 'ASISTENTES', 'ACTIVIDADES_REALIZADAS', 'PROPUESTAS_RECIBIDAS'];

/** Memoria con la forma de `MemoriaHistoricaResponse`. */
export function crearMemoria(evento, { memoriaId, fechaConsolidacion, resumen = null, pendientes = [] }) {
  const contenido = contenidoEjemplo(evento, pendientes);
  return {
    memoriaId,
    eventoId: evento.id,
    nombre: evento.nombre,
    semestre: evento.semestre,
    tipoEvento: evento.tipo || 'Congreso',
    modalidad: evento.modalidad || 'presencial',
    fechaInicio: evento.fechaInicio,
    fechaFin: evento.fechaFin,
    eventoBaseId: evento.eventoBaseId ?? null,
    fechaConsolidacion,
    cerradaPorUsuarioId: 1,
    cerradaPor: 'Admin SIGEA',
    resumen,
    archivoUrl: null,
    editable: false,
    indicadores: contenido.indicadores,
    contenido,
  };
}

/** Eventos ya cerrados formalmente de ejemplo (dos ediciones de la misma familia y otro evento). */
export function memoriasEjemplo() {
  return [
    crearMemoria(
      { id: 7, nombre: 'Semana de Ingeniería de Sistemas 2026', semestre: '2026-2', fechaInicio: '2026-10-01', fechaFin: '2026-10-03', eventoBaseId: 3 },
      { memoriaId: 2, fechaConsolidacion: '2026-10-06T09:30:00', resumen: 'Se realizaron 18 actividades con 152 asistentes. Se recomienda ampliar los talleres.' }
    ),
    crearMemoria(
      { id: 5, nombre: 'Encuentro de Semilleros de Investigación', tipo: 'Encuentro', semestre: '2026-1', fechaInicio: '2026-05-12', fechaFin: '2026-05-13', modalidad: 'hibrida' },
      { memoriaId: 1, fechaConsolidacion: '2026-05-20T16:00:00' }
    ),
    crearMemoria(
      { id: 3, nombre: 'Semana de Ingeniería de Sistemas 2025', semestre: '2025-2', fechaInicio: '2025-10-02', fechaFin: '2025-10-04' },
      { memoriaId: 0, fechaConsolidacion: '2025-10-10T11:00:00' }
    ),
  ];
}

export const PENDIENTES_EJEMPLO = [
  { codigo: 'EVALUACIONES_SIN_FINALIZAR', cantidad: 2, descripcion: 'Asignaciones de evaluación pendientes o en proceso' },
  { codigo: 'CERTIFICADOS_SIN_GENERAR', cantidad: 151, descripcion: 'Asistentes sin certificado de asistencia generado' },
];

/**
 * API simulada.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.memorias] - Memorias consolidadas.
 * @param {Array<Object>} [opciones.eventos] - Eventos que se pueden cerrar (para armar la memoria al cerrar).
 * @param {Array<Object>} [opciones.pendientes] - Pendientes de los eventos sin memoria.
 * @param {string|null} [opciones.motivoNoCerrable] - Si se da, ningún evento se puede cerrar todavía.
 * @param {boolean} [opciones.fallarCarga] - Las consultas fallan con 500.
 * @param {number} [opciones.demora]
 */
export function crearMemoriaApiMock({
  memorias = memoriasEjemplo(),
  eventos = [],
  pendientes = PENDIENTES_EJEMPLO,
  motivoNoCerrable = null,
  fallarCarga = false,
  demora = 150,
} = {}) {
  let lista = memorias.map((m) => ({ ...m }));
  let siguienteId = Math.max(10, ...lista.map((m) => m.memoriaId)) + 1;
  const llamadas = [];

  const eventoPorId = (id) => eventos.find((e) => e.id === id) || { id, nombre: `Evento ${id}`, semestre: '2026-2' };
  const fallo = () => errorApi(500, 'ERROR_INTERNO', 'Error interno del servidor');

  return {
    llamadas,
    async revisarCierre(eventoId) {
      llamadas.push(['revisarCierre', eventoId]);
      if (fallarCarga) return fallo();
      const evento = eventoPorId(eventoId);
      const memoria = lista.find((m) => m.eventoId === eventoId);
      if (memoria) {
        return espera({
          eventoId, nombre: evento.nombre, estado: 'cerrado', fechaFin: evento.fechaFin, consolidada: true,
          fechaConsolidacion: memoria.fechaConsolidacion, puedeCerrarse: false,
          motivoNoCerrable: 'El evento ya fue cerrado formalmente; su información está en la memoria histórica.', pendientes: [],
        }, demora);
      }
      return espera({
        eventoId, nombre: evento.nombre, estado: evento.estado || 'cerrado', fechaFin: evento.fechaFin, consolidada: false,
        fechaConsolidacion: null, puedeCerrarse: !motivoNoCerrable, motivoNoCerrable, pendientes,
      }, demora);
    },
    async cerrarFormalmente(eventoId, solicitud) {
      llamadas.push(['cerrarFormalmente', eventoId, solicitud]);
      const evento = eventoPorId(eventoId);
      if (lista.some((m) => m.eventoId === eventoId)) {
        return errorApi(409, 'MEMORIA_YA_CONSOLIDADA', `El evento «${evento.nombre}» ya fue cerrado formalmente; su información está en la memoria histórica.`);
      }
      if (motivoNoCerrable) return errorApi(409, 'EVENTO_NO_FINALIZADO', motivoNoCerrable);
      if (pendientes.length > 0 && !solicitud?.confirmarPendientes) {
        return errorApi(409, 'CIERRE_CON_PENDIENTES',
          `El evento «${evento.nombre}» tiene procesos pendientes. Revíselos o confirme el cierre formal para consolidar la memoria histórica de todas formas.`,
          { pendientes });
      }
      const memoria = crearMemoria(evento, {
        memoriaId: siguienteId++,
        fechaConsolidacion: new Date().toISOString().slice(0, 19),
        resumen: solicitud?.resumen || null,
        pendientes,
      });
      lista = [memoria, ...lista];
      return espera(memoria, demora);
    },
    async obtenerMemoria(eventoId) {
      llamadas.push(['obtenerMemoria', eventoId]);
      if (fallarCarga) return fallo();
      const memoria = lista.find((m) => m.eventoId === eventoId);
      if (!memoria) {
        return errorApi(404, 'MEMORIA_NO_ENCONTRADA', 'El evento todavía no tiene memoria histórica: se consolida con su cierre formal.');
      }
      return espera(memoria, demora);
    },
    async listarMemorias(filtros = {}) {
      llamadas.push(['listarMemorias', filtros]);
      if (fallarCarga) return fallo();
      let resultado = lista;
      if (filtros.semestre) resultado = resultado.filter((m) => m.semestre === filtros.semestre);
      if (filtros.texto) {
        const texto = filtros.texto.toLowerCase();
        resultado = resultado.filter((m) => m.nombre.toLowerCase().includes(texto));
      }
      if (filtros.familiaEventoId) {
        const id = Number(filtros.familiaEventoId);
        const base = lista.find((m) => m.eventoId === id)?.eventoBaseId ?? id;
        resultado = resultado.filter((m) => m.eventoId === base || m.eventoBaseId === base);
      }
      return espera(
        resultado
          .map((m) => ({
            memoriaId: m.memoriaId, eventoId: m.eventoId, nombre: m.nombre, tipoEvento: m.tipoEvento, modalidad: m.modalidad,
            fechaInicio: m.fechaInicio, fechaFin: m.fechaFin, semestre: m.semestre, eventoBaseId: m.eventoBaseId,
            fechaConsolidacion: m.fechaConsolidacion, cerradaPor: m.cerradaPor,
            indicadores: m.indicadores.filter((i) => RESUMEN_CODIGOS.includes(i.codigo)),
          }))
          .sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio))),
        demora
      );
    },
    async eliminarConAutorizacion(eventoId, solicitud) {
      llamadas.push(['eliminarConAutorizacion', eventoId, solicitud]);
      const memoria = lista.find((m) => m.eventoId === eventoId);
      if (!memoria) return errorApi(409, 'MEMORIA_NO_ENCONTRADA', 'El evento no está en la memoria histórica.');
      if ((solicitud?.nombreEvento || '').trim() !== memoria.nombre.trim()) {
        return errorApi(400, 'CONFIRMACION_INVALIDA', `El nombre escrito no coincide con el del evento. Escriba exactamente «${memoria.nombre}» para confirmar la eliminación.`);
      }
      if (lista.some((m) => m.eventoBaseId === eventoId)) {
        return errorApi(409, 'ELIMINACION_NO_PERMITIDA', `El evento «${memoria.nombre}» es el evento base de otras ediciones; eliminarlo rompería su historial.`);
      }
      lista = lista.filter((m) => m.eventoId !== eventoId);
      return espera({ mensaje: 'El evento y su memoria histórica fueron eliminados. La operación quedó registrada en la auditoría.' }, demora);
    },
  };
}

/**
 * Enlaza la API simulada de eventos con la de memoria: `listarEventos` marca `archivado` en los eventos que tienen
 * memoria, así el cierre formal se refleja en la tabla de Eventos al recargar (como en el backend, `EventoResponse`).
 * @param {Object} apiEventos - Resultado de `crearApiMock` de eventos.
 * @param {Object} apiMemoria - Resultado de {@link crearMemoriaApiMock}.
 */
export function enlazarConEventos(apiEventos, apiMemoria) {
  return {
    ...apiEventos,
    async listarEventos(...args) {
      const [eventos, memorias] = await Promise.all([apiEventos.listarEventos(...args), apiMemoria.listarMemorias()]);
      const archivados = new Set(memorias.map((m) => m.eventoId));
      return eventos.map((e) => ({ ...e, archivado: archivados.has(e.id) }));
    },
  };
}
