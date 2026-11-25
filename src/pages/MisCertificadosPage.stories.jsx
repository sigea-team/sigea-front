import MisCertificadosPage from './MisCertificadosPage';
import { crearCertificadosApiMock, eventoAnteriorEjemplo } from '../features/certificados/mocks/certificadosMock';

export default {
  title: 'Pages/MisCertificadosPage',
  component: MisCertificadosPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = {
  nombreCompleto: 'Ana Pérez',
  correo: 'ana.perez@ufps.edu.co',
  roles: ['PARTICIPANTE'],
  modoIngreso: 'ASISTENTE',
};

/** Certificados habilitados: los descarga (Criterio 1) y cada uno tiene su código de verificación. */
export const ConCertificados = {
  args: { api: crearCertificadosApiMock({ habilitada: true, otrosEventos: [eventoAnteriorEjemplo()] }), usuarioProp: usuario },
};

/** Cumple, pero el organizador aún no ha habilitado los certificados del evento. */
export const SinHabilitar = {
  args: { api: crearCertificadosApiMock({ otrosEventos: [eventoAnteriorEjemplo()] }), usuarioProp: usuario },
};

/** No cumple el porcentaje mínimo: se muestra el motivo y no se emite nada (Criterio 2). */
export const NoCumple = {
  args: { api: crearCertificadosApiMock({ habilitada: true, personaActual: 12 }), usuarioProp: usuario },
};

/** Ponente con certificado de asistente y de ponente en el mismo evento. */
export const PonenteYAsistente = {
  args: { api: crearCertificadosApiMock({ habilitada: true, personaActual: 13 }), usuarioProp: usuario },
};

/** No ha participado en eventos terminados. */
export const SinEventos = {
  args: { api: crearCertificadosApiMock({ personaActual: 99 }), usuarioProp: usuario },
};
