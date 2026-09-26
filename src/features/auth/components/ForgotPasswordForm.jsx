/**
 * @file ForgotPasswordForm.jsx
 * @description Formulario para solicitar la recuperación de contraseña (HU-32).
 * El usuario ingresa su correo; el backend responde con un mensaje genérico
 * (exista o no el correo, Criterio 4) y, si existe, envía un enlace por correo.
 *
 * @module features/auth/components/ForgotPasswordForm
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { solicitarRecuperacion } from '../../../api/authService';

export default function ForgotPasswordForm() {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setCorreo(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const correoTrim = correo.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoTrim) {
      setError('El correo electrónico es obligatorio');
      return;
    }
    if (!emailRegex.test(correoTrim)) {
      setError('Ingrese un formato de correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      const data = await solicitarRecuperacion(correoTrim.toLowerCase());
      setEnviado(true);

      Swal.fire({
        icon: 'success',
        title: 'Solicitud enviada',
        text: data.mensaje || 'Si el correo está registrado, recibirás un enlace de recuperación.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm'
        }
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message
        || (err.request ? 'No fue posible conectarse con el servidor backend.' : 'Ocurrió un error inesperado.');

      Swal.fire({
        icon: 'error',
        title: 'No se pudo procesar la solicitud',
        text: errorMessage,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
          SIGEA · Acceso
        </span>
        <h2 className="font-serif-title text-3xl text-[#1f2023] tracking-tight">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="text-sm text-[#5b5f66] mt-1.5 font-normal">
          Ingresa tu correo. Si está registrado, te enviaremos un enlace de recuperación válido por 15 minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Correo Electrónico"
          name="correo"
          type="email"
          value={correo}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
          error={error}
          required
          disabled={loading || enviado}
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={enviado}
          className="w-full"
        >
          {enviado ? 'Enlace enviado' : 'Enviar enlace de recuperación'}
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs text-[#5b5f66]">
            ¿Ya la recordaste?{' '}
            <a href="#login" className="text-[#a6192e] font-semibold hover:underline">
              Iniciar Sesión
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
