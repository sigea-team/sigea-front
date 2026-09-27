import { Bell, User } from 'lucide-react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

/**
 * @file MainLayout.jsx
 * @description Layout principal de aplicación funcional para el sistema SIGEA.
 * Divide la pantalla en un Sidebar fijo de 260px a la izquierda y un área principal a la derecha
 * con Topbar (64px), contenedor central `<main>` (padding 32px) con tarjeta blanca y Footer institucional.
 * Consume los datos del usuario autenticado del AuthContext o por props.
 * @module components/ui/MainLayout
 */
export default function MainLayout({
  children,
  title = 'Dashboard Principal',
  activeNav = 'dashboard',
  onSelectNav,
  usuario: usuarioProp,
  onLogout: onLogoutProp,
}) {
  const auth = useAuth();
  const usuario = usuarioProp || auth?.usuario;

  const handleLogout = () => {
    if (onLogoutProp) {
      onLogoutProp();
    } else if (auth?.logout) {
      auth.logout();
    }
  };

  const nombreCompleto = usuario?.nombreCompleto || 'Usuario SIGEA';
  const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles[0] : 'Asistente');

  return (
    <div className="min-h-screen w-full flex bg-[#edeeef] text-[#1f2023] font-sans antialiased">
      {/* Sidebar Lateral Fijo (260px) */}
      <Sidebar
        activeItem={activeNav}
        onSelectNav={onSelectNav}
        usuario={usuario}
        onLogout={handleLogout}
      />

      {/* Área Principal de Contenido (Derecha) */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#f7f7f8] min-w-0">
        {/* Topbar Superior (64px) */}
        <header className="h-16 px-8 bg-white border-b border-[#e5e7ea] flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[#1f2023] tracking-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón de Notificaciones */}
            <button
              type="button"
              className="p-2 rounded-full text-[#5b5f66] hover:bg-[#f7f7f8] hover:text-[#1f2023] transition-colors relative cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#a6192e]"></span>
            </button>

            {/* Separador */}
            <div className="h-6 w-px bg-[#e5e7ea]"></div>

            {/* Perfil / Avatar en Topbar */}
            <div className="flex items-center gap-3 select-none">
              <div className="w-9 h-9 rounded-full bg-[#fdecec] border border-[#a6192e]/20 text-[#a6192e] flex items-center justify-center font-bold text-sm shadow-xs">
                {usuario?.avatarUrl ? (
                  <img src={usuario.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#1f2023] leading-tight">
                  {nombreCompleto}
                </p>
                <p className="text-[10px] text-[#5b5f66] capitalize">
                  {rol}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenedor Central <main> con padding de 32px (p-8) */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-6 sm:p-8 shadow-xs">
            {children}
          </div>
        </main>

        {/* Footer Global al Final */}
        <Footer />
      </div>
    </div>
  );
}
