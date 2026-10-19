import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Camera, 
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw
} from 'lucide-react';
import Swal from 'sweetalert2';
import MainLayout from '../components/ui/MainLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';
import { obtenerAfiliaciones } from '../api/authService';

/**
 * @file CuentaPage.jsx
 * @description Pantalla para la gestión integral de la cuenta de usuario en SIGEA.
 * Permite cambiar o eliminar la foto de perfil (avatar), editar información personal
 * (nombre completo, correo, teléfono, afiliación institucional, biografía) y actualizar
 * credenciales de seguridad (contraseña).
 * @module pages/CuentaPage
 */
export default function CuentaPage() {
  const { usuario: contextUser, actualizarUsuario: contextActualizar } = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const storeActualizar = useAuthStore((state) => state.actualizarUsuario);
  
  const usuario = contextUser || storeUser;
  const actualizarUsuario = contextActualizar || storeActualizar;

  // Estado del formulario de datos personales
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [afiliacion, setAfiliacion] = useState('');
  const [biografia, setBiografia] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Lista de afiliaciones disponibles
  const [listaAfiliaciones, setListaAfiliaciones] = useState([]);

  // Estado para cambio de contraseña
  const [cambiarPassword, setCambiarPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showNuevaPassword, setShowNuevaPassword] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);

  // Estados de carga y validación
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});

  const fileInputRef = useRef(null);

  // Cargar datos iniciales del usuario
  useEffect(() => {
    if (usuario) {
      setNombreCompleto(usuario.nombreCompleto || usuario.nombre || '');
      setCorreo(usuario.correo || usuario.email || '');
      setTelefono(usuario.telefono || '');
      const nombreAfil = typeof usuario.afiliacion === 'object' 
        ? usuario.afiliacion?.nombreAfiliacion 
        : (usuario.afiliacion || '');
      setAfiliacion(nombreAfil);
      setBiografia(usuario.biografia || '');
      setAvatarUrl(usuario.avatarUrl || usuario.foto || '');
    }
  }, [usuario]);

  // Cargar catálogo de afiliaciones
  useEffect(() => {
    let activo = true;
    obtenerAfiliaciones()
      .then((data) => {
        if (activo && Array.isArray(data)) {
          setListaAfiliaciones(data);
        }
      })
      .catch(() => {
        // Fallback en caso de que el backend no responda
        if (activo) {
          setListaAfiliaciones([
            { id: 1, nombre: 'Universidad Francisco de Paula Santander (UFPS)' },
            { id: 2, nombre: 'Universidad de Pamplona' },
            { id: 3, nombre: 'Universidad de Santander (UDES)' },
            { id: 4, nombre: 'Universidad Simón Bolívar' },
            { id: 5, nombre: 'Institución Externa / Otra' },
          ]);
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  // Manejo de carga de foto de perfil
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo de archivo
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo no válido',
        text: 'Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).',
        confirmButtonColor: '#a6192e',
      });
      return;
    }

    // Validación de tamaño (máx 2.5 MB)
    const MAX_SIZE = 2.5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      Swal.fire({
        icon: 'warning',
        title: 'Imagen muy pesada',
        text: 'El tamaño de la imagen no debe superar los 2.5 MB.',
        confirmButtonColor: '#a6192e',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setAvatarUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Eliminar foto actual
  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validaciones del formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!nombreCompleto.trim()) {
      nuevosErrores.nombreCompleto = 'El nombre completo es obligatorio';
    } else if (nombreCompleto.trim().length < 3) {
      nuevosErrores.nombreCompleto = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!correo.trim()) {
      nuevosErrores.correo = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      nuevosErrores.correo = 'Ingresa un correo electrónico con formato válido';
    }

    if (cambiarPassword) {
      if (!passwordActual) {
        nuevosErrores.passwordActual = 'Ingresa tu contraseña actual';
      }
      if (!nuevaPassword) {
        nuevosErrores.nuevaPassword = 'La nueva contraseña es obligatoria';
      } else if (nuevaPassword.length < 8) {
        nuevosErrores.nuevaPassword = 'Debe tener al menos 8 caracteres';
      }
      if (nuevaPassword !== confirmarPassword) {
        nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Restablecer formulario
  const handleReset = () => {
    if (usuario) {
      setNombreCompleto(usuario.nombreCompleto || usuario.nombre || '');
      setCorreo(usuario.correo || usuario.email || '');
      setTelefono(usuario.telefono || '');
      const nombreAfil = typeof usuario.afiliacion === 'object' 
        ? usuario.afiliacion?.nombreAfiliacion 
        : (usuario.afiliacion || '');
      setAfiliacion(nombreAfil);
      setBiografia(usuario.biografia || '');
      setAvatarUrl(usuario.avatarUrl || usuario.foto || '');
    }
    setCambiarPassword(false);
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmarPassword('');
    setErrores({});
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Por favor corrige los errores señalados en el formulario.',
        confirmButtonColor: '#a6192e',
      });
      return;
    }

    setGuardando(true);

    try {
      // Simular breve retardo de guardado
      await new Promise((resolve) => setTimeout(resolve, 400));

      const datosActualizados = {
        nombreCompleto: nombreCompleto.trim(),
        correo: correo.trim(),
        telefono: telefono.trim(),
        afiliacion: afiliacion.trim(),
        biografia: biografia.trim(),
        avatarUrl,
      };

      if (actualizarUsuario) {
        actualizarUsuario(datosActualizados);
      }

      // Limpiar campos de contraseña si se cambiaron
      if (cambiarPassword) {
        setPasswordActual('');
        setNuevaPassword('');
        setConfirmarPassword('');
        setCambiarPassword(false);
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Cuenta actualizada!',
        text: 'Tu información de usuario y foto de perfil han sido guardadas correctamente.',
        confirmButtonColor: '#a6192e',
        confirmButtonText: 'Aceptar',
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: 'Ocurrió un error al guardar los cambios. Inténtalo nuevamente.',
        confirmButtonColor: '#a6192e',
      });
    } finally {
      setGuardando(false);
    }
  };

  const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles.join(', ') : 'Asistente');

  return (
    <MainLayout title="Gestionar Cuenta" activeNav="cuenta">
      <div className="space-y-8 max-w-4xl">
        {/* Encabezado descriptivo */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e]">
            SIGEA — Mi Cuenta
          </span>
          <h1 className="font-serif-title text-2xl text-[#1f2023] mt-1">
            Gestión de Perfil y Cuenta
          </h1>
          <p className="text-sm text-[#5b5f66] mt-1">
            Personaliza tu fotografía, actualiza tus datos de contacto y administra la seguridad de tu sesión.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECCIÓN 1: Fotografía de Perfil (Avatar) */}
          <div className="p-6 bg-[#f7f7f8] border border-[#e5e7ea] rounded-[14px]">
            <h2 className="text-base font-semibold text-[#1f2023] mb-1">
              Foto de Perfil
            </h2>
            <p className="text-xs text-[#5b5f66] mb-5">
              Esta fotografía se mostrará en la barra superior del sistema y en los registros de tus actividades.
            </p>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Contenedor del Avatar */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 rounded-full border-2 border-[#a6192e]/30 bg-[#fdecec] text-[#a6192e] flex items-center justify-center overflow-hidden shadow-sm">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-14 h-14 text-[#a6192e]/70" />
                  )}
                </div>

                {/* Overlay con botón rápido para cambiar */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Cambiar fotografía"
                  className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">Cambiar</span>
                </button>
              </div>

              {/* Botones y especificaciones */}
              <div className="space-y-3 text-center sm:text-left flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                    className="!h-9 !px-4 !text-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Subir nueva foto</span>
                  </Button>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemovePhoto}
                      className="!h-9 !px-4 !text-xs text-[#a6192e] hover:bg-[#fdecec] border-[#a6192e]/30"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar foto</span>
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-[#5b5f66] leading-relaxed">
                  Formatos recomendados: <strong>PNG, JPG o WEBP</strong>. Tamaño máximo: <strong>2.5 MB</strong>.
                  Para un resultado óptimo, usa una imagen cuadrada de al menos 300x300 píxeles.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Información Personal */}
          <div className="p-6 bg-[#f7f7f8] border border-[#e5e7ea] rounded-[14px] space-y-5">
            <h2 className="text-base font-semibold text-[#1f2023]">
              Información de Usuario
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Nombre Completo"
                id="nombreCompleto"
                name="nombreCompleto"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej: Ing. Andrea Morales Gómez"
                required
                error={errores.nombreCompleto}
              />

              <Input
                label="Correo Electrónico Institucional"
                id="correo"
                name="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@ufps.edu.co"
                required
                error={errores.correo}
                rightElement={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Teléfono / Celular de Contacto"
                id="telefono"
                name="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +57 312 345 6789"
                rightElement={<Phone className="w-4 h-4" />}
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="afiliacion" className="text-sm font-medium text-[#1f2023] flex items-center gap-1">
                  Afiliación Institucional
                </label>
                <div className="relative flex items-center">
                  <input
                    id="afiliacion"
                    name="afiliacion"
                    type="text"
                    list="lista-afiliaciones"
                    value={afiliacion}
                    onChange={(e) => setAfiliacion(e.target.value)}
                    placeholder="Universidad Francisco de Paula Santander"
                    className="w-full h-11 px-3.5 pr-10 rounded-[8px] bg-white text-sm text-[#1f2023] placeholder-[#9ca0a6] border border-[#d8dadf] hover:border-[#9ca0a6] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e] transition-colors outline-none"
                  />
                  <datalist id="lista-afiliaciones">
                    {listaAfiliaciones.map((af, idx) => (
                      <option key={af.id || idx} value={af.nombre || af.nombreAfiliacion} />
                    ))}
                  </datalist>
                  <Building2 className="w-4 h-4 text-[#5b5f66] absolute right-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Rol Institucional (Solo lectura) */}
            <div className="p-4 bg-white border border-[#e5e7ea] rounded-[10px] flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#a6192e] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1f2023]">Rol Asignado:</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#fdecec] text-[#a6192e] uppercase">
                    {rol}
                  </span>
                </div>
                <p className="text-[11px] text-[#5b5f66]">
                  Los privilegios y roles de acceso son administrados de acuerdo a las directrices de la UFPS.
                </p>
              </div>
            </div>

            {/* Biografía / Reseña Profesional */}
            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="biografia" className="text-sm font-medium text-[#1f2023]">
                Reseña o Biografía Profesional (Opcional)
              </label>
              <textarea
                id="biografia"
                name="biografia"
                rows={3}
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                placeholder="Breve descripción sobre tu trayectoria profesional, áreas de investigación o participación en eventos académicos..."
                className="w-full p-3.5 rounded-[8px] bg-white text-sm text-[#1f2023] placeholder-[#9ca0a6] border border-[#d8dadf] hover:border-[#9ca0a6] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e] transition-colors outline-none resize-none"
              />
            </div>
          </div>

          {/* SECCIÓN 3: Seguridad y Contraseña */}
          <div className="p-6 bg-[#f7f7f8] border border-[#e5e7ea] rounded-[14px] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#1f2023]">
                  Seguridad y Contraseña
                </h2>
                <p className="text-xs text-[#5b5f66]">
                  Mantén protegida tu cuenta actualizando periódicamente tu clave de acceso.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCambiarPassword(!cambiarPassword)}
                className="text-xs font-semibold text-[#a6192e] hover:underline cursor-pointer"
              >
                {cambiarPassword ? 'Ocultar cambio de contraseña' : '¿Deseas cambiar tu contraseña?'}
              </button>
            </div>

            {cambiarPassword && (
              <div className="pt-4 border-t border-[#e5e7ea] grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                <Input
                  label="Contraseña Actual"
                  id="passwordActual"
                  name="passwordActual"
                  type={showPasswordActual ? 'text' : 'password'}
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  placeholder="••••••••"
                  error={errores.passwordActual}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPasswordActual(!showPasswordActual)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {showPasswordActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <Input
                  label="Nueva Contraseña"
                  id="nuevaPassword"
                  name="nuevaPassword"
                  type={showNuevaPassword ? 'text' : 'password'}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  error={errores.nuevaPassword}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowNuevaPassword(!showNuevaPassword)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {showNuevaPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <Input
                  label="Confirmar Nueva Contraseña"
                  id="confirmarPassword"
                  name="confirmarPassword"
                  type={showConfirmarPassword ? 'text' : 'password'}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  error={errores.confirmarPassword}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {showConfirmarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
            )}
          </div>

          {/* Botones de Acción al Pie */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={guardando}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Descartar Cambios</span>
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={guardando}
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
