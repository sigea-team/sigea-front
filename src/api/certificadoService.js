import { httpClient } from './httpClient';
import { validarBlob } from '../features/certificados/certificadoUtils';

/**
 * @file certificadoService.js
 * @description Cliente de la API de certificados (HU-26: RF47, CU-23).
 *
 * - Participante: estado de sus certificados por evento, solicitud (sin duplicar) y descarga del PDF.
 * - Organizador: plantilla del evento (fondo y firmantes), porcentaje mínimo de asistencia, habilitación de los
 *   certificados (congela la plantilla y emite los de quienes cumplen) y listado de los emitidos.
 * - Público: verificación de un certificado por su código, sin iniciar sesión.
 *
 * Los PDF y las imágenes se piden como `blob` porque los endpoints exigen el token (un enlace directo no lo envía).
 * @module api/certificadoService
 */

const base = (eventoId) => `/eventos/${eventoId}/certificados`;
const plantilla = (eventoId) => `${base(eventoId)}/plantilla`;

/**
 * Cuando una petición `blob` falla, axios entrega el cuerpo del error también como Blob. Se convierte a JSON para que
 * el mensaje y el código del backend lleguen igual que en las demás peticiones.
 */
async function conErrorLegible(peticion) {
  try {
    return await peticion();
  } catch (err) {
    const datos = err?.response?.data;
    if (datos && typeof Blob !== 'undefined' && datos instanceof Blob) {
      try {
        err.response.data = JSON.parse(await datos.text());
      } catch {
        err.response.data = {};
      }
    }
    throw err;
  }
}

const comoBlob = (url, params, esperado) =>
  conErrorLegible(async () => {
    const { data } = await httpClient.get(url, { params, responseType: 'blob' });
    return validarBlob(data, esperado);
  });

const formulario = (campos) => {
  const datos = new FormData();
  Object.entries(campos).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null) datos.append(clave, valor);
  });
  return datos;
};

// Igual que en propuestaService: con este encabezado axios deja el FormData tal cual y se agrega el boundary.
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

// ── Participante ─────────────────────────────────────────────────────────────

/**
 * Eventos terminados en los que participó el usuario, con el estado de sus certificados en cada uno.
 * Endpoint: GET /api/v1/certificados/mios/eventos
 * @returns {Promise<Array<Object>>}
 */
export async function listarMisEventos() {
  const { data } = await httpClient.get('/certificados/mios/eventos');
  return Array.isArray(data) ? data : [];
}

/**
 * Certificados emitidos al usuario en todos los eventos, del más reciente al más antiguo.
 * Endpoint: GET /api/v1/certificados/mios
 * @returns {Promise<Array<Object>>}
 */
export async function listarMisCertificados() {
  const { data } = await httpClient.get('/certificados/mios');
  return Array.isArray(data) ? data : [];
}

/**
 * Estado de los certificados del usuario en un evento (roles, requisitos y motivo si no cumple).
 * Endpoint: GET /api/v1/eventos/{eventoId}/certificados/mios
 */
export async function consultarMisCertificados(eventoId) {
  const { data } = await httpClient.get(`${base(eventoId)}/mios`);
  return data;
}

/**
 * Genera el certificado del rol indicado o entrega el que ya tenía (Criterio 3, sin duplicar).
 * Endpoint: POST /api/v1/eventos/{eventoId}/certificados/mios
 * @returns {Promise<{generadoAhora: boolean, mensaje: string, certificado: Object}>}
 */
export async function solicitarCertificado(eventoId, tipo) {
  const { data } = await httpClient.post(`${base(eventoId)}/mios`, { tipo });
  return data;
}

/**
 * PDF de un certificado (su titular o quien gestiona certificados).
 * Endpoint: GET /api/v1/certificados/{certificadoId}/pdf
 * @returns {Promise<Blob>}
 */
export function descargarCertificado(certificadoId) {
  return comoBlob(`/certificados/${certificadoId}/pdf`, undefined, 'pdf');
}

// ── Organizador ──────────────────────────────────────────────────────────────

/** Certificados emitidos del evento. Endpoint: GET /api/v1/eventos/{eventoId}/certificados */
export async function listarCertificadosEvento(eventoId) {
  const { data } = await httpClient.get(base(eventoId));
  return Array.isArray(data) ? data : [];
}

/**
 * Congela la plantilla y emite los certificados de quienes cumplen los requisitos.
 * Endpoint: POST /api/v1/eventos/{eventoId}/certificados/habilitar
 */
export async function habilitarCertificados(eventoId) {
  const { data } = await httpClient.post(`${base(eventoId)}/habilitar`);
  return data;
}

/**
 * Emite los que falten después de habilitar (p. ej. una asistencia registrada tarde). No duplica los existentes.
 * Endpoint: POST /api/v1/eventos/{eventoId}/certificados/generar
 */
export async function generarCertificadosEvento(eventoId) {
  const { data } = await httpClient.post(`${base(eventoId)}/generar`);
  return data;
}

/** Porcentaje mínimo de asistencia. Endpoint: GET /api/v1/eventos/{eventoId}/certificados/configuracion */
export async function consultarConfiguracion(eventoId) {
  const { data } = await httpClient.get(`${base(eventoId)}/configuracion`);
  return data;
}

/** Endpoint: PUT /api/v1/eventos/{eventoId}/certificados/configuracion */
export async function actualizarConfiguracion(eventoId, porcentajeMinimoAsistencia) {
  const { data } = await httpClient.put(`${base(eventoId)}/configuracion`, { porcentajeMinimoAsistencia });
  return data;
}

// ── Plantilla ────────────────────────────────────────────────────────────────

/** Endpoint: GET /api/v1/eventos/{eventoId}/certificados/plantilla */
export async function consultarPlantilla(eventoId) {
  const { data } = await httpClient.get(plantilla(eventoId));
  return data;
}

/**
 * PDF de ejemplo con la plantilla actual y datos ficticios.
 * Endpoint: GET /api/v1/eventos/{eventoId}/certificados/plantilla/vista-previa?tipo=
 * @returns {Promise<Blob>}
 */
export function vistaPrevia(eventoId, tipo = 'asistente') {
  return comoBlob(`${plantilla(eventoId)}/vista-previa`, { tipo }, 'pdf');
}

/**
 * Imagen de fondo ya procesada. `version` evita que el navegador muestre una copia vieja tras reemplazarla.
 * Endpoint: GET /api/v1/eventos/{eventoId}/certificados/plantilla/fondo
 */
export function imagenFondo(eventoId, version) {
  return comoBlob(`${plantilla(eventoId)}/fondo`, version ? { v: version } : undefined, 'imagen');
}

/** Endpoint: PUT /api/v1/eventos/{eventoId}/certificados/plantilla/fondo (multipart «archivo») */
export async function subirFondo(eventoId, archivo) {
  const { data } = await httpClient.put(`${plantilla(eventoId)}/fondo`, formulario({ archivo }), MULTIPART);
  return data;
}

/** Endpoint: DELETE /api/v1/eventos/{eventoId}/certificados/plantilla/fondo */
export async function eliminarFondo(eventoId) {
  const { data } = await httpClient.delete(`${plantilla(eventoId)}/fondo`);
  return data;
}

/** Endpoint: GET /api/v1/eventos/{eventoId}/certificados/plantilla/firmantes/{firmanteId}/firma */
export function imagenFirma(eventoId, firmanteId, version) {
  return comoBlob(`${plantilla(eventoId)}/firmantes/${firmanteId}/firma`, version ? { v: version } : undefined, 'imagen');
}

/** Endpoint: POST /api/v1/eventos/{eventoId}/certificados/plantilla/firmantes (multipart nombre, cargo, firma) */
export async function agregarFirmante(eventoId, { nombre, cargo, firma }) {
  const { data } = await httpClient.post(`${plantilla(eventoId)}/firmantes`, formulario({ nombre, cargo, firma }), MULTIPART);
  return data;
}

/**
 * Cambia nombre y cargo; la firma solo se reemplaza si se envía un archivo nuevo.
 * Endpoint: PUT /api/v1/eventos/{eventoId}/certificados/plantilla/firmantes/{firmanteId}
 */
export async function actualizarFirmante(eventoId, firmanteId, { nombre, cargo, firma }) {
  const { data } = await httpClient.put(
    `${plantilla(eventoId)}/firmantes/${firmanteId}`,
    formulario({ nombre, cargo, firma: firma || undefined }),
    MULTIPART
  );
  return data;
}

/** Endpoint: DELETE /api/v1/eventos/{eventoId}/certificados/plantilla/firmantes/{firmanteId} */
export async function eliminarFirmante(eventoId, firmanteId) {
  const { data } = await httpClient.delete(`${plantilla(eventoId)}/firmantes/${firmanteId}`);
  return data;
}

/** Endpoint: PUT /api/v1/eventos/{eventoId}/certificados/plantilla/firmantes/orden */
export async function reordenarFirmantes(eventoId, firmanteIds) {
  const { data } = await httpClient.put(`${plantilla(eventoId)}/firmantes/orden`, { firmanteIds });
  return data;
}

// ── Público ──────────────────────────────────────────────────────────────────

/**
 * Verifica un certificado por su código (sin sesión). 404 si no existe.
 * Endpoint: GET /api/v1/publico/certificados/{codigo}
 */
export async function verificarCertificado(codigo) {
  const { data } = await httpClient.get(`/publico/certificados/${encodeURIComponent(codigo)}`);
  return data;
}

export const certificadoService = {
  listarMisEventos,
  listarMisCertificados,
  consultarMisCertificados,
  solicitarCertificado,
  descargarCertificado,
  listarCertificadosEvento,
  habilitarCertificados,
  generarCertificadosEvento,
  consultarConfiguracion,
  actualizarConfiguracion,
  consultarPlantilla,
  vistaPrevia,
  imagenFondo,
  subirFondo,
  eliminarFondo,
  imagenFirma,
  agregarFirmante,
  actualizarFirmante,
  eliminarFirmante,
  reordenarFirmantes,
  verificarCertificado,
};
