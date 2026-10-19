/**
 * @file ResetPasswordForm.jsx
 * @description Paso 2 de la recuperación de contraseña (HU-32, RF58 / CU-28).
 * Se abre desde el enlace del correo: /#/reset-password?token=<uuid>.
 *
 * Criterios de aceptación cubiertos:
 *  2. Con un token vigente, el usuario define una nueva contraseña que cumple la política
 *     (la misma del registro) y el sistema la actualiza y notifica el cambio por correo.
 *  3. Si el token ya fue usado, expiró o no existe, el sistema rechaza el cambio y se le
 *     ofrece al usuario solicitar un enlace nuevo.
 *
 * @module features/auth/components/ResetPasswordForm
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Circle, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { servicioRecuperacion } from '../../../api/authService';
import {
  PATRON_CONTRASENA,
  MENSAJE_POLITICA_CONTRASENA,
  REQUISITOS_CONTRASENA,
  cuerpoDeError,
  esErrorDeConexion,
  MENSAJE_SIN_CONEXION,
} from '../recuperacionUtils';

const FORM_INICIAL = { nuevaContrasena: '', confirmarContrasena: '' };

/** Botón de ver/ocultar contraseña para el `rightElement` del Input. */
function BotonVerContrasena({ visible, onToggle }) {
  const Icono = visible ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="hover:text-[#1f2023] focus:outline-none cursor-pointer"
      title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
      aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
    >
      <Icono className="w-4 h-4" />
    </button>
  );
}

/** Lista de requisitos de la política que se marca en vivo mientras se escribe. */
function RequisitosContrasena({ valor }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs" aria-label="Requisitos de la contraseña">
      {REQUISITOS_CONTRASENA.map(({ id, texto, cumple }) => {
        const ok = cumple(valor);
        return (
          <li key={id} className={`flex items-center gap-2 ${ok ? 'text-[#1f2023]' : 'text-[#5b5f66]'}`}>
            {ok ? (
              <Check className="w-3.5 h-3.5 text-[#a6192e] shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-[#9ca0a6] shrink-0" aria-hidden="true" />
            )}
            <span>{texto}</span>
            <span className="sr-only">{ok ? '(cumple)' : '(pendiente)'}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Encabezado común de la tarjeta. */
function Encabezado({ titulo, descripcion }) {
  return (
    <div className="mb-8">
      <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
        Recuperar acceso
      </span>
      <h2 className="font-serif-title text-3xl text-[#1f2023] tracking-tight">{titulo}</h2>
      <p className="text-sm text-[#5b5f66] mt-1.5 font-normal">{descripcion}</p>
    </div>
  );
}

/** Estado de enlace inválido / expirado / ya usado (Criterio 3) o sin token en la URL. */
function EnlaceNoValido({ mensaje }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
      <Encabezado
        titulo="Enlace no válido"
        descripcion="No es posible restablecer la contraseña con este enlace."
      />
      <div role="alert" className="mb-6 bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-sm rounded-[8px] px-4 py-3">
        {mensaje}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/recuperar-password"
          className="flex-1 h-11 px-6 rounded-[8px] font-medium text-sm inline-flex items-center justify-center bg-[#a6192e] text-white hover:bg-[#7a0c1e] transition-colors shadow-sm"
        >
          Solicitar un nuevo enlace
        </Link>
        <Link
          to="/login"
          className="flex-1 h-11 px-6 rounded-[8px] font-medium text-sm inline-flex items-center justify-center border border-[#d8dadf] text-[#1f2023] hover:bg-[#f7f7f8] transition-colors"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {string|null} props.token - Token de recuperación leído de la URL.
 * @param {{ restablecer: (data: { token: string, nuevaContrasena: string }) => Promise<{ mensaje: string, correo: string }> }} [props.servicio]
 *        API a usar; se inyecta una simulada en Storybook.
 */
export default function ResetPasswordForm({ token, servicio = servicioRecuperacion }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [errors, setErrors] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [mostrar, setMostrar] = useState({ nueva: false, confirmar: false });
  const [loading, setLoading] = useState(false);
  // Criterio 3: mensaje del backend cuando el token no sirve; cambia a la vista de enlace no válido.
  const [tokenRechazado, setTokenRechazado] = useState(null);
  // Criterio 2: respuesta de éxito del backend.
  const [exito, setExito] = useState(null);

  const tokenLimpio = typeof token === 'string' ? token.trim() : '';

  if (!tokenLimpio) {
    return (
      <EnlaceNoValido mensaje="El enlace de recuperación está incompleto. Ábrelo directamente desde el correo o solicita uno nuevo." />
    );
  }

  if (tokenRechazado) {
    return <EnlaceNoValido mensaje={tokenRechazado} />;
  }

  if (exito) {
    return (
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
        <Encabezado
          titulo="Contraseña actualizada"
          descripcion="Ya puedes ingresar a SIGEA con tu nueva contraseña."
        />
        <div role="status" className="mb-6 flex items-start gap-3 bg-[#f7f7f8] border border-[#e5e7ea] text-[#1f2023] text-sm rounded-[8px] px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-[#a6192e] shrink-0 mt-0.5" />
          <div>
            <p>{exito.mensaje}</p>
            {exito.correo && <p className="text-xs text-[#5b5f66] mt-1">Cuenta: {exito.correo}</p>}
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => navigate('/login?recuperacion=exitosa', { replace: true })}
        >
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (errorGeneral) setErrorGeneral(null);
  };

  const validar = () => {
    const nuevos = {};
    if (!formData.nuevaContrasena) {
      nuevos.nuevaContrasena = 'La nueva contraseña es obligatoria';
    } else if (!PATRON_CONTRASENA.test(formData.nuevaContrasena)) {
      nuevos.nuevaContrasena = MENSAJE_POLITICA_CONTRASENA;
    }
    if (!formData.confirmarContrasena) {
      nuevos.confirmarContrasena = 'Confirma la nueva contraseña';
    } else if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      nuevos.confirmarContrasena = 'Las contraseñas no coinciden';
    }
    setErrors(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorGeneral(null);
    if (loading || !validar()) return;

    setLoading(true);
    try {
      const data = await servicio.restablecer({
        token: tokenLimpio,
        nuevaContrasena: formData.nuevaContrasena,
      });
      setFormData(FORM_INICIAL);
      setExito({
        mensaje: data?.mensaje || 'Tu contraseña fue actualizada correctamente.',
        correo: data?.correo,
      });
    } catch (err) {
      const error = cuerpoDeError(err);
      if (error.codigo === 'TOKEN_INVALIDO') {
        // Criterio 3: token usado, expirado o inexistente.
        setTokenRechazado(error.message || 'El enlace de recuperación no es válido o expiró. Solicita uno nuevo.');
      } else if (error.status === 400 && error.erroresValidacion) {
        const { nuevaContrasena, token: errorToken } = error.erroresValidacion;
        if (errorToken) {
          setTokenRechazado(errorToken);
        } else {
          setErrors({ nuevaContrasena: nuevaContrasena || MENSAJE_POLITICA_CONTRASENA });
        }
      } else if (esErrorDeConexion(err)) {
        setErrorGeneral(MENSAJE_SIN_CONEXION);
      } else {
        setErrorGeneral(error.message || 'No fue posible actualizar la contraseña. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
      <Encabezado
        titulo="Crea una nueva contraseña"
        descripcion="Elige una contraseña segura para tu cuenta de SIGEA."
      />

      {errorGeneral && (
        <div role="alert" className="mb-6 bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-sm rounded-[8px] px-4 py-3">
          {errorGeneral}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Nueva contraseña"
          name="nuevaContrasena"
          type={mostrar.nueva ? 'text' : 'password'}
          value={formData.nuevaContrasena}
          onChange={handleChange}
          placeholder="Tu nueva contraseña"
          error={errors.nuevaContrasena}
          required
          disabled={loading}
          autoComplete="new-password"
          autoFocus
          rightElement={
            <BotonVerContrasena
              visible={mostrar.nueva}
              onToggle={() => setMostrar((p) => ({ ...p, nueva: !p.nueva }))}
            />
          }
        />

        <RequisitosContrasena valor={formData.nuevaContrasena} />

        <Input
          label="Confirmar contraseña"
          name="confirmarContrasena"
          type={mostrar.confirmar ? 'text' : 'password'}
          value={formData.confirmarContrasena}
          onChange={handleChange}
          placeholder="Repite la nueva contraseña"
          error={errors.confirmarContrasena}
          required
          disabled={loading}
          autoComplete="new-password"
          rightElement={
            <BotonVerContrasena
              visible={mostrar.confirmar}
              onToggle={() => setMostrar((p) => ({ ...p, confirmar: !p.confirmar }))}
            />
          }
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            <KeyRound className="w-4 h-4" aria-hidden="true" />
            <span>Guardar nueva contraseña</span>
          </Button>
        </div>

        <div className="text-center pt-2">
          <Link to="/login" className="text-xs font-semibold text-[#a6192e] hover:underline">
            Cancelar y volver a iniciar sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
