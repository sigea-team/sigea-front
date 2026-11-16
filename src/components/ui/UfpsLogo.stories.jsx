import UfpsLogo from './UfpsLogo';

export default {
  title: 'UI/UfpsLogo',
  component: UfpsLogo,
  tags: ['autodocs'],
  argTypes: {
    variante: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
    className: { control: 'text' },
  },
};

export const Vertical = {
  args: {
    variante: 'vertical',
    className: 'h-16 w-auto object-contain',
  },
};

export const Horizontal = {
  args: {
    variante: 'horizontal',
    className: 'h-12 w-auto object-contain',
  },
};
