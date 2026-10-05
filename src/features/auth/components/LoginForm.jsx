/**
 * @file LoginForm.jsx
 * @description Formulario de inicio de sesión del sistema SIGEA (HU-01, RF01).
 *
 * Cubre los 4 criterios de aceptación de HU-01:
 *  1. Credenciales correctas -> autentica, guarda la sesión y redirige al panel según el rol.
 *  2. Contraseña incorrecta -> mensaje de error genérico (no revela cuál dato falló).
 *  3. Cuenta bloqueada tras intentos fallidos (HTTP 423) -> mensaje de bloqueo temporal con
 *     cuenta regresiva (usa la cabecera Retry-After o el campo bloqueadoHasta del backend) y
 *     el botón de ingreso deshabilitado hasta el desbloqueo.
 *  4. "Olvidé mi contraseña" -> redirige al flujo de recuperación de contraseña.
 *
 * Si el usuario llega con `?sesion=expirada` (token vencido o invalidado tras un cambio de
 * permisos de su rol, HU-02), se muestra un aviso informativo.
 *
 * @module features/auth/components/LoginForm
 */

import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import Swal from 'sweetalert2';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { reenviarVerificacion } from '../../../api/authService';
import { useAuth } from '../../../context/AuthContext';
import { rutaSegunRoles } from '../../../store/authStore';
import AvisoBloqueo from './AvisoBloqueo';

const INITIAL_FORM = { correo: '', contrasena: '' };

/**
 * Calcula el instante (ms) en que termina el bloqueo a partir de la respuesta 423.
 * Se prefiere Retry-After (segundos restantes) porque no depende de la zona horaria
 * del servidor; si no viene, se usa bloqueadoHasta.
 * @returns {number|null}
 */
function calcularDesbloqueo(err) {
  const segundos = segundosDeRetryAfter(err.response?.headers?.['retry-after']);
  if (segundos) {
    return Date.now() + segundos * 1000;
  }
  const hasta = err.response?.data?.bloqueadoHasta;
  const instante = typeof hasta === 'string' ? Date.parse(hasta) : NaN;
  return Number.isFinite(instante) && instante > Date.now() ? instante : null;
}

/**
 * Interpreta la cabecera Retry-After, que según el estándar HTTP puede traer un número
 * entero de segundos ("900") o una fecha HTTP ("Wed, 21 Oct 2026 07:28:00 GMT").
 * Se valida con una expresión regular en vez de parseInt, que aceptaría valores
 * corruptos como "90abc".
 * @returns {number|null} segundos restantes (entero positivo) o null si no es válida.
 */
function segundosDeRetryAfter(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (/^\d+$/.test(texto)) {
    const segundos = Number(texto);
    return segundos > 0 ? segundos : null;
  }
  const fecha = Date.parse(texto);
  if (!Number.isFinite(fecha)) return null;
  const segundos = Math.ceil((fecha - Date.now()) / 1000);
  return segundos > 0 ? segundos : null;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const sesionExpirada = searchParams.get('sesion') === 'expirada';
  // HU-32: vuelve aquí tras restablecer la contraseña.
  const recuperacionExitosa = searchParams.get('recuperacion') === 'exitosa';

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Correo pendiente de verificación (flujo alterno de HU-31 disparado desde login).
  const [correoPendienteVerificar, setCorreoPendienteVerificar] = useState(null);
  const [reenviando, setReenviando] = useState(false);

  // Criterio 3: { mensaje, desbloqueoEn } mientras la cuenta está bloqueada.
  const [bloqueo, setBloqueo] = useState(null);
  const finalizarBloqueo = useCallback(() => setBloqueo(null), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (generalError) setGeneralError(null);
    if (correoPendienteVerificar) setCorreoPendienteVerificar(null);
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(formData.correo.trim())) {
      newErrors.correo = 'Ingrese un formato de correo electrónico válido';
    }

    if (!formData.contrasena) {
      newErrors.contrasena = 'La contraseña es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setCorreoPendienteVerificar(null);

    if (bloqueo || !validate()) return;

    setLoading(true);
    try {
      // Criterio 1: credenciales correctas -> guarda la sesión y redirige al panel según el rol.
      const sesion = await login({
        correo: formData.correo.trim().toLowerCase(),
        contrasena: formData.contrasena,
      });
      navigate(rutaSegunRoles(sesion?.usuario?.roles), { replace: true });
    } catch (err) {
      // El cuerpo de error puede no traer el formato esperado: se valida antes de usarlo.
      const cuerpo = err.response?.data;
      const errorData = cuerpo && typeof cuerpo === 'object' ? cuerpo : {};
      const status = err.response?.status;

      if (status === 401) {
        // Criterio 2: mensaje genérico, sin indicar cuál dato es incorrecto.
        setGeneralError(errorData?.message || 'Credenciales incorrectas. Verifique su correo electrónico y contraseña.');
      } else if (status === 423) {
        // Criterio 3: cuenta bloqueada temporalmente por intentos fallidos.
        const mensaje = errorData?.message || 'Su cuenta está bloqueada temporalmente. Intente nuevamente más tarde.';
        const desbloqueoEn = calcularDesbloqueo(err);
        if (desbloqueoEn) {
          setBloqueo({ mensaje, desbloqueoEn });
        } else {
          setGeneralError(mensaje);
        }
      } else if (status === 403 && errorData?.codigo === 'CORREO_NO_VERIFICADO') {
        // Flujo alterno (HU-31): correo aún no verificado.
        setGeneralError(errorData.message || 'Debe verificar su correo electrónico antes de iniciar sesión.');
        setCorreoPendienteVerificar(errorData.correo ?? errorData.email ?? formData.correo.trim().toLowerCase());
      } else if (err.codigo === 'RESPUESTA_LOGIN_INVALIDA') {
        setGeneralError('El servidor respondió de forma inesperada. Intente nuevamente en unos minutos.');
      } else if (err.response) {
        // El servidor respondió, pero con un estado no contemplado (403 sin código, 500, etc.).
        setGeneralError(
          errorData.message || `No fue posible iniciar sesión (código ${status}). Intente nuevamente.`
        );
      } else if (err.request) {
        // Sin respuesta: servidor apagado, sin conexión o tiempo de espera agotado.
        setGeneralError('No fue posible conectarse con el servidor. Verifique su conexión o que el servicio esté activo.');
      } else {
        setGeneralError('Ocurrió un error inesperado al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarVerificacion = async () => {
    if (!correoPendienteVerificar) return;
    setReenviando(true);
    try {
      const data = await reenviarVerificacion(correoPendienteVerificar);
      // Envío exitoso: se limpia el aviso para que el botón no quede visible ni "pegado".
      setGeneralError(null);
      setCorreoPendienteVerificar(null);
      Swal.fire({
        icon: 'success',
        title: 'Enlace reenviado',
        text: data?.mensaje || 'Revisa tu bandeja de entrada para verificar tu correo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]' },
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo reenviar el enlace',
        text: 'Intenta nuevamente en unos minutos.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]' },
      });
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
      {/* Encabezado de la tarjeta */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
          Bienvenido de nuevo
        </span>
        <h2 className="font-serif-title text-3xl text-[#1f2023] tracking-tight">
          Iniciar Sesión
        </h2>
        <p className="text-sm text-[#5b5f66] mt-1.5 font-normal">
          Ingresa tus credenciales para acceder a la plataforma SIGEA.
        </p>
      </div>

      {/* Aviso de sesión expirada o invalidada */}
      {sesionExpirada && !generalError && !bloqueo && (
        <div className="mb-6 flex items-start gap-3 bg-[#f7f7f8] border border-[#e5e7ea] text-[#1f2023] text-sm rounded-[8px] px-4 py-3">
          <Info className="w-5 h-5 text-[#5b5f66] shrink-0 mt-0.5" />
          <p>Tu sesión se cerró porque expiró o porque cambiaron los permisos de tu rol. Inicia sesión nuevamente.</p>
        </div>
      )}

      {/* HU-32: contraseña restablecida */}
      {recuperacionExitosa && !sesionExpirada && !generalError && !bloqueo && (
        <div role="status" className="mb-6 flex items-start gap-3 bg-[#f7f7f8] border border-[#e5e7ea] text-[#1f2023] text-sm rounded-[8px] px-4 py-3">
          <Info className="w-5 h-5 text-[#5b5f66] shrink-0 mt-0.5" />
          <p>Tu contraseña fue actualizada. Inicia sesión con tu nueva contraseña.</p>
        </div>
      )}

      {/* Criterio 3: cuenta bloqueada con cuenta regresiva */}
      {bloqueo && (
        <AvisoBloqueo mensaje={bloqueo.mensaje} desbloqueoEn={bloqueo.desbloqueoEn} onFinalizado={finalizarBloqueo} />
      )}

      {/* Alerta de error general / servidor */}
      {generalError && (
        <div className="mb-6 flex flex-col gap-2 bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-sm rounded-[8px] px-4 py-3">
          <p>{generalError}</p>
          {correoPendienteVerificar && (
            <button
              type="button"
              onClick={handleReenviarVerificacion}
              disabled={reenviando}
              className="self-start text-xs font-semibold text-[#a6192e] hover:underline disabled:opacity-50 cursor-pointer"
            >
              {reenviando ? 'Reenviando...' : 'Reenviar enlace de verificación'}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Correo Electrónico"
          name="correo"
          type="email"
          value={formData.correo}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
          error={errors.correo}
          required
          disabled={loading}
        />

        <Input
          label="Contraseña"
          name="contrasena"
          type={showPassword ? 'text' : 'password'}
          value={formData.contrasena}
          onChange={handleChange}
          placeholder="Tu contraseña"
          error={errors.contrasena}
          required
          disabled={loading}
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

        {/* Criterio 4: redirección al flujo de recuperación de contraseña */}
        <div className="text-right -mt-2">
          <Link to="/recuperar-password" className="text-xs font-semibold text-[#a6192e] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" loading={loading} disabled={Boolean(bloqueo)} className="w-full">
            Ingresar a SIGEA
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-[#5b5f66]">
            ¿Aún no tienes una cuenta?{' '}
            <Link to="/registro" className="text-[#a6192e] font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
