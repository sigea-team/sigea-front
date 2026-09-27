import React from 'react';
import DashboardPage from './DashboardPage';

export default {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => <DashboardPage />,
};
