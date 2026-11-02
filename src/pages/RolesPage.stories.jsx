import { MemoryRouter } from 'react-router-dom';
import RolesPage from './RolesPage';
import { crearRolesApiMock } from '../features/roles/mocks/rolesMock';

export default {
  title: 'Pages/RolesPage',
  component: RolesPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/roles']}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

/** Roles y usuarios servidos por una API en memoria con el mismo contrato que el backend. */
export const ConDatos = {
  render: () => <RolesPage api={crearRolesApiMock()} />,
};

/** Error del backend al cargar. */
export const ErrorDeCarga = {
  render: () => {
    const falla = () => Promise.reject({ response: { status: 500, data: { message: 'Error interno del servidor.' } } });
    const api = { ...crearRolesApiMock(), listarRoles: falla };
    return <RolesPage api={api} />;
  },
};
