/**
 * @file RegisterForm.jsx
 * @description Formulario de registro de nuevos usuarios para el sistema SIGEA.
 * Permite que asistentes, ponentes y organizadores creen su cuenta mediante un
 * flujo multi-campo con validación en cliente y comunicación con el backend REST.
 *
 * Flujo principal:
 * 1. Al montar el componente se cargan las afiliaciones institucionales desde la API.
 * 2. El usuario completa los campos del formulario.
 * 3. Al enviar, se ejecuta la validación local; si pasa, se llama a `registrarUsuario`.
 * 4. El resultado (éxito o error) se comunica mediante SweetAlert2.
 *
 * @module features/auth/components/RegisterForm
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { registrarUsuario, obtenerAfiliaciones } from '../../../api/authService';

/**
 * Opciones estáticas de tipo de documento de identidad aceptadas por SIGEA.
 * Cada entrada corresponde a un tipo reconocido por la legislación colombiana
 * o por acuerdos de internacionalización de la UFPS.
 *
 * @constant {Array<{value: string, label: string}>}
 */
const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PEP', label: 'Permiso Especial de Permanencia (PEP)' }
];

/**
 * Estado inicial vacío del formulario de registro.
 * Se usa tanto para la inicialización del estado como para el reset
 * tras un registro exitoso.
 *
 * @constant {RegisterFormData}
 */
const INITIAL_FORM = {
  nombres: '',
  apellidos: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  correo: '',
  afiliacionId: '',
  telefono: '',
  contrasena: '',
  confirmarContrasena: '',
};

/**
 * @typedef {Object} RegisterFormData
 * @property {string} nombres            - Nombres del usuario (máx. 100 caracteres).
 * @property {string} apellidos          - Apellidos del usuario (máx. 100 caracteres).
 * @property {string} tipoDocumento      - Tipo de documento seleccionado (CC | TI | CE | PASAPORTE | PEP).
 * @property {string} numeroDocumento    - Número de documento; solo dígitos (máx. 30 caracteres).
 * @property {string} correo             - Correo electrónico válido (máx. 150 caracteres).
 * @property {string} afiliacionId       - ID de la afiliación institucional seleccionada.
 * @property {string} telefono           - Teléfono de contacto opcional; solo dígitos (máx. 30 caracteres).
 * @property {string} contrasena         - Contraseña (8-64 chars, mayúscula, minúscula, número y símbolo).
 * @property {string} confirmarContrasena - Repetición de la contraseña para confirmación.
 */

/**
 * @typedef {Object} RegisterPayload
 * @property {string}      nombres          - Nombres sanitizados listos para envío.
 * @property {string}      apellidos        - Apellidos sanitizados listos para envío.
 * @property {string}      tipoDocumento    - Tipo de documento seleccionado.
 * @property {string}      numeroDocumento  - Número de documento sanitizado.
 * @property {string}      correo           - Correo en minúsculas listo para envío.
 * @property {string}      contrasena       - Contraseña del usuario.
 * @property {string|null} telefono         - Teléfono de contacto o null si no se proporcionó.
 * @property {number|null} afiliacionId     - ID numérico de la afiliación o null si no aplica.
 */

/**
 * Formulario de registro de usuario para SIGEA.
 *
 * Renderiza un formulario completo de creación de cuenta con los siguientes campos:
 * nombres, apellidos, tipo y número de documento, correo electrónico, teléfono
 * (opcional), afiliación institucional y contraseña (con campo de confirmación).
 *
 * Al montarse, solicita la lista de afiliaciones al backend mediante {@link obtenerAfiliaciones}.
 * Al enviarse, ejecuta validaciones en el cliente y llama a {@link registrarUsuario};
 * en caso de éxito muestra un modal SweetAlert2; en caso de error, también.
 *
 * @component
 * @returns {JSX.Element} Tarjeta de formulario de registro lista para embeber en el MainLayout.
 *
 * @example
 * // Uso dentro de una página pública de SIGEA:
 * import RegisterForm from './features/auth/components/RegisterForm';
 *
 * function AuthPage() {
 *   return (
 *     <main>
 *       <RegisterForm />
 *     </main>
 *   );
 * }
 */
export default function RegisterForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [afiliacionesOptions, setAfiliacionesOptions] = useState([]);
  const [loadingAfiliaciones, setLoadingAfiliaciones] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * Efecto de montaje: obtiene el catálogo de afiliaciones institucionales.
   *
   * Llama a {@link obtenerAfiliaciones} y transforma la respuesta en el
   * formato `{ value, label }` que requiere el componente `Select`.
   * Si la petición falla, registra el error en consola pero no interrumpe
   * la carga del formulario (el campo quedará vacío y deshabilitado).
   *
   * @async
   * @function cargarAfiliaciones
   * @inner
   * @returns {Promise<void>}
   */
  useEffect(() => {
    async function cargarAfiliaciones() {
      try {
        setLoadingAfiliaciones(true);
        const data = await obtenerAfiliaciones();
        const opciones = data.map((af) => ({
          value: String(af.id),
          label: af.nombreAfiliacion,
        }));
        setAfiliacionesOptions(opciones);
      } catch (err) {
        console.error('Error al cargar afiliaciones institucionales:', err);
      } finally {
        setLoadingAfiliaciones(false);
      }
    }
    cargarAfiliaciones();
  }, []);

  /**
   * Manejador genérico de cambio para todos los campos del formulario.
   *
   * Aplica filtrado numérico automático en los campos `numeroDocumento` y
   * `telefono` (elimina cualquier carácter que no sea dígito). Además limpia
   * el error del campo modificado si existía, para dar retroalimentación
   * visual inmediata al usuario.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement>} e - Evento nativo de cambio del input o select.
   * @returns {void}
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'numeroDocumento' || name === 'telefono') {
      const onlyNumbers = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: onlyNumbers }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  /**
   * Ejecuta la validación completa del formulario en el cliente.
   *
   * Reglas aplicadas por campo:
   * - **nombres / apellidos**: obligatorios, máximo 100 caracteres.
   * - **tipoDocumento**: obligatorio.
   * - **numeroDocumento**: obligatorio, solo dígitos, máximo 30 caracteres.
   * - **correo**: obligatorio, formato RFC básico válido, máximo 150 caracteres.
   * - **afiliacionId**: obligatorio (debe haber seleccionado un ítem).
   * - **telefono**: opcional; si se provee, solo dígitos y máximo 30 caracteres.
   * - **contrasena**: obligatoria, expresión regular de fortaleza
   *   (8-64 chars, mayúscula, minúscula, dígito y símbolo de `@$!%*?&._-#`).
   * - **confirmarContrasena**: obligatoria e igual a `contrasena`.
   *
   * Actualiza el estado `errors` con los mensajes por campo.
   *
   * @returns {boolean} `true` si todos los campos son válidos; `false` si hay al menos un error.
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

    if (!formData.afiliacionId) {
      newErrors.afiliacionId = 'Seleccione su afiliación institucional';
    }

    if (telefonoTrim) {
      if (!/^\d+$/.test(telefonoTrim)) {
        newErrors.telefono = 'El teléfono solo debe contener números';
      } else if (telefonoTrim.length > 30) {
        newErrors.telefono = 'El teléfono no puede exceder 30 caracteres';
      }
    }

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
   * Manejador de envío del formulario de registro.
   *
   * Flujo de ejecución:
   * 1. Previene el comportamiento por defecto del `form`.
   * 2. Sanitiza todos los campos de texto (`.trim()`, correo en minúsculas).
   * 3. Ejecuta {@link validate}; si falla, aborta sin continuar.
   * 4. Construye el objeto {@link RegisterPayload} y llama a {@link registrarUsuario}.
   * 5. Si el registro es exitoso: resetea el formulario y muestra un modal SweetAlert2 de éxito.
   * 6. Si el servidor devuelve errores de validación en el campo `erroresValidacion`,
   *    los inyecta en el estado `errors` para resaltarlos en línea.
   * 7. Cualquier otro error (red, servidor, inesperado) se muestra con un modal SweetAlert2 de error.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Evento nativo de envío del formulario.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

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

    const payload = {
      nombres: sanitizedData.nombres,
      apellidos: sanitizedData.apellidos,
      tipoDocumento: sanitizedData.tipoDocumento,
      numeroDocumento: sanitizedData.numeroDocumento,
      correo: sanitizedData.correo.toLowerCase(),
      contrasena: sanitizedData.contrasena,
      telefono: sanitizedData.telefono || null,
      afiliacionId: sanitizedData.afiliacionId ? Number(sanitizedData.afiliacionId) : null,
    };

    try {
      const data = await registrarUsuario(payload);
      setFormData(INITIAL_FORM);
      setErrors({});

      Swal.fire({
        icon: 'success',
        title: '¡Registro Exitoso!',
        html: `
          <p style="color: #5b5f66; font-size: 14px; margin-bottom: 12px;">
            ${data.mensaje || 'Se ha registrado la cuenta exitosamente.'}
          </p>
          <div style="background-color: #f7f7f8; border: 1px solid #e5e7ea; padding: 12px; border-radius: 8px; text-align: left; font-size: 13px; color: #1f2023;">
            <p><strong>Correo registrado:</strong> ${data.correo}</p>
            ${data.requiereVerificacion ? '<p style="color: #a6192e; margin-top: 6px; font-weight: 500;">* Recuerde verificar el enlace enviado a su correo antes de iniciar sesión.</p>' : ''}
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm'
        }
      });
    } catch (err) {
      let errorMessage = 'Error inesperado al intentar registrar el usuario.';

      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.erroresValidacion && typeof errorData.erroresValidacion === 'object') {
          setErrors(errorData.erroresValidacion);
        }
        errorMessage = errorData.message || 'Ocurrió un error al procesar la solicitud.';
      } else if (err.request) {
        errorMessage = 'No fue posible conectarse con el servidor backend. Verifique que el servicio esté activo.';
      }

      Swal.fire({
        icon: 'error',
        title: 'No se pudo completar el registro',
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

        {/* Fila 4: Afiliación Institucional (Combobox de opciones disponibles desde BD) */}
        <div>
          <Select
            label="Afiliación Institucional"
            name="afiliacionId"
            value={formData.afiliacionId}
            onChange={handleChange}
            options={afiliacionesOptions}
            placeholder={loadingAfiliaciones ? 'Cargando afiliaciones...' : 'Seleccione su vinculación / institución'}
            error={errors.afiliacionId}
            required
            disabled={loading || loadingAfiliaciones}
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
            <Link to="/login" className="text-[#a6192e] font-semibold hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}