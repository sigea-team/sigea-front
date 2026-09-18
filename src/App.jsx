import React from 'react';
import MainLayout from './components/layout/MainLayout';
import RegisterForm from './features/auth/components/RegisterForm';

function App() {
  return (
    <MainLayout>
      <RegisterForm />
    </MainLayout>
  );
}

export default App;
