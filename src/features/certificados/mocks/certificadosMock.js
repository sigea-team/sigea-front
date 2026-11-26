/**
 * @file certificadosMock.js
 * @description API simulada de certificados (HU-26), solo para Storybook y pruebas. Imita las reglas de
 * `CertificadoService` y `PlantillaCertificadoService` del backend sin servidor: la plantilla exige fondo y al menos
 * una firma, se puede editar hasta habilitar los certificados, al habilitar se emiten los de quienes cumplen el
 * porcentaje mínimo (los demás quedan excluidos con su motivo), un certificado nunca se duplica y su código se
 * verifica sin sesión. Devuelve los mismos códigos de error, solo acepta imágenes PNG o JPG y entrega los archivos
 * con los mismos tipos y validaciones (`validarBlob`) que el servicio real.
 * @module features/certificados/mocks/certificadosMock
 */

import { validarBlob } from '../certificadoUtils';

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

// Imágenes de ejemplo en los mismos formatos que entrega el backend: el fondo ya procesado es JPEG y la firma PNG
// con transparencia (ProcesadorImagenesCertificado). Así pasan por las mismas validaciones que las reales.
const FONDO_JPEG_BASE64 =
  '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LlmHm9irsU9EzTRp/dX/ABTH3+sPOs8/UOKzevk9NjDRGjU01aYn76avz0x/hxsdOZ5hiJv4u3fu3JiI0zbmNER9oiI0Q4/M8Vs17glz13Mz1/5/56LX7M4ywW8m/wCos7tV/wCyUvmeK2a9wSrZTRVbxdqmumqmqMNOmKo0T1ksqtm16Ymj8QgFN3tCbfweL59cxGGu26OXER0/XRoj+P4Uh11UxVu/NROCbqc12m14fE1Oa7Ta8PipCdPufr7m6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4mpzXabXh8VINPufpm6TdTmu02vD4vzXRmduiquvF2KaKYmaqqtEREfmehycyzLDZXhecYqqaaNPJpimmZmqrRM6I8Pv0PN87z7FZzXTF3RbsUTM0WqPp/efzOjo0/7RplFURT7n66bFmq7OOGELV79WzOsta29VTOmnlUURTpj8xPRMf7Sia/J9lvePySxhMY7y9Sn+einx/FTX5Pst7x+Rr8n2W94/JLDKrSjmfqpr8n2W94/Jth8fluGuTXZw96mqY0afr0f5lFHzKTaifyZn6AKav/2Q==';
const FIRMA_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAWgAAAB4CAYAAADfRGj6AAAFKklEQVR42u3dwXHcMBAEwDMT0V8hKUCHpL8jkb8ql63iySQwu9v900/Hww0HIEg+HgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABs8PL69vHy+vbhSAAVHJPC+au/AQS0cAYQ0M8GN4CAFsIAswP6TDgLcEBAAyCgn23GWjQgoAPC+df7zx++dkBAh/kqnLVoQEBvas+fw1mLxh2vCOhiW+r8KEgaw8Yjx9SlDS2aCgVDSAvoMUsbWjQVZ3/GpIAeubShReOOWAT0I2/Xhh8D1cLXuBTQ45Y2tGhSx+/fxqaQFtCmfX4IhIxfBUJAP6YvbfgRkHy3659/Kw8CesyuDS2aio8iMDYF9KilDS3aHW7JMz/r0QJ67K4NTcVrwyrM/IS0gB69tKFFPxfOwmH92BXSAtpmfT8Axyb4OAlpAf2YurShRfvhV3g+uZAW0ON2bQgqd7hVenmEkO5fZg4tTot2Aqs76xPSvcf/YZALoatmLIJhz6xPSOdsPb36uB8GuRb97I9bSOeNW7O+nrPGw7RZi/5OCAiEvDHilvCMG7auPO6HpQ2t5LvN71/HZ3IwpL1RXkivn11e+T0fpogG/R2fy66XnFIhpNc85uCO7/gwRdSir35GhGDYO4aEdO3WXHaJIyksuw34q58RMS0Y0mZ8Qrpua44O6MSlje4t+oofrl0vecdESNdszbEBXW3wdB/sV734oPNxSv9sQrpeay63xJHQzro2xFXtr2MopO3YENI9WnNkQCfv2ugaPKtffNApFKqEs5Cu15rjArrKQJmyznrHQ3wsCwlprbnZEkeVQKw4yO+esXQ+mVWd7dk2WqM1RwV0tcHeYYCvOqF0vGhYOZzdEl6jNccE9JQ1SdPz3rMO41drHrXEkd5GKrfopKesVQqFahcFrUfXbc0RAd1hqlhtgKc8Za1aKHQL50khXbE1bw9oywHzPkvHi1MdPlPnkK7ammOXOFyA6z1jqXjRsONMr3tIV2/NWwO604C3DfAx8uUMU2YDHS/kVmjN2wJ6+pPNnGDqrEdPvIGjckh3as1xSxzdLrRogbVDuutFwa4h3a01bwnoSdPFCkHjxCacq4d019a8PKA9f8H/W/2i4bRbpKs/pKxya45Z4vAgfDOWpGM3bZZX8ZbwCa15aUBPGfRex1V7PVo41y0d3VrzsoD2vFkvwK0Q0sZp9nr0tNa8fYmj68FM+FxVm+Cu/89FweyQntialwS0KWPeYK56grvrcwnn3JCe3JpvD+jJU8YqrztykrNjIzWkp7fmbUsckwf+3QHTZcayaj3aDC8vpLXmBQFt4K//rN1mLHeHtDGaF9Ja84KAdjU86/i4hd4YTQ9prTlgiWPiAV71mTu3wasvGroomBXSWvPCgDZtXN/gJrfBZz+7cM4pIlrzhoB2tssZZFPe9nLFCcqYXXtLuNa8eYnj8wF2oF3oSghps7v9Y1xrDluDdrDvOw4eJu9EVmk9Wmtu8k5CLdpJ8cqLhnZs5F80FMwCulWL1gjPT6mFQu5Y15oF9KidCALg3JRaKOwPad+BgB61o8PbPjTnCt+R1iyg27ZoSxv/97kFw57vyI4uAT12J4LjeX6909HyNEUBzdIdHQY+CGg2tglLGy5IIaAJbNGWNr4X0tY96cIADgrks880EDygQbMxtIUzIKCbv9oJENB40zQgoGfu6BDOIKABENCcbcbaMwho3CYLCGiEMCCgCwe24AYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMvwGddwBRWnDQ5sAAAAASUVORK5CYII=';

function desdeBase64(base64, type) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Imagen de ejemplo como Blob: fondo JPEG o firma PNG. */
function imagenEjemplo(tipo) {
  return tipo === 'fondo' ? desdeBase64(FONDO_JPEG_BASE64, 'image/jpeg') : desdeBase64(FIRMA_PNG_BASE64, 'image/png');
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
    fondo: conFondo ? imagenEjemplo('fondo') : null,
    versionFondo: 1,
    firmantes: (firmantesIniciales || [
      { nombre: 'Martha Lucía Peña', cargo: 'Directora del Programa de Ingeniería de Sistemas' },
      { nombre: 'Óscar Alberto Gallardo', cargo: 'Decano de la Facultad de Ingeniería' },
    ]).map((f, i) => ({ firmanteId: 401 + i, nombre: f.nombre, cargo: f.cargo, orden: i + 1, firma: imagenEjemplo('firma'), version: 1 })),
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
    // Igual que el backend: solo PNG o JPG.
    if (!['image/png', 'image/jpeg'].includes(archivo.type)) {
      const m = 'La imagen debe ser PNG o JPG.';
      throw errorApi(400, 'ARCHIVO_INVALIDO', m, { [campo]: m });
    }
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
      return validarBlob(pdfEjemplo(c ? `Certificado ${c.codigoVerificacion}` : 'Certificado'), 'pdf');
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
      return validarBlob(pdfEjemplo(`Vista previa - ${DESCRIPCION[tipo] || tipo}`), 'pdf');
    },
    async imagenFondo() {
      await espera(80);
      if (!estado.fondo) throw errorApi(404, 'NO_ENCONTRADO', 'El evento no tiene imagen de fondo.');
      return validarBlob(estado.fondo, 'imagen');
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
      return validarBlob(f.firma, 'imagen');
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
