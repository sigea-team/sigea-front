/**
 * @file certificadoUtils.js
 * @description Reglas de presentación de los certificados (HU-26: RF47, CU-23): etiquetas de cada rol, estado de un
 * certificado para el participante, validaciones de la plantilla (fondo y firmantes) y del porcentaje mínimo,
 * mensajes de error según los códigos del backend y descarga de los PDF.
 * @module features/certificados/certificadoUtils
 */

/** Roles con certificado. Evaluador y organizador existen en la base de datos pero aún no se emiten. */
export const TIPOS_CERTIFICADO = {
  asistente: 'Asistente',
  ponente: 'Ponente',
  conferencista: 'Conferencista',
};

export const OPCIONES_TIPO = Object.entries(TIPOS_CERTIFICADO).map(([value, label]) => ({ value, label }));

/** Límites de la plantilla; el backend los vuelve a validar. */
export const LIMITES_PLANTILLA = {
  maximoFirmantes: 4,
  fondoMb: 5,
  firmaMb: 2,
  anchoMinimoFondo: 1000,
  nombreMax: 150,
  cargoMax: 150,
};

const FORMATOS_IMAGEN = ['image/png', 'image/jpeg'];
const EXTENSIONES_IMAGEN = /\.(png|jpe?g)$/i;

export const TITULOS_ERROR = {
  CERTIFICADO_REQUISITOS_NO_CUMPLIDOS: 'No cumples los requisitos',
  CERTIFICADOS_NO_HABILITADOS: 'Certificados aún no disponibles',
  EVENTO_NO_FINALIZADO: 'El evento no ha terminado',
  CERTIFICADO_TIPO_NO_DISPONIBLE: 'Certificado no disponible',
  CONFIGURACION_CERTIFICADOS_BLOQUEADA: 'Requisito bloqueado',
  PLANTILLA_CERTIFICADO_BLOQUEADA: 'Plantilla bloqueada',
  PLANTILLA_CERTIFICADO_INCOMPLETA: 'Plantilla incompleta',
  FIRMANTES_CERTIFICADO_MAXIMO: 'Máximo de firmantes',
  CERTIFICADOS_YA_HABILITADOS: 'Ya estaban habilitados',
  CERTIFICADO_EMISION_SIMULTANEA: 'Solicitud en curso',
  EVENTO_ARCHIVADO: 'Evento en la memoria histórica',
  ARCHIVO_INVALIDO: 'Imagen no válida',
};

const MENSAJE_POR_ESTADO = {
  400: 'Revisa los datos ingresados.',
  403: 'No tienes permiso para gestionar los certificados de este evento.',
  404: 'No se encontró la información solicitada.',
  409: 'La operación no se puede realizar en el estado actual.',
  413: 'El archivo es demasiado grande.',
  500: 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.',
};

/**
 * Traduce un error de axios a { titulo, mensaje, codigo, status, campos }. El mensaje del backend se muestra tal
 * cual porque explica el motivo (p. ej. por qué no cumple los requisitos, Criterio 2).
 * @param {any} err
 */
export function interpretarErrorCertificado(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const codigo = data?.codigo;
  const campos = data?.erroresValidacion && typeof data.erroresValidacion === 'object' ? { ...data.erroresValidacion } : {};
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  let mensaje;
  if (status === 401) mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  else if (status === 403 && !mensajeBackend) mensaje = MENSAJE_POR_ESTADO[403];
  else if (mensajeBackend) mensaje = mensajeBackend;
  else if (err?.request && !err?.response) {
    mensaje = 'No fue posible conectarse con el servidor. Verifica que el backend esté activo.';
  } else {
    mensaje = MENSAJE_POR_ESTADO[status] || (status >= 500 ? MENSAJE_POR_ESTADO[500] : 'Ocurrió un error inesperado. Intenta de nuevo.');
  }
  if (Object.keys(campos).length > 0 && !mensajeBackend) {
    mensaje = Object.values(campos)[0];
  }

  return {
    titulo: TITULOS_ERROR[codigo] || (status === 403 ? 'Acceso denegado' : 'No se pudo completar la operación'),
    mensaje,
    codigo,
    status,
    campos,
  };
}

// ── Formato ──────────────────────────────────────────────────────────────────

/** Fecha `YYYY-MM-DD` (o fecha y hora ISO) del backend como fecha local, sin corrimiento de zona horaria. */
function aFecha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const texto = String(valor);
  const [anio, mes, dia] = texto.slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  if (texto.length > 10) {
    const [h = 0, m = 0] = texto.slice(11, 16).split(':').map(Number);
    return new Date(anio, mes - 1, dia, h, m);
  }
  return new Date(anio, mes - 1, dia);
}

/** «12 de noviembre de 2026». */
export function formatearFecha(valor) {
  const fecha = aFecha(valor);
  return fecha ? fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}

/** «12 de noviembre de 2026, 3:40 p. m.». */
export function formatearFechaHora(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  return `${formatearFecha(fecha)}, ${fecha.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`;
}

/** «del 10 al 12 de noviembre de 2026» o «el 10 de noviembre de 2026» si es un solo día. */
export function formatearRangoEvento(inicio, fin) {
  if (!inicio && !fin) return '';
  if (!inicio || !fin || String(inicio).slice(0, 10) === String(fin).slice(0, 10)) return `el ${formatearFecha(inicio || fin)}`;
  return `del ${formatearFecha(inicio)} al ${formatearFecha(fin)}`;
}

/** 85.714 → «85,71 %»; null → «—». */
export function formatearPorcentaje(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return `${numero.toLocaleString('es-CO', { maximumFractionDigits: 2 })} %`;
}

export const plural = (n, singular, pluralTexto = `${singular}s`) => `${n} ${n === 1 ? singular : pluralTexto}`;

export const etiquetaTipo = (tipo, descripcion) => TIPOS_CERTIFICADO[tipo] || descripcion || tipo || '—';

/** Nombre sugerido del PDF, igual al que propone el backend. */
export function nombreArchivoCertificado(certificado) {
  const tipo = certificado?.tipo || 'certificado';
  const codigo = certificado?.codigoVerificacion || certificado?.certificadoId || '';
  return `certificado-${tipo}${codigo ? `-${codigo}` : ''}.pdf`;
}

// ── Estado para el participante ──────────────────────────────────────────────

// Misma paleta de los demás estados del sistema (encuestas, eventos): marca y neutros.
const CLASES = {
  exito: 'bg-surface-muted text-ink-900 border-ink-600',
  accion: 'bg-brand-100 text-brand-700 border-brand-600',
  neutro: 'bg-white text-ink-600 border-field-border',
};

/**
 * Situación de un rol del participante en un evento:
 * - `emitido`: ya tiene el certificado (Criterio 3: siempre el mismo).
 * - `disponible`: cumple y puede obtenerlo ahora (Criterio 1).
 * - `no_cumple`: no cumple los requisitos; se muestra el motivo (Criterio 2).
 * - `en_espera`: cumple pero aún no se puede (evento sin terminar, certificados sin habilitar o evento archivado).
 * @param {Object} opcion - OpcionCertificadoResponse.
 * @param {Object} [evento] - MisCertificadosEventoResponse.
 */
export function situacionOpcion(opcion, evento) {
  if (opcion?.certificado) {
    return { id: 'emitido', etiqueta: 'Emitido', clases: CLASES.exito, texto: null };
  }
  if (!opcion?.cumpleRequisitos) {
    return { id: 'no_cumple', etiqueta: 'No cumple los requisitos', clases: CLASES.neutro, texto: opcion?.motivo || null };
  }
  if (opcion?.puedeGenerar) {
    return { id: 'disponible', etiqueta: 'Disponible', clases: CLASES.accion, texto: null };
  }
  let texto = opcion?.motivo || null;
  if (!texto && evento && !evento.certificadosHabilitados) {
    texto = 'El organizador aún no ha habilitado los certificados de este evento.';
  }
  return { id: 'en_espera', etiqueta: 'En espera', clases: CLASES.neutro, texto };
}

/** Resumen del evento para la tarjeta: cuántos certificados tiene y si queda alguno por obtener. */
export function resumenEvento(evento) {
  const opciones = evento?.opciones || [];
  const emitidos = opciones.filter((o) => o.certificado).length;
  const disponibles = opciones.filter((o) => !o.certificado && o.puedeGenerar).length;
  return { emitidos, disponibles, total: opciones.length };
}

/** Texto de la asistencia de un rol de asistente: «Asististe a 3 de 4 actividades (75 %)». */
export function textoAsistencia(opcion) {
  if (opcion?.tipo !== 'asistente' || opcion?.actividadesConsideradas === null || opcion?.actividadesConsideradas === undefined) {
    return null;
  }
  const total = Number(opcion.actividadesConsideradas);
  const asistidas = Number(opcion.actividadesAsistidas || 0);
  if (total === 0) return 'No tenías actividades inscritas con registro de asistencia.';
  return `Asististe a ${asistidas} de ${plural(total, 'actividad', 'actividades')} (${formatearPorcentaje(opcion.porcentajeAsistencia)}).`;
}

// ── Organizador ──────────────────────────────────────────────────────────────

/** El evento terminó: cerrado, o su último día ya pasó (misma regla del backend). */
export function eventoTerminado(evento, hoy = new Date()) {
  if (!evento) return false;
  if (evento.estado === 'cerrado' || evento.archivado) return true;
  if (evento.estado === 'en_configuracion' || !evento.fechaFin) return false;
  const fin = aFecha(evento.fechaFin);
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return fin < inicioHoy;
}

/**
 * Valida el porcentaje mínimo de asistencia (mayor que 0, hasta 100, máximo 2 decimales).
 * @returns {string|null} mensaje de error.
 */
export function validarPorcentaje(valor) {
  const texto = String(valor ?? '').trim().replace(',', '.');
  if (!texto) return 'Indica el porcentaje mínimo de asistencia.';
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(texto)) return 'Escribe un número con máximo 2 decimales.';
  const numero = Number(texto);
  if (numero <= 0) return 'El porcentaje mínimo debe ser mayor que 0.';
  if (numero > 100) return 'El porcentaje mínimo no puede ser mayor que 100.';
  return null;
}

export const aPorcentajeRequest = (valor) => Number(String(valor).trim().replace(',', '.'));

/**
 * Revisión previa de una imagen antes de subirla (formato y peso). Las dimensiones las valida el backend.
 * @param {File} archivo
 * @param {'fondo'|'firma'} uso
 * @returns {string|null}
 */
export function validarImagen(archivo, uso) {
  if (!archivo) return uso === 'firma' ? 'Sube la imagen de la firma.' : 'Selecciona una imagen.';
  const formatoValido = FORMATOS_IMAGEN.includes(archivo.type) || (!archivo.type && EXTENSIONES_IMAGEN.test(archivo.name || ''));
  if (!formatoValido) return 'La imagen debe ser PNG o JPG.';
  const maximoMb = uso === 'fondo' ? LIMITES_PLANTILLA.fondoMb : LIMITES_PLANTILLA.firmaMb;
  if (archivo.size > maximoMb * 1024 * 1024) return `La imagen no puede pesar más de ${maximoMb} MB.`;
  return null;
}

/**
 * Valida un firmante. Al crearlo la firma es obligatoria; al editarlo solo se revisa si se eligió una nueva.
 * @returns {Object<string,string>} errores por campo.
 */
export function validarFirmante({ nombre, cargo, firma }, esNuevo) {
  const errores = {};
  const n = (nombre || '').trim();
  const c = (cargo || '').trim();
  if (!n) errores.nombre = 'Escribe el nombre de quien firma.';
  else if (n.length > LIMITES_PLANTILLA.nombreMax) errores.nombre = `Máximo ${LIMITES_PLANTILLA.nombreMax} caracteres.`;
  if (!c) errores.cargo = 'Escribe el cargo de quien firma.';
  else if (c.length > LIMITES_PLANTILLA.cargoMax) errores.cargo = `Máximo ${LIMITES_PLANTILLA.cargoMax} caracteres.`;
  if (esNuevo || firma) {
    const errorFirma = validarImagen(firma, 'firma');
    if (errorFirma) errores.firma = errorFirma;
  }
  return errores;
}

/** Ids de los firmantes con el de la posición `indice` movido una posición (`-1` arriba, `1` abajo). */
export function moverFirmante(firmantes, indice, direccion) {
  const ids = (firmantes || []).map((f) => f.firmanteId);
  const destino = indice + direccion;
  if (indice < 0 || indice >= ids.length || destino < 0 || destino >= ids.length) return ids;
  [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
  return ids;
}

/** Errores del backend (`erroresValidacion`) al formato de los campos del formulario. */
export function erroresDeBackend(err) {
  const { campos } = interpretarErrorCertificado(err);
  return Object.fromEntries(Object.entries(campos).map(([campo, mensaje]) => [campo === 'archivo' ? 'fondo' : campo, mensaje]));
}

/** Texto del resultado de habilitar o generar: «Se emitieron 12 certificados. 3 personas no cumplen…». */
export function resumenEmision(resultado) {
  if (!resultado) return '';
  const generados = resultado.generados?.length || 0;
  const yaEmitidos = resultado.yaEmitidos || 0;
  const excluidos = resultado.excluidos?.length || 0;
  const partes = [];
  partes.push(generados === 0 ? 'No se emitieron certificados nuevos.' : `Se ${generados === 1 ? 'emitió' : 'emitieron'} ${plural(generados, 'certificado')}.`);
  if (yaEmitidos > 0) partes.push(`${plural(yaEmitidos, 'certificado')} ya ${yaEmitidos === 1 ? 'existía' : 'existían'} y no se ${yaEmitidos === 1 ? 'duplicó' : 'duplicaron'}.`);
  if (excluidos > 0) partes.push(`${plural(excluidos, 'participación', 'participaciones')} no ${excluidos === 1 ? 'cumple' : 'cumplen'} los requisitos.`);
  return partes.join(' ');
}

/** Filtra los certificados emitidos del evento por texto (nombre, documento o código) y rol. */
export function filtrarCertificados(lista, texto = '', tipo = 'todos') {
  const t = texto.trim().toLowerCase();
  return (lista || []).filter((c) => {
    if (tipo !== 'todos' && c.tipo !== tipo) return false;
    if (!t) return true;
    return [c.nombreParticipante, c.numeroDocumento, c.codigoVerificacion].some((v) => (v || '').toLowerCase().includes(t));
  });
}

/** Cuántos certificados hay de cada rol. */
export function conteoPorTipo(lista) {
  return (lista || []).reduce((acc, c) => ({ ...acc, [c.tipo]: (acc[c.tipo] || 0) + 1 }), {});
}

// ── Verificación pública ─────────────────────────────────────────────────────

/** Limpia lo que escribe o pega el usuario: espacios fuera, mayúsculas, y acepta también la URL completa. */
export function normalizarCodigo(valor) {
  let texto = String(valor || '').trim();
  const enUrl = texto.match(/verificar\/([^/?#\s]+)/i);
  if (enUrl) texto = decodeURIComponent(enUrl[1]);
  return texto.replace(/\s+/g, '').toUpperCase();
}

// ── Archivos (navegador) ─────────────────────────────────────────────────────

/** Entrega un Blob al navegador como descarga con el nombre indicado. */
export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Abre un PDF en una pestaña nueva. La pestaña se abre antes de pedir el archivo para que el navegador no la bloquee
 * (las ventanas abiertas después de esperar una respuesta se toman como emergentes). Si no se pudo abrir, se descarga.
 * @param {function(): Promise<Blob>} obtener
 * @param {string} nombre - nombre de la descarga de respaldo.
 */
export async function abrirPdf(obtener, nombre) {
  const ventana = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  try {
    const blob = await obtener();
    const pdf = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    if (ventana) {
      const url = URL.createObjectURL(pdf);
      ventana.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      descargarBlob(pdf, nombre);
    }
  } catch (err) {
    if (ventana) ventana.close();
    throw err;
  }
}
