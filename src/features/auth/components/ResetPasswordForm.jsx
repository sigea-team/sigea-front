/**
 * @file ResetPasswordForm.jsx
 * @description Formulario de nueva contraseña (HU-32). El enlace del correo
 * trae el token como query param (?token=...); este componente lo lee con
 * react-router-dom y lo envía junto con la nueva contraseña al backend.
 *
 * @module features/auth/components/ResetPasswordForm
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { restablecerContrasena } from '../../../api/authService';

const INITIAL_FORM = {
  nuevaContrasena: '',
  confirmarContrasena: '',
};

const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])[A-Za-z\d@$!%*?&._\-#]{8,64}$/;

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completado, setCompletado] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nuevaContrasena) {
      newErrors.nuevaContrasena = 'La contraseña es obligatoria';
    } else if (!PASS_REGEX.test(formData.nuevaContrasena)) {
      newErrors.nuevaContrasena = 'Debe tener 8-64 caracteres, mayúscula, minúscula, número y símbolo (@$!%*?&._-#)';
    }

    if (!formData.confirmarContrasena) {
      newErrors.confirmarContrasena = 'Confirme su contraseña';
    } else if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      newErrors.confirmarContrasena = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await restablecerContrasena(token, formData.nuevaContrasena);
      setCompletado(true);

      Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: data.mensaje || 'Tu contraseña se restableció correctamente.',
        confirmButtonText: 'Ir a iniciar sesión',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm'
        }
      }).then(() => {
        window.location.href = '#login';
      });
    } catch (err) {
      // Criterio 3: el backend responde con "El enlace ya fue utilizado" / "ha expirado" / inválido
      const errorMessage = err.response?.data?.message
        || (err.request ? 'No fue posible conectarse con el servidor backend.' : 'Ocurrió un error inesperado.');

      Swal.fire({
        icon: 'error',
        title: 'No se pudo restablecer la contraseña',
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

  if (!token) {
    return (
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
          SIGEA · Acceso
        </span>
        <h2 className="font-serif-title text-2xl text-[#1f2023] tracking-tight mb-3">
          Enlace no válido
        </h2>
        <p className="text-sm text-[#5b5f66]">
          Este enlace no incluye un token de recuperación. Solicita uno nuevo desde la pantalla de recuperación de contraseña.
        </p>
        <a href="#forgot-password" className="text-[#a6192e] font-semibold text-sm hover:underline mt-4 inline-block">
          Solicitar un nuevo enlace
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
          SIGEA · Acceso
        </span>
        <h2 className="font-serif-title text-3xl text-[#1f2023] tracking-tight">
          Crea tu nueva contraseña
        </h2>
        <p className="text-sm text-[#5b5f66] mt-1.5 font-normal">
          Elige una contraseña segura para tu cuenta SIGEA.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Nueva Contraseña"
          name="nuevaContrasena"
          type={showPassword ? 'text' : 'password'}
          value={formData.nuevaContrasena}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
          error={errors.nuevaContrasena}
          required
          disabled={loading || completado}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-[#1f2023] focus:outline-none cursor-pointer"
              title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
        />

        <Input
          label="Confirmar Contraseña"
          name="confirmarContrasena"
          type={showPassword ? 'text' : 'password'}
          value={formData.confirmarContrasena}
          onChange={handleChange}
          placeholder="Repita su contraseña"
          error={errors.confirmarContrasena}
          required
          disabled={loading || completado}
        />

        <p className="text-xs text-[#5b5f66] leading-relaxed bg-[#f7f7f8] p-3 rounded-[8px] border border-[#e5e7ea]">
          <strong className="text-[#1f2023]">Requisitos de seguridad:</strong> mínimo 8 caracteres, al menos una mayúscula, una minúscula, un dígito numérico y un carácter especial (@$!%*?&._-#).
        </p>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={completado}
          className="w-full"
        >
          {completado ? 'Contraseña actualizada' : 'Restablecer contraseña'}
        </Button>
      </form>
    </div>
  );
}
