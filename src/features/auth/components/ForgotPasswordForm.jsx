/**
 * @file ForgotPasswordForm.jsx
 * @description Paso 1 de la recuperación de contraseña (HU-32, RF58 / CU-28).
 *
 * Criterios de aceptación cubiertos:
 *  1. El usuario ingresa su correo y solicita el enlace -> el backend genera un token con
 *     vigencia limitada y envía el enlace por correo.
 *  4. El mensaje de confirmación es SIEMPRE el mismo, exista o no la cuenta: el formulario
 *     muestra el texto genérico que devuelve el backend y nunca diferencia los casos.
 *
 * @module features/auth/components/ForgotPasswordForm
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { servicioRecuperacion } from '../../../api/authService';
import {
  PATRON_CORREO,
  cuerpoDeError,
  esErrorDeConexion,
  MENSAJE_SIN_CONEXION,
} from '../recuperacionUtils';

const MENSAJE_GENERICO =
  'Si el correo está registrado, hemos enviado un enlace de recuperación con vigencia limitada.';

/**
 * @param {Object} props
 * @param {{ solicitar: (correo: string) => Promise<{ mensaje: string }> }} [props.servicio]
 *        API a usar; se inyecta una simulada en Storybook.
 */
export default function ForgotPasswordForm({ servicio = servicioRecuperacion }) {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [loading, setLoading] = useState(false);
  // Mensaje de confirmación; cuando existe se muestra el estado "enviado".
  const [confirmacion, setConfirmacion] = useState(null);

  const handleChange = (e) => {
    setCorreo(e.target.value);
    if (errorCorreo) setErrorCorreo(null);
    if (errorGeneral) setErrorGeneral(null);
  };

  const validar = () => {
    const valor = correo.trim();
    if (!valor) {
      setErrorCorreo('El correo electrónico es obligatorio');
      return false;
    }
    if (!PATRON_CORREO.test(valor)) {
      setErrorCorreo('Ingrese un formato de correo electrónico válido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral(null);
    if (loading || !validar()) return;

    setLoading(true);
    try {
      const data = await servicio.solicitar(correo.trim().toLowerCase());
      // Criterio 4: se muestra el mensaje genérico del backend, sin distinguir si la cuenta existe.
      setConfirmacion(data?.mensaje || MENSAJE_GENERICO);
    } catch (err) {
      const error = cuerpoDeError(err);
      if (error.status === 400 && error.erroresValidacion?.correo) {
        setErrorCorreo(error.erroresValidacion.correo);
      } else if (esErrorDeConexion(err)) {
        setErrorGeneral(MENSAJE_SIN_CONEXION);
      } else {
        setErrorGeneral(error.message || 'No fue posible procesar la solicitud. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const volverAIntentar = () => {
    setConfirmacion(null);
    setErrorGeneral(null);
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
          Recuperar acceso
        </span>
        <h2 className="font-serif-title text-3xl text-[#1f2023] tracking-tight">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="text-sm text-[#5b5f66] mt-1.5 font-normal">
          {confirmacion
            ? 'Revisa tu bandeja de entrada (y la carpeta de spam) para continuar.'
            : 'Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.'}
        </p>
      </div>

      {confirmacion ? (
        <div className="space-y-6">
          <div
            role="status"
            className="flex items-start gap-3 bg-[#f7f7f8] border border-[#e5e7ea] text-[#1f2023] text-sm rounded-[8px] px-4 py-3"
          >
            <MailCheck className="w-5 h-5 text-[#a6192e] shrink-0 mt-0.5" />
            <p>{confirmacion}</p>
          </div>

          <p className="text-xs text-[#5b5f66]">
            El enlace solo puede usarse una vez. Si expira, solicita uno nuevo.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" onClick={() => navigate('/login')} className="flex-1">
              Volver a iniciar sesión
            </Button>
            <Button variant="outline" onClick={volverAIntentar} className="flex-1">
              No me llegó, enviar de nuevo
            </Button>
          </div>
        </div>
      ) : (
        <>
          {errorGeneral && (
            <div
              role="alert"
              className="mb-6 bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-sm rounded-[8px] px-4 py-3"
            >
              {errorGeneral}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Correo Electrónico"
              name="correo"
              type="email"
              value={correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              error={errorCorreo}
              required
              disabled={loading}
              autoComplete="email"
              autoFocus
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Enviar enlace de recuperación
              </Button>
            </div>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-[#a6192e] hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
