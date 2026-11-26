import CertificadosEventoModal from './CertificadosEventoModal';
import { crearCertificadosApiMock } from '../mocks/certificadosMock';

export default {
  title: 'Features/Certificados/CertificadosEventoModal',
  component: CertificadosEventoModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {} },
};

const evento = { id: 1, nombre: 'Semana de Ingeniería de Sistemas', estado: 'cerrado', fechaInicio: '2026-11-10', fechaFin: '2026-11-12' };

/**
 * Plantilla completa (fondo y dos firmantes) en un evento que ya terminó. Prueba cambiar el porcentaje mínimo, subir o
 * quitar el fondo, agregar, editar, reordenar o quitar firmantes y la vista previa. En «Emisión», «Habilitar
 * certificados» emite los de quienes cumplen (Criterio 1) y lista a quien no cumple con su motivo (Criterio 2).
 */
export const ListaParaHabilitar = {
  args: { evento, api: crearCertificadosApiMock({ evento }) },
};

/** Plantilla sin fondo ni firmantes: se indica lo que falta y «Habilitar» queda desactivado. */
export const PlantillaIncompleta = {
  args: { evento, api: crearCertificadosApiMock({ evento, conFondo: false, firmantes: [] }) },
};

/** El evento todavía está en curso: se prepara la plantilla, pero aún no se puede habilitar. */
export const EventoEnCurso = {
  args: {
    evento: { ...evento, estado: 'en_ejecucion', fechaFin: '2099-12-31' },
    api: crearCertificadosApiMock({ evento: { ...evento, estado: 'en_ejecucion', fechaFin: '2099-12-31' } }),
  },
};

/**
 * Certificados ya habilitados: la plantilla quedó congelada y se abre la lista de emitidos. «Emitir faltantes» no
 * duplica los existentes (Criterio 3).
 */
export const Habilitados = {
  args: { evento, api: crearCertificadosApiMock({ evento, habilitada: true }) },
};

/** Evento en la memoria histórica: solo consulta y descarga. */
export const Archivado = {
  args: {
    evento: { ...evento, archivado: true },
    api: crearCertificadosApiMock({ evento: { ...evento, archivado: true }, habilitada: true }),
  },
};
