/**
 * @file certificadosMock.js
 * @description API simulada de certificados (HU-26), solo para Storybook y pruebas. Imita las reglas de
 * `CertificadoService` y `PlantillaCertificadoService` del backend sin servidor: la plantilla exige fondo y al menos
 * una firma, se puede editar hasta habilitar los certificados, al habilitar se emiten los de quienes cumplen el
 * porcentaje mínimo (los demás quedan excluidos con su motivo), un certificado nunca se duplica y su código se
 * verifica sin sesión. Devuelve los mismos códigos de error.
 * @module features/certificados/mocks/certificadosMock
 */

const espera = (ms = 150) => new Promise((r) => setTimeout(r, ms));

/** Error con la forma de axios. */
function errorApi(status, codigo, message, erroresValidacion) {
  const err = new Error(message);
  err.response = { status, data: { status, codigo, message, ...(erroresValidacion ? { erroresValidacion } : {}) } };
  return err;
}

const copia = (o) => JSON.parse(JSON.stringify(o));
const ahoraIso = () => new Date().toISOString().slice(0, 19);

const DESCRIPCION = { asistente: 'Asistente', ponente: 'Ponente', conferencista: 'Conferencista' };

/** Imagen SVG de ejemplo (fondo o firma) como Blob. */
function imagenSvg(tipo, texto = '') {
  const svg =
    tipo === 'fondo'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="850" viewBox="0 0 1100 850"><rect width="1100" height="850" fill="#fffaf5"/><rect x="24" y="24" width="1052" height="802" fill="none" stroke="#a6192e" stroke-width="10"/><rect x="44" y="44" width="1012" height="762" fill="none" stroke="#c9a15a" stroke-width="3"/><path d="M0 850 L260 850 L0 600 Z" fill="#a6192e" opacity=".85"/><path d="M1100 0 L840 0 L1100 250 Z" fill="#a6192e" opacity=".85"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120"><path d="M20 80 C 60 10, 90 110, 130 50 S 200 20, 230 70 S 300 90, 340 40" fill="none" stroke="#1f2a5a" stroke-width="5" stroke-linecap="round"/><text x="20" y="112" font-family="cursive" font-size="16" fill="#1f2a5a">${texto}</text></svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

/** PDF mínimo válido para probar la descarga y la vista previa. */
function pdfEjemplo(titulo) {
  const contenido = `BT /F1 24 Tf 72 500 Td (${titulo.replace(/[()\\]/g, '')}) Tj ET`;
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const posiciones = [];
  objetos.forEach((o, i) => {
    posiciones.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  posiciones.forEach((p) => {
    pdf += `${String(p).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

/** Participantes de ejemplo del evento 1 con su asistencia (actividades inscritas y asistidas). */
export function participantesEjemplo() {
  return [
    { personaId: 10, nombre: 'Ana María Pérez Gómez', tipoDocumento: 'CC', numeroDocumento: '1090123456', consideradas: 5, asistidas: 5 },
    { personaId: 11, nombre: 'Carlos Andrés Rojas', tipoDocumento: 'CC', numeroDocumento: '1093456789', consideradas: 5, asistidas: 4 },
    { personaId: 12, nombre: 'Laura Valentina Díaz', tipoDocumento: 'TI', numeroDocumento: '1005678123', consideradas: 4, asistidas: 1 },
    { personaId: 13, nombre: 'Jorge Iván Méndez', tipoDocumento: 'CC', numeroDocumento: '88234567', consideradas: 3, asistidas: 3, ponente: ['Taller de Spring Boot'] },
    { personaId: 14, nombre: 'Diana Carolina Ruiz', tipoDocumento: 'CC', numeroDocumento: '60345678', conferencista: true },
  ];
}

/** Código fijo del certificado de ejemplo (para verificarlo en Storybook). */
export const CODIGO_EJEMPLO = 'CERT-3F9A1C7B2E4D8F0A6B5C1D2E';

/** Evento anterior ya certificado, para «Mis certificados» (MisCertificadosEventoResponse). */
export function eventoAnteriorEjemplo() {
  return {
    eventoId: 7,
    eventoNombre: 'Congreso Regional de Software Libre 2026',
    fechaFinEvento: '2026-05-16',
    eventoFinalizado: true,
    eventoArchivado: true,
    porcentajeMinimoAsistencia: 75,
    certificadosHabilitados: true,
    opciones: [
      {
        tipo: 'asistente',
        tipoDescripcion: 'Asistente',
        cumpleRequisitos: true,
        puedeGenerar: false,
        motivo: null,
        actividadesConsideradas: 6,
        actividadesAsistidas: 6,
        porcentajeAsistencia: 100,
        actividadesACargo: [],
        certificado: {
          certificadoId: 77,
          eventoId: 7,
          eventoNombre: 'Congreso Regional de Software Libre 2026',
          fechaInicioEvento: '2026-05-14',
          fechaFinEvento: '2026-05-16',
          tipo: 'asistente',
          tipoDescripcion: 'Asistente',
          personaId: 10,
          nombreParticipante: 'Ana María Pérez Gómez',
          tipoDocumento: 'CC',
          numeroDocumento: '1090123456',
          porcentajeAsistencia: 100,
          detalle: 'Asistió a 6 de las 6 actividades.',
          fechaGeneracion: '2026-05-18T10:15:00',
          codigoVerificacion: CODIGO_EJEMPLO,
          urlDescarga: '/api/v1/certificados/77/pdf',
        },
      },
    ],
  };
}

/**
 * @param {Object} [opciones]
 * @param {Object} [opciones.evento] - Datos del evento (id, nombre, fechas, estado, archivado).
 * @param {boolean} [opciones.conFondo=true]
 * @param {Array} [opciones.firmantes] - Firmantes iniciales ({ nombre, cargo }).
 * @param {boolean} [opciones.habilitada=false] - Si los certificados ya se habilitaron.
 * @param {number} [opciones.porcentaje=80]
 * @param {number} [opciones.personaActual=10] - Persona «autenticada» para las consultas del participante.
 * @param {Array} [opciones.participantes]
 * @param {Array} [opciones.otrosEventos] - Eventos adicionales para «Mis certificados» (MisCertificadosEventoResponse).
 */
export function crearCertificadosApiMock({
  evento: eventoInicial,
  conFondo = true,
  firmantes: firmantesIniciales,
  habilitada = false,
  porcentaje = 80,
  personaActual = 10,
  participantes = participantesEjemplo(),
  otrosEventos = [],
} = {}) {
  const evento = {
    id: 1,
    nombre: 'Semana de Ingeniería de Sistemas',
    fechaInicio: '2026-11-10',
    fechaFin: '2026-11-12',
    estado: 'cerrado',
    archivado: false,
    ...eventoInicial,
  };
  const estado = {
    porcentaje,
    fondo: conFondo ? imagenSvg('fondo') : null,
    versionFondo: 1,
    firmantes: (firmantesIniciales || [
      { nombre: 'Martha Lucía Peña', cargo: 'Directora del Programa de Ingeniería de Sistemas' },
      { nombre: 'Óscar Alberto Gallardo', cargo: 'Decano de la Facultad de Ingeniería' },
    ]).map((f, i) => ({ firmanteId: 401 + i, nombre: f.nombre, cargo: f.cargo, orden: i + 1, firma: imagenSvg('firma', f.nombre), version: 1 })),
    siguienteFirmante: 401 + (firmantesIniciales?.length ?? 2),
    fechaHabilitacion: null,
    certificados: [],
    siguienteCertificado: 900,
  };

  const finalizado = () => evento.estado === 'cerrado' || evento.archivado || new Date(`${evento.fechaFin}T23:59:59`) < new Date();
  const editable = () => !evento.archivado && estado.fechaHabilitacion === null && estado.certificados.length === 0;
  const motivoNoEditable = () => {
    if (evento.archivado) return 'El evento está en la memoria histórica: su información ya no se modifica.';
    if (estado.fechaHabilitacion) return 'Los certificados ya se habilitaron: la plantilla quedó congelada para que todos sean iguales.';
    return null;
  };
  const faltantes = () => {
    const lista = [];
    if (!estado.fondo) lista.push('Suba la imagen de fondo del certificado.');
    if (estado.firmantes.length === 0) lista.push('Agregue al menos un firmante con su firma.');
    return lista;
  };
  const ruta = `/api/v1/eventos/${evento.id}/certificados/plantilla`;
  const plantilla = () => ({
    eventoId: evento.id,
    tieneFondo: Boolean(estado.fondo),
    urlFondo: estado.fondo ? `${ruta}/fondo` : null,
    firmantes: estado.firmantes.map(({ firmanteId, nombre, cargo, orden }) => ({ firmanteId, nombre, cargo, orden, urlFirma: `${ruta}/firmantes/${firmanteId}/firma` })),
    maximoFirmantes: 4,
    editable: editable(),
    motivoNoEditable: motivoNoEditable(),
    urlVistaPrevia: `${ruta}/vista-previa`,
    completa: faltantes().length === 0,
    faltantes: faltantes(),
    habilitada: Boolean(estado.fechaHabilitacion),
    fechaHabilitacion: estado.fechaHabilitacion,
  });
  const exigirEditable = () => {
    if (evento.archivado) throw errorApi(409, 'EVENTO_ARCHIVADO', motivoNoEditable());
    if (!editable()) throw errorApi(409, 'PLANTILLA_CERTIFICADO_BLOQUEADA', motivoNoEditable());
  };
  const validarImagen = (archivo, campo, maximoMb) => {
    if (!archivo) throw errorApi(400, 'ARCHIVO_INVALIDO', 'Seleccione una imagen.', { [campo]: 'Seleccione una imagen.' });
    if (archivo.size > maximoMb * 1024 * 1024) {
      const m = `La imagen no puede superar ${maximoMb} MB.`;
      throw errorApi(400, 'ARCHIVO_INVALIDO', m, { [campo]: m });
    }
  };
  const ordenar = () => estado.firmantes.forEach((f, i) => { f.orden = i + 1; });

  /** Evaluación de los roles de una persona, igual que el backend. */
  const evaluar = (p) => {
    const lista = [];
    if (p.consideradas !== undefined) {
      const pct = p.consideradas === 0 ? 0 : Math.floor((p.asistidas / p.consideradas) * 10000) / 100;
      const cumple = p.consideradas > 0 && pct >= estado.porcentaje;
      lista.push({
        tipo: 'asistente',
        cumple,
        consideradas: p.consideradas,
        asistidas: p.asistidas,
        porcentaje: pct,
        motivo: cumple
          ? null
          : p.consideradas === 0
          ? 'No te inscribiste en actividades con registro de asistencia.'
          : `Asististe a ${p.asistidas} de las ${p.consideradas} actividades en las que te inscribiste (${pct.toLocaleString('es-CO')} %); el mínimo es ${estado.porcentaje} %.`,
      });
    }
    if (p.ponente?.length) lista.push({ tipo: 'ponente', cumple: true, aCargo: p.ponente });
    if (p.conferencista) lista.push({ tipo: 'conferencista', cumple: true, aCargo: [] });
    return lista;
  };

  const certificadoDe = (p, e) => ({
    certificadoId: estado.siguienteCertificado++,
    eventoId: evento.id,
    eventoNombre: evento.nombre,
    fechaInicioEvento: evento.fechaInicio,
    fechaFinEvento: evento.fechaFin,
    tipo: e.tipo,
    tipoDescripcion: DESCRIPCION[e.tipo],
    personaId: p.personaId,
    nombreParticipante: p.nombre,
    tipoDocumento: p.tipoDocumento,
    numeroDocumento: p.numeroDocumento,
    porcentajeAsistencia: e.tipo === 'asistente' ? e.porcentaje : null,
    detalle: e.tipo === 'asistente' ? `Asistió a ${e.asistidas} de las ${e.consideradas} actividades.` : (e.aCargo || []).join(', ') || null,
    fechaGeneracion: ahoraIso(),
    codigoVerificacion: `CERT-${Math.random().toString(16).slice(2, 10).toUpperCase()}${String(estado.siguienteCertificado).padStart(4, '0')}`,
    urlDescarga: `/api/v1/certificados/${estado.siguienteCertificado - 1}/pdf`,
  });

  const existente = (personaId, tipo) => estado.certificados.find((c) => c.personaId === personaId && c.tipo === tipo);

  const emitirTodos = () => {
    const generados = [];
    const excluidos = [];
    let yaEmitidos = 0;
    participantes.forEach((p) => {
      evaluar(p).forEach((e) => {
        if (existente(p.personaId, e.tipo)) {
          yaEmitidos += 1;
        } else if (e.cumple) {
          const c = certificadoDe(p, e);
          estado.certificados.push(c);
          generados.push(c);
        } else {
          excluidos.push({ personaId: p.personaId, nombre: p.nombre, numeroDocumento: p.numeroDocumento, tipo: e.tipo, motivo: e.motivo });
        }
      });
    });
    return { generados, yaEmitidos, excluidos };
  };

  if (habilitada) {
    estado.fechaHabilitacion = '2026-11-13T09:30:00';
    emitirTodos();
  }

  const misCertificadosEvento = () => {
    const p = participantes.find((x) => x.personaId === personaActual);
    const opciones = (p ? evaluar(p) : []).map((e) => {
      const certificado = existente(personaActual, e.tipo) || null;
      const enEspera = !finalizado()
        ? `Disponible cuando termine el evento (${evento.fechaFin.split('-').reverse().join('/')}).`
        : !estado.fechaHabilitacion
        ? 'El organizador aún no ha habilitado los certificados de este evento.'
        : evento.archivado
        ? 'El evento está en la memoria histórica.'
        : null;
      return {
        tipo: e.tipo,
        tipoDescripcion: DESCRIPCION[e.tipo],
        cumpleRequisitos: e.cumple,
        puedeGenerar: e.cumple && !certificado && !enEspera,
        motivo: e.cumple ? (certificado ? null : enEspera) : e.motivo,
        actividadesConsideradas: e.consideradas ?? null,
        actividadesAsistidas: e.asistidas ?? null,
        porcentajeAsistencia: e.porcentaje ?? null,
        actividadesACargo: e.aCargo || [],
        certificado: certificado ? copia(certificado) : null,
      };
    });
    return {
      eventoId: evento.id,
      eventoNombre: evento.nombre,
      fechaFinEvento: evento.fechaFin,
      eventoFinalizado: finalizado(),
      eventoArchivado: Boolean(evento.archivado),
      porcentajeMinimoAsistencia: estado.porcentaje,
      certificadosHabilitados: Boolean(estado.fechaHabilitacion),
      opciones,
    };
  };

  return {
    evento,
    _estado: estado,

    // Participante
    async listarMisEventos() {
      await espera();
      const propio = misCertificadosEvento();
      return copia([...(propio.eventoFinalizado && propio.opciones.length ? [propio] : []), ...otrosEventos]);
    },
    async listarMisCertificados() {
      await espera();
      const otros = otrosEventos.flatMap((e) => e.opciones.map((o) => o.certificado).filter(Boolean));
      return copia([...estado.certificados.filter((c) => c.personaId === personaActual), ...otros]);
    },
    async consultarMisCertificados() {
      await espera();
      return copia(misCertificadosEvento());
    },
    async solicitarCertificado(eventoId, tipo) {
      await espera(250);
      const p = participantes.find((x) => x.personaId === personaActual);
      const e = p && evaluar(p).find((x) => x.tipo === tipo);
      const ya = existente(personaActual, tipo);
      if (ya) return { generadoAhora: false, mensaje: 'Ya tenías este certificado; se entrega el mismo.', certificado: copia(ya) };
      if (!finalizado()) throw errorApi(409, 'EVENTO_NO_FINALIZADO', 'El evento aún no ha terminado.');
      if (!estado.fechaHabilitacion) throw errorApi(409, 'CERTIFICADOS_NO_HABILITADOS', 'El organizador aún no ha habilitado los certificados de este evento.');
      if (!e || !e.cumple) throw errorApi(409, 'CERTIFICADO_REQUISITOS_NO_CUMPLIDOS', e?.motivo || 'No participaste en este evento con ese rol.');
      const c = certificadoDe(p, e);
      estado.certificados.push(c);
      return { generadoAhora: true, mensaje: 'Certificado generado.', certificado: copia(c) };
    },
    async descargarCertificado(certificadoId) {
      await espera();
      const c = estado.certificados.find((x) => x.certificadoId === certificadoId);
      return pdfEjemplo(c ? `Certificado ${c.codigoVerificacion}` : 'Certificado');
    },

    // Organizador
    async listarCertificadosEvento() {
      await espera();
      return copia(estado.certificados);
    },
    async habilitarCertificados() {
      await espera(400);
      if (evento.archivado) throw errorApi(409, 'EVENTO_ARCHIVADO', motivoNoEditable());
      if (estado.fechaHabilitacion) throw errorApi(409, 'CERTIFICADOS_YA_HABILITADOS', 'Los certificados de este evento ya están habilitados.');
      if (!finalizado()) throw errorApi(409, 'EVENTO_NO_FINALIZADO', `Los certificados se habilitan cuando termina el evento (${evento.fechaFin}).`);
      if (faltantes().length) throw errorApi(409, 'PLANTILLA_CERTIFICADO_INCOMPLETA', `La plantilla está incompleta: ${faltantes().join(' ')}`);
      estado.fechaHabilitacion = ahoraIso();
      return copia({ eventoId: evento.id, fechaHabilitacion: estado.fechaHabilitacion, ...emitirTodos() });
    },
    async generarCertificadosEvento() {
      await espera(300);
      if (evento.archivado) throw errorApi(409, 'EVENTO_ARCHIVADO', motivoNoEditable());
      if (!estado.fechaHabilitacion) throw errorApi(409, 'CERTIFICADOS_NO_HABILITADOS', 'Primero habilite los certificados del evento.');
      return copia({ eventoId: evento.id, ...emitirTodos() });
    },
    async consultarConfiguracion() {
      await espera();
      const asistentes = estado.certificados.filter((c) => c.tipo === 'asistente').length;
      const bloqueada = evento.archivado || asistentes > 0 || Boolean(estado.fechaHabilitacion);
      return {
        eventoId: evento.id,
        porcentajeMinimoAsistencia: estado.porcentaje,
        editable: !bloqueada,
        motivoNoEditable: evento.archivado
          ? motivoNoEditable()
          : bloqueada
          ? 'Ya se emitieron certificados de asistente con este porcentaje; cambiarlo haría que no todos se evaluaran igual.'
          : null,
        certificadosEmitidos: estado.certificados.length,
      };
    },
    async actualizarConfiguracion(eventoId, valor) {
      await espera(200);
      const config = await this.consultarConfiguracion();
      if (!config.editable) throw errorApi(409, 'CONFIGURACION_CERTIFICADOS_BLOQUEADA', config.motivoNoEditable);
      estado.porcentaje = valor;
      return this.consultarConfiguracion();
    },

    // Plantilla
    async consultarPlantilla() {
      await espera();
      return copia(plantilla());
    },
    async vistaPrevia(eventoId, tipo = 'asistente') {
      await espera(300);
      return pdfEjemplo(`Vista previa - ${DESCRIPCION[tipo] || tipo}`);
    },
    async imagenFondo() {
      await espera(80);
      if (!estado.fondo) throw errorApi(404, 'NO_ENCONTRADO', 'El evento no tiene imagen de fondo.');
      return estado.fondo;
    },
    async subirFondo(eventoId, archivo) {
      await espera(300);
      exigirEditable();
      validarImagen(archivo, 'fondo', 5);
      estado.fondo = archivo;
      estado.versionFondo += 1;
      return copia(plantilla());
    },
    async eliminarFondo() {
      await espera(200);
      exigirEditable();
      estado.fondo = null;
      return copia(plantilla());
    },
    async imagenFirma(eventoId, firmanteId) {
      await espera(80);
      const f = estado.firmantes.find((x) => x.firmanteId === firmanteId);
      if (!f) throw errorApi(404, 'NO_ENCONTRADO', 'Firmante no encontrado.');
      return f.firma;
    },
    async agregarFirmante(eventoId, { nombre, cargo, firma }) {
      await espera(250);
      exigirEditable();
      if (estado.firmantes.length >= 4) throw errorApi(409, 'FIRMANTES_CERTIFICADO_MAXIMO', 'El certificado admite máximo 4 firmantes.');
      validarImagen(firma, 'firma', 2);
      estado.firmantes.push({ firmanteId: estado.siguienteFirmante++, nombre: nombre.trim(), cargo: cargo.trim(), orden: 0, firma, version: 1 });
      ordenar();
      return copia(plantilla());
    },
    async actualizarFirmante(eventoId, firmanteId, { nombre, cargo, firma }) {
      await espera(250);
      exigirEditable();
      const f = estado.firmantes.find((x) => x.firmanteId === firmanteId);
      if (!f) throw errorApi(404, 'NO_ENCONTRADO', 'Firmante no encontrado.');
      if (firma) {
        validarImagen(firma, 'firma', 2);
        f.firma = firma;
        f.version += 1;
      }
      f.nombre = nombre.trim();
      f.cargo = cargo.trim();
      return copia(plantilla());
    },
    async eliminarFirmante(eventoId, firmanteId) {
      await espera(200);
      exigirEditable();
      estado.firmantes = estado.firmantes.filter((x) => x.firmanteId !== firmanteId);
      ordenar();
      return copia(plantilla());
    },
    async reordenarFirmantes(eventoId, firmanteIds) {
      await espera(150);
      exigirEditable();
      estado.firmantes = firmanteIds.map((id) => estado.firmantes.find((f) => f.firmanteId === id));
      ordenar();
      return copia(plantilla());
    },

    // Público
    async verificarCertificado(codigo) {
      await espera(250);
      const todos = [...estado.certificados, ...otrosEventos.flatMap((e) => e.opciones.map((o) => o.certificado).filter(Boolean))];
      const c = todos.find((x) => x.codigoVerificacion === codigo);
      if (!c) throw errorApi(404, 'NO_ENCONTRADO', 'No existe un certificado con ese código de verificación.');
      return {
        codigoVerificacion: c.codigoVerificacion,
        nombreParticipante: c.nombreParticipante,
        documento: `${c.tipoDocumento} ${'*'.repeat(Math.max(0, c.numeroDocumento.length - 2))}${c.numeroDocumento.slice(-2)}`,
        tipo: c.tipo,
        tipoDescripcion: c.tipoDescripcion,
        eventoNombre: c.eventoNombre,
        fechaInicioEvento: c.fechaInicioEvento,
        fechaFinEvento: c.fechaFinEvento,
        fechaGeneracion: c.fechaGeneracion,
      };
    },
  };
}
