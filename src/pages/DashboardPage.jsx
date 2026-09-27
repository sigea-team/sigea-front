/**
 * @file DashboardPage.jsx
 * @description Panel genérico al que se redirige tras un login exitoso (HU-01, Criterio 1).
 * Cada rol tendrá su propio panel en HUs posteriores; mientras tanto, todos los roles
 * caen aquí (ver `rutaSegunRoles` en store/authStore.js) mostrando los datos de sesión.
 * @module pages/DashboardPage
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const usuario = useAuthStore((state) => state.usuario);
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion);

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#edeeef] p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-[16px] border border-[#e5e7ea] p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e]">
              SIGEA
            </span>
            <h1 className="font-serif-title text-2xl text-[#1f2023] mt-1">
              Bienvenido, {usuario?.nombreCompleto || 'Usuario'}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-[#a6192e] hover:underline cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="text-sm text-[#5b5f66] bg-[#f7f7f8] border border-[#e5e7ea] rounded-[8px] p-4 space-y-1">
          <p><strong className="text-[#1f2023]">Correo:</strong> {usuario?.correo}</p>
          <p><strong className="text-[#1f2023]">Roles:</strong> {usuario?.roles?.join(', ') || '—'}</p>
        </div>

        <p className="text-xs text-[#9ca0a6] mt-6">
          Este es un panel genérico temporal (HU-01). Los paneles específicos por rol
          se implementarán en historias de usuario posteriores.
        </p>
      </div>
    </div>
  );
}
