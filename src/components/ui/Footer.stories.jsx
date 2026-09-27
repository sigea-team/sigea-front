import React from 'react';
import Footer from './Footer';

export default {
  title: 'UI/Footer',
  component: Footer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-[#a6192e] p-8 max-w-md rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export const Default = {};
