import EstadoEventoBadge from './EstadoEventoBadge';

export default {
  title: 'Features/Eventos/EstadoEventoBadge',
  component: EstadoEventoBadge,
  tags: ['autodocs'],
  argTypes: {
    estado: {
      control: 'select',
      options: ['en_configuracion', 'habilitado', 'en_ejecucion', 'cerrado'],
    },
  },
};

export const EnConfiguracion = { args: { estado: 'en_configuracion' } };
export const Habilitado = { args: { estado: 'habilitado' } };
export const EnEjecucion = { args: { estado: 'en_ejecucion' } };
export const Cerrado = { args: { estado: 'cerrado' } };

export const TodosLosEstados = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-4">
      <EstadoEventoBadge estado="en_configuracion" />
      <EstadoEventoBadge estado="habilitado" />
      <EstadoEventoBadge estado="en_ejecucion" />
      <EstadoEventoBadge estado="cerrado" />
    </div>
  ),
};
