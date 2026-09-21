import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Alert from '../../../components/ui/Alert';
import { registrarUsuario } from '../../../api/authService';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PEP', label: 'Permiso Especial de Permanencia (PEP)' }
];

// Combobox de Afiliación Institucional con opciones estandarizadas
const AFILIACIONES_INSTITUCIONALES = [
  { value: 'UFPS - Estudiante', label: 'UFPS — Estudiante de Pregrado / Posgrado' },
  { value: 'UFPS - Docente', label: 'UFPS — Docente / Investigador' },
  { value: 'UFPS - Administrativo', label: 'UFPS — Personal Administrativo' },
  { value: 'UFPS - Egresado', label: 'UFPS — Egresado / Graduado' },
  { value: 'Otra Universidad Nacional', label: 'Otra Institución Universitaria Nacional' },
  { value: 'Universidad Internacional', label: 'Institución Universitaria Internacional' },
  { value: 'Sector Empresarial / Industria', label: 'Sector Productivo / Empresa' },
  { value: 'Comunidad Externa / Particular', label: 'Comunidad Externa / Independiente' },
];

const INITIAL_FORM = {
  nombres: '',
  apellidos: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  correo: '',
  afiliacionInstitucional: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

/**
 * @typedef {Object} RegisterFormData
 * @property {string} nombres - Nombres completos del usuario.
 * @property {string} apellidos - Apellidos completos del usuario.
 * @property {string} tipoDocumento - Sigla del tipo de identificación (CC, TI, etc.).
 * @property {string} numeroDocumento - Dígitos del documento de identidad.
 * @property {string} correo - Dirección de correo electrónico.
 * @property {string} afiliacionInstitucional - Opción seleccionada de vínculo institucional.
 * @property {string} telefono - Teléfono de contacto (solo dígitos).
 * @property {string} contrasena - Contraseña con política de seguridad requerida.
 * @property {string} confirmarContrasena - Confirmación idéntica de la contraseña.
 */

/**
 * Componente principal del módulo de registro de usuarios de SIGEA.
 * Encapsula la gestión de estado reactivo, la validación estricta en el cliente (formato de correo,
 * dígitos numéricos para documento y teléfono, fortaleza de contraseña) y la comunicación
 * asíncrona con el endpoint de registro.
 *
 * @component
 * @returns {JSX.Element} Vista del formulario de registro o confirmación de cuenta creada.
 */
export default function RegisterForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [successResponse, setSuccessResponse] = useState(null);

  /**
   * Manejador de eventos de entrada para los controles del formulario.
   * Aplica restricción inmediata de solo dígitos en los campos 'numeroDocumento' y 'telefono',
   * y remueve dinámicamente los errores asociados al campo editado.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - Evento de cambio nativo.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Restricción: únicamente dígitos numéricos en documento y teléfono
    if (name === 'numeroDocumento' || name === 'telefono') {
      const onlyNumbers = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: onlyNumbers }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Limpiar error al tipear
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  /**
   * Ejecuta la validación sintáctica y de reglas de negocio en el cliente sobre los datos del formulario.
   * Elimina espacios en blanco accidentales (.trim()) y valida:
   * - Campos obligatorios y longitudes máximas según el esquema de BD.
   * - Restricción estricta de números enteros en documento y teléfono.
   * - Formato regular de correo electrónico.
   * - Política de seguridad de contraseña (8-64 caracteres, minúscula, mayúscula, dígito y símbolo).
   * - Coincidencia exacta entre contraseña y su confirmación.
   *
   * @returns {boolean} Retorna true si todos los campos son válidos; false si existen inconsistencias.
   */
  const validate = () => {
    const newErrors = {};

    const nombresTrim = formData.nombres.trim();
    const apellidosTrim = formData.apellidos.trim();
    const numeroDocTrim = formData.numeroDocumento.trim();
    const correoTrim = formData.correo.trim();
    const telefonoTrim = formData.telefono.trim();

    if (!nombresTrim) {
      newErrors.nombres = 'El nombre es obligatorio';
    } else if (nombresTrim.length > 100) {
      newErrors.nombres = 'No puede exceder 100 caracteres';
    }

    if (!apellidosTrim) {
      newErrors.apellidos = 'Los apellidos son obligatorios';
    } else if (apellidosTrim.length > 100) {
      newErrors.apellidos = 'No puede exceder 100 caracteres';
    }

    if (!formData.tipoDocumento) {
      newErrors.tipoDocumento = 'El tipo de documento es obligatorio';
    }

    if (!numeroDocTrim) {
      newErrors.numeroDocumento = 'El número de documento es obligatorio';
    } else if (!/^\d+$/.test(numeroDocTrim)) {
      newErrors.numeroDocumento = 'El documento solo debe contener números';
    } else if (numeroDocTrim.length > 30) {
      newErrors.numeroDocumento = 'No puede exceder 30 caracteres';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoTrim) {
      newErrors.correo = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(correoTrim)) {
      newErrors.correo = 'Ingrese un formato de correo electrónico válido';
    } else if (correoTrim.length > 150) {
      newErrors.correo = 'El correo no puede exceder 150 caracteres';
    }

    if (!formData.afiliacionInstitucional) {
      newErrors.afiliacionInstitucional = 'Seleccione su afiliación institucional';
    }

    if (telefonoTrim) {
      if (!/^\d+$/.test(telefonoTrim)) {
        newErrors.telefono = 'El teléfono solo debe contener números';
      } else if (telefonoTrim.length > 30) {
        newErrors.telefono = 'El teléfono no puede exceder 30 caracteres';
      }
    }

    // Regla de contraseña del backend:
    // Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])[A-Za-z\d@$!%*?&._\-#]{8,64}$/;
    if (!formData.contrasena) {
      newErrors.contrasena = 'La contraseña es obligatoria';
    } else if (!passRegex.test(formData.contrasena)) {
      newErrors.contrasena = 'Debe tener entre 8 y 64 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo (@$!%*?&._-#)';
    }

    if (!formData.confirmarContrasena) {
      newErrors.confirmarContrasena = 'Confirme su contraseña';
    } else if (formData.contrasena !== formData.confirmarContrasena) {
      newErrors.confirmarContrasena = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Procesa el envío del formulario de registro.
   * Realiza un saneamiento previo eliminando espacios en blanco en los extremos de los campos,
   * valida los datos, activa el indicador de carga y despacha la petición POST a la API.
   * En caso de éxito, despliega la pantalla de confirmación; en caso de fallo, mapea los
   * errores de validación de Spring o despliega la alerta de negocio institucional.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    // 1. Limpieza de espacios al inicio y al final en el estado visible
    const sanitizedData = {
      ...formData,
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      numeroDocumento: formData.numeroDocumento.trim(),
      correo: formData.correo.trim(),
      telefono: formData.telefono.trim(),
    };
    setFormData(sanitizedData);

    if (!validate()) return;

    setLoading(true);

    // Preparación del payload esperado por RegistroRequest en el backend (limpio de espacios)
    const payload = {
      nombres: sanitizedData.nombres,
      apellidos: sanitizedData.apellidos,
      tipoDocumento: sanitizedData.tipoDocumento,
      numeroDocumento: sanitizedData.numeroDocumento,
      correo: sanitizedData.correo.toLowerCase(),
      contrasena: sanitizedData.contrasena,
      telefono: sanitizedData.telefono || null,
      afiliacionInstitucional: sanitizedData.afiliacionInstitucional || null,
    };

    try {
      const data = await registrarUsuario(payload);
      setSuccessResponse(data);
      setFormData(INITIAL_FORM);
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        // Errores de validación devueltos por el backend (Spring Validation)
        if (errorData.erroresValidacion && typeof errorData.erroresValidacion === 'object') {
          setErrors(errorData.erroresValidacion);
        }
        // Mensaje de negocio del backend (ej: duplicidad de correo o documento 409)
        setGeneralError(errorData.message || 'Ocurrió un error al procesar la solicitud.');
      } else if (err.request) {
        setGeneralError('No fue posible conectarse con el servidor backend. Verifique que el servicio esté activo.');
      } else {
        setGeneralError('Error inesperado al intentar registrar el usuario.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito tras registro
  if (successResponse) {
    return (
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-[#a6192e] mb-2">Registro Exitoso</p>
        <h2 className="font-serif-title text-3xl text-[#1f2023] mb-4">¡Cuenta Creada!</h2>

        <p className="text-[#5b5f66] text-sm leading-relaxed mb-6">
          {successResponse.mensaje || 'Se ha registrado la cuenta exitosamente.'}
        </p>

        <div className="bg-[#f7f7f8] rounded-[8px] p-4 text-left text-xs text-[#5b5f66] space-y-1 mb-8 border border-[#e5e7ea]">
          <p><strong className="text-[#1f2023]">Correo registrado:</strong> {successResponse.correo}</p>
          {successResponse.requiereVerificacion && (
            <p className="text-[#a6192e] font-medium pt-1">
              * Recuerde verificar el enlace enviado a su correo antes de iniciar sesión.
            </p>
          )}
        </div>

        <Button
          variant="primary"
          onClick={() => setSuccessResponse(null)}
          className="w-full"
        >
          Registrar otro usuario
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm">
      {/* Encabezado de la tarjeta */}
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
          Crear cuenta
        </span>
        <h2 className="font-serif-title text-3xl text-[#1f2023] tracking-tight">
          Registro de Usuario
        </h2>
        <p className="text-sm text-[#5b5f66] mt-1.5 font-normal">
          Diligencie la información para participar como asistente, ponente u organizador en SIGEA.
        </p>
      </div>

      {/* Alerta de error general / servidor */}
      {generalError && (
        <div className="mb-6">
          <Alert
            title="No se pudo completar el registro"
            message={generalError}
            onClose={() => setGeneralError(null)}
          />
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Fila 1: Nombres y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombres"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            placeholder="Ej. Carlos Andrés"
            error={errors.nombres}
            required
            disabled={loading}
          />
          <Input
            label="Apellidos"
            name="apellidos"
            value={formData.apellidos}
            onChange={handleChange}
            placeholder="Ej. Gómez Pérez"
            error={errors.apellidos}
            required
            disabled={loading}
          />
        </div>

        {/* Fila 2: Documento de identidad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Select
              label="Tipo de Doc."
              name="tipoDocumento"
              value={formData.tipoDocumento}
              onChange={handleChange}
              options={TIPOS_DOCUMENTO}
              error={errors.tipoDocumento}
              required
              disabled={loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Número de Documento"
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={handleChange}
              placeholder="Ej. 1098765432"
              error={errors.numeroDocumento}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Fila 3: Correo electrónico y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            label="Teléfono de Contacto"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Ej. 3001234567 (Opcional)"
            error={errors.telefono}
            disabled={loading}
          />
        </div>

        {/* Fila 4: Afiliación Institucional (Combobox de opciones disponibles) */}
        <div>
          <Select
            label="Afiliación Institucional"
            name="afiliacionInstitucional"
            value={formData.afiliacionInstitucional}
            onChange={handleChange}
            options={AFILIACIONES_INSTITUCIONALES}
            placeholder="Seleccione su vinculación / institución"
            error={errors.afiliacionInstitucional}
            required
            disabled={loading}
            helperText="Indica la relación o estatus con la comunidad académica."
          />
        </div>

        {/* Fila 5: Contraseña y Confirmación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contraseña"
            name="contrasena"
            type={showPassword ? 'text' : 'password'}
            value={formData.contrasena}
            onChange={handleChange}
            placeholder="Mínimo 8 caracteres"
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
          <Input
            label="Confirmar Contraseña"
            name="confirmarContrasena"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmarContrasena}
            onChange={handleChange}
            placeholder="Repita su contraseña"
            error={errors.confirmarContrasena}
            required
            disabled={loading}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="hover:text-[#1f2023] focus:outline-none cursor-pointer"
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showConfirmPassword ? (
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
        </div>

        {/* Requisitos de contraseña */}
        <p className="text-xs text-[#5b5f66] leading-relaxed bg-[#f7f7f8] p-3 rounded-[8px] border border-[#e5e7ea]">
          <strong className="text-[#1f2023]">Requisitos de seguridad:</strong> mínimo 8 caracteres, al menos una mayúscula, una minúscula, un dígito numérico y un carácter especial (@$!%*?&._-#).
        </p>

        {/* Botón de envío */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            Registrarse en SIGEA
          </Button>
        </div>

        {/* Pie informativo */}
        <div className="text-center pt-2">
          <p className="text-xs text-[#5b5f66]">
            ¿Ya tienes una cuenta registrada?{' '}
            <a href="#login" className="text-[#a6192e] font-semibold hover:underline">
              Iniciar Sesión
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
