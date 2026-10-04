import AvisoBloqueo from './AvisoBloqueo';

const MENSAJE =
  'Su cuenta ha sido bloqueada temporalmente por múltiples intentos fallidos. Podrá intentarlo nuevamente después de las 17:15.';

export default {
  title: 'Features/Auth/AvisoBloqueo',
  component: AvisoBloqueo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'HU-01, Criterio 3: cuenta bloqueada temporalmente, con cuenta regresiva hasta el desbloqueo.',
      },
    },
  },
};

/** Bloqueo de 15 minutos (valor por defecto del backend). */
export const QuinceMinutos = {
  render: () => (
    <div className="max-w-md p-4">
      <AvisoBloqueo mensaje={MENSAJE} desbloqueoEn={Date.now() + 15 * 60 * 1000} />
    </div>
  ),
};

/** Últimos segundos: al llegar a cero se oculta la cuenta regresiva. */
export const PocosSegundos = {
  render: () => (
    <div className="max-w-md p-4">
      <AvisoBloqueo mensaje={MENSAJE} desbloqueoEn={Date.now() + 10 * 1000} />
    </div>
  ),
};
