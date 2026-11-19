import CodigoQrInscripcion from './CodigoQrInscripcion';
import { EVENTO_ASISTENCIA_MOCK, crearAsistenciaApiMock } from '../mocks/asistenciaMock';

export default {
  title: 'Features/Asistencia/CodigoQrInscripcion',
  component: CodigoQrInscripcion,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl p-6"><Story /></div>],
};

/** Criterio 1: el participante inscrito ve su QR, lo descarga o copia el código. La imagen es simulada. */
export const ConCodigo = {
  args: {
    eventoId: EVENTO_ASISTENCIA_MOCK.id,
    eventoNombre: EVENTO_ASISTENCIA_MOCK.nombre,
    codigoInicial: 'SIGEA-4f1c2a7be04d4c6b8a3e51d7c2f09b44',
    api: crearAsistenciaApiMock(),
  },
};

/** Criterio 4: «Reenviar a mi correo» informa que no se pudo enviar, sin cambiar el código. */
export const ReenvioFallido = {
  args: { ...ConCodigo.args, api: crearAsistenciaApiMock({ correoEnviado: false }) },
};

/** La imagen no carga: se muestra el código en texto y la opción de reintentar. */
export const SinImagen = {
  args: { ...ConCodigo.args, api: crearAsistenciaApiMock({ falloImagen: true }) },
};

/** Inscripción sin `codigoQr` en la respuesta: el componente lo consulta. */
export const ConsultaElCodigo = {
  args: { ...ConCodigo.args, codigoInicial: undefined },
};
