import ConferencistaForm from './ConferencistaForm';
import { crearConferencistasApiMock } from '../mocks/conferencistasMock';
import { aActualizarRequest, aCompletarRequest, formularioDesdeInvitacion } from '../conferencistaUtils';

export default {
  title: 'Features/Conferencistas/ConferencistaForm',
  component: ConferencistaForm,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-3xl p-6 bg-white"><Story /></div>],
};

const api = crearConferencistasApiMock();

/** Criterios 1 y 2: el invitado registra sus datos desde el enlace. Envía vacío para ver los obligatorios. */
export const Invitacion = {
  loaders: [async () => ({ invitacion: await api.consultarInvitacion('token-vigente') })],
  render: (args, { loaded }) => (
    <ConferencistaForm
      {...args}
      formInicial={formularioDesdeInvitacion(loaded.invitacion)}
      enviar={(form) => api.completarInvitacion('token-vigente', aCompletarRequest(form))}
    />
  ),
  args: { modo: 'invitacion', correoBloqueado: true, ayudaCorreo: 'Es el correo al que llegó tu invitación.', onGuardado: () => {} },
};

/** Criterio 4: edición por el administrador, con historial de eventos y marca de vista pública. */
export const Edicion = {
  loaders: [async () => ({ perfil: await api.obtenerPerfilConferencista(12) })],
  render: (args, { loaded }) => (
    <ConferencistaForm
      {...args}
      perfil={loaded.perfil}
      enviar={(form) => api.actualizarConferencista(12, aActualizarRequest(form))}
    />
  ),
  args: { modo: 'editar', onGuardado: () => {}, onCancelar: () => {} },
};

/** Persona con cuenta de usuario: su correo no se cambia desde este módulo. */
export const EdicionConCuentaDeUsuario = {
  loaders: [async () => ({ perfil: { ...(await api.obtenerPerfilConferencista(12)), tieneCuentaUsuario: true } })],
  render: (args, { loaded }) => (
    <ConferencistaForm
      {...args}
      perfil={loaded.perfil}
      enviar={(form) => api.actualizarConferencista(12, aActualizarRequest(form))}
    />
  ),
  args: {
    modo: 'editar',
    correoBloqueado: true,
    ayudaCorreo: 'Es el correo con el que se inicia sesión en SIGEA; no se cambia desde aquí.',
    onGuardado: () => {},
    onCancelar: () => {},
  },
};
