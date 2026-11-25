import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VerificarCertificadoPage from './VerificarCertificadoPage';
import { CODIGO_EJEMPLO, crearCertificadosApiMock, eventoAnteriorEjemplo } from '../features/certificados/mocks/certificadosMock';

export default {
  title: 'Pages/VerificarCertificadoPage',
  component: VerificarCertificadoPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const api = crearCertificadosApiMock({ otrosEventos: [eventoAnteriorEjemplo()] });

const conRuta = (ruta) => (
  <MemoryRouter initialEntries={[ruta]}>
    <Routes>
      <Route path="/verificar" element={<VerificarCertificadoPage api={api} />} />
      <Route path="/verificar/:codigo" element={<VerificarCertificadoPage api={api} />} />
    </Routes>
  </MemoryRouter>
);

/** Se llega con el enlace impreso en el certificado: los datos del certificado, con el documento enmascarado. */
export const Valido = () => conRuta(`/verificar/${CODIGO_EJEMPLO}`);

/** Un código que SIGEA no emitió. */
export const NoExiste = () => conRuta('/verificar/CERT-000000000000000000000000');

/** Sin código: la persona lo escribe o pega la dirección completa. */
export const SinCodigo = () => conRuta('/verificar');
