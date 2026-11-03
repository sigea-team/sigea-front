/**
 * @file propuestasMock.js
 * @description Datos y API simulada de propuestas con documentos y versiones (HU-14), solo para Storybook.
 * Imita las respuestas y reglas del backend (VersionPropuestaService) sin necesidad de servidor.
 * @module features/propuestas/mocks/propuestasMock
 */

const KB = 1024;

const AUTOR_CARLOS = {
  usuarioId: 4,
  nombre: 'Carlos Andrés Gómez Pérez',
  correo: 'carlos.gomez@ufps.edu.co',
};

const AUTORES = [
  { personaId: 10, nombres: 'Carlos Andrés', apellidos: 'Gómez Pérez', nombreCompleto: 'Carlos Andrés Gómez Pérez', correo: 'carlos.gomez@ufps.edu.co', filiacion: 'UFPS', rol: 'autor_principal', orden: 1 },
  { personaId: 11, nombres: 'Laura', apellidos: 'Méndez', nombreCompleto: 'Laura Méndez', correo: 'laura.mendez@ufps.edu.co', filiacion: 'UFPS', rol: 'coautor', orden: 2 },
];

function documento(id, propuestaId, nombre, tamano, principal, fecha) {
  return {
    id,
    nombreOriginal: nombre,
    tipoContenido: nombre.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    tamanoBytes: tamano,
    principal,
    fechaCarga: fecha,
    urlDescarga: `/api/v1/propuestas/${propuestaId}/documentos/${id}`,
  };
}

function version(propuestaId, numero, fecha, datos, documentos, extra = {}) {
  return {
    id: propuestaId * 10 + numero,
    propuestaId,
    numeroVersion: numero,
    fechaCreacion: fecha,
    autorCambioUsuarioId: AUTOR_CARLOS.usuarioId,
    autorCambioNombre: AUTOR_CARLOS.nombre,
    autorCambioCorreo: AUTOR_CARLOS.correo,
    titulo: datos.titulo,
    resumen: datos.resumen,
    palabrasClave: datos.palabrasClave,
    lineaTematicaId: null,
    lineaTematicaNombre: null,
    notaCambio: null,
    esDefinitiva: false,
    documentos,
    ...extra,
  };
}

const DATOS_50 = {
  titulo: 'Analítica de aprendizaje con IA en la educación superior',
  resumen: 'Se propone un modelo de analítica de aprendizaje que usa técnicas de IA para anticipar la deserción estudiantil.',
  palabrasClave: 'IA, analítica de aprendizaje, deserción',
};

/** Versiones de ejemplo: la propuesta 50 tiene 2 versiones; la 51 está en versión definitiva. */
export const VERSIONES_MOCK = {
  50: [
    version(50, 1, '2026-10-20T09:15:00', DATOS_50, [
      documento(501, 50, 'ponencia-analitica.pdf', 820 * KB, true, '2026-10-20T09:15:00'),
      documento(502, 50, 'anexo-datos.docx', 140 * KB, false, '2026-10-20T09:15:00'),
    ]),
    version(
      50,
      2,
      '2026-10-24T17:40:00',
      { ...DATOS_50, titulo: `${DATOS_50.titulo} (v2)` },
      [
        documento(503, 50, 'ponencia-analitica-v2.pdf', 905 * KB, true, '2026-10-24T17:40:00'),
        documento(504, 50, 'anexo-datos.docx', 140 * KB, false, '2026-10-20T09:15:00'),
      ],
      { notaCambio: 'Se corrigió la metodología y se reemplazó el documento principal.' }
    ),
  ],
  51: [
    version(
      51,
      1,
      '2026-10-10T11:00:00',
      { titulo: 'Gemelos digitales para laboratorios de redes', resumen: 'Propuesta de gemelos digitales para prácticas de redes.', palabrasClave: 'gemelos digitales, redes' },
      [documento(511, 51, 'gemelos-digitales.pdf', 1.2 * 1024 * KB, true, '2026-10-10T11:00:00')],
      { esDefinitiva: true }
    ),
  ],
};

/** Respuesta de `mis-propuestas` de ejemplo. */
export const MIS_PROPUESTAS_MOCK = [
  {
    propuesta: {
      id: 50,
      convocatoriaId: 10,
      convocatoriaTitulo: 'Convocatoria de Ponencias 2026',
      titulo: `${DATOS_50.titulo} (v2)`,
      resumen: DATOS_50.resumen,
      palabrasClave: DATOS_50.palabrasClave,
      estado: 'recibida',
      fechaEnvio: '2026-10-20T09:15:00',
      autores: AUTORES,
    },
    versionActual: 2,
    totalVersiones: 2,
    tieneVersionDefinitiva: false,
    edicionAutorizada: false,
    convocatoriaEstado: 'PUBLICADA',
    convocatoriaFechaCierre: '2099-11-30T23:59:00',
  },
  {
    propuesta: {
      id: 51,
      convocatoriaId: 11,
      convocatoriaTitulo: 'Convocatoria de Pósters 2026',
      titulo: 'Gemelos digitales para laboratorios de redes',
      resumen: 'Propuesta de gemelos digitales para prácticas de redes.',
      palabrasClave: 'gemelos digitales, redes',
      estado: 'aprobada',
      fechaEnvio: '2026-10-10T11:00:00',
      autores: AUTORES.slice(0, 1),
    },
    versionActual: 1,
    totalVersiones: 1,
    tieneVersionDefinitiva: true,
    edicionAutorizada: false,
    convocatoriaEstado: 'CERRADA',
    convocatoriaFechaCierre: '2026-10-15T23:59:00',
  },
];

const errorApi = (status, codigo, message, erroresValidacion) => {
  const err = new Error(message);
  err.response = { status, data: { status, codigo, message, erroresValidacion } };
  return err;
};

const espera = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/**
 * Crea una API simulada con estado propio (cada story parte de los mismos datos).
 * @param {{ fallarEnvio?: 'ARCHIVO_INVALIDO'|'CONVOCATORIA_CERRADA', misPropuestas?: Array<Object> }} [opciones]
 * @returns {Object} Mismos métodos de `propuestaService` que usa HU-14.
 */
export function crearPropuestasApiMock(opciones = {}) {
  const versiones = JSON.parse(JSON.stringify(VERSIONES_MOCK));
  const mias = JSON.parse(JSON.stringify(opciones.misPropuestas || MIS_PROPUESTAS_MOCK));
  let siguienteDoc = 900;

  return {
    async listarMisPropuestas() {
      await espera();
      return JSON.parse(JSON.stringify(mias));
    },

    async enviarPropuestaConDocumentos(datos, archivos) {
      await espera(600);
      if (opciones.fallarEnvio === 'CONVOCATORIA_CERRADA') {
        throw errorApi(400, 'CONVOCATORIA_CERRADA', 'La fecha de cierre de la convocatoria ya se cumplió.');
      }
      if (opciones.fallarEnvio === 'ARCHIVO_INVALIDO') {
        throw errorApi(400, 'ARCHIVO_INVALIDO', 'Uno o varios documentos no cumplen las condiciones de carga.', {
          'documentos[0]': `${archivos?.[0]?.name || 'archivo.pdf'}: el contenido del archivo no corresponde al formato .pdf.`,
        });
      }
      return {
        mensaje: `La propuesta '${datos.titulo}' fue recibida correctamente (versión 1).`,
        propuesta: { id: 99, titulo: datos.titulo, estado: 'recibida', autores: datos.autores },
        version: version(99, 1, new Date().toISOString(), datos, []),
      };
    },

    async crearNuevaVersion(propuestaId, cambios, archivos) {
      await espera(600);
      const lista = versiones[propuestaId] || [];
      const anterior = lista[lista.length - 1];
      if (anterior?.esDefinitiva || lista.some((v) => v.esDefinitiva)) {
        throw errorApi(409, 'PROPUESTA_BLOQUEADA',
          'La propuesta ya fue aprobada en versión definitiva y no puede modificarse sin autorización explícita del administrador.');
      }
      const ahora = new Date().toISOString();
      const conservados = (anterior?.documentos || []).filter(
        (d) => cambios?.documentosConservados == null || cambios.documentosConservados.includes(d.id)
      );
      const nuevos = (archivos || []).map((a, i) =>
        documento(siguienteDoc++, propuestaId, a.name, a.size, i === 0, ahora)
      );
      const docs = [...nuevos, ...conservados.map((d) => ({ ...d, id: siguienteDoc++, principal: nuevos.length === 0 && d.principal }))];
      const numero = (anterior?.numeroVersion || 0) + 1;
      const datos = {
        titulo: cambios?.titulo ?? anterior?.titulo,
        resumen: cambios?.resumen ?? anterior?.resumen,
        palabrasClave: cambios?.palabrasClave ?? anterior?.palabrasClave,
      };
      const nueva = version(propuestaId, numero, ahora, datos, docs, { notaCambio: cambios?.notaCambio || null });
      versiones[propuestaId] = [...lista, nueva];
      const mia = mias.find((m) => m.propuesta.id === propuestaId);
      if (mia) {
        mia.versionActual = numero;
        mia.totalVersiones = numero;
        mia.propuesta.titulo = datos.titulo;
        mia.propuesta.resumen = datos.resumen;
        mia.propuesta.palabrasClave = datos.palabrasClave;
      }
      return {
        mensaje: `Se registró la versión ${numero} de la propuesta. Las versiones anteriores se conservan como evidencia.`,
        propuesta: mia?.propuesta,
        version: nueva,
      };
    },

    async listarVersiones(propuestaId) {
      await espera();
      return JSON.parse(JSON.stringify(versiones[propuestaId] || []));
    },

    async descargarDocumento(propuestaId, doc) {
      await espera(200);
      console.log(`Descarga simulada: ${doc.nombreOriginal} (propuesta ${propuestaId})`);
    },

    async autorizarEdicion(propuestaId, motivo) {
      await espera();
      const mia = mias.find((m) => m.propuesta.id === propuestaId);
      if (mia?.edicionAutorizada) {
        throw errorApi(409, 'OPERACION_NO_PERMITIDA',
          'La propuesta ya tiene una autorización de edición pendiente de usar.');
      }
      if (mia) mia.edicionAutorizada = true;
      return {
        propuestaId,
        edicionAutorizada: true,
        motivo,
        mensaje: 'Se autorizó una modificación de la propuesta. La autorización se consume al crear la siguiente versión.',
      };
    },
  };
}
