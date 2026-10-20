import CuentaPage from './CuentaPage';

export default {
  title: 'Pages/CuentaPage',
  component: CuentaPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => <CuentaPage />,
};
