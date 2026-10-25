/**
 * @file DashboardPage.jsx
 * @description Panel principal al que se redirige tras un login exitoso.
 * Integrado con MainLayout y Sidebar siguiendo el sistema de diseño SIGEA.
 * @module pages/DashboardPage
 */

import MainLayout from '../components/ui/MainLayout';
import { useAuth } from '../context/AuthContext';
import { RUTA_MI_PERFIL_CONFERENCISTA, esModoConferencista, useAuthStore } from '../store/authStore';
import BannerModoPonente from '../features/convocatorias/components/BannerModoPonente';
import BannerModoEvaluador from '../features/evaluaciones/components/BannerModoEvaluador';

export default function DashboardPage() {
  const { usuario: contextUser } = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = contextUser || storeUser;

  const nombreCompleto = usuario?.nombreCompleto || 'Usuario SIGEA';
  const email = usuario?.email || usuario?.correo || 'No especificado';
  const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles.join(', ') : 'No especificado');
  const afiliacion = typeof usuario?.afiliacion === 'object' ? usuario.afiliacion?.nombreAfiliacion : usuario?.afiliacion;

  const esPonente =
    usuario?.modoIngreso === 'PONENTE' ||
    usuario?.roles?.includes('PONENTE') ||
    usuario?.roles?.includes('AUTOR');
  const esConferencista = esModoConferencista(usuario);

  const esEvaluador =
    usuario?.modoIngreso === 'EVALUADOR' ||
    usuario?.roles?.includes('EVALUADOR') ||
    usuario?.roles?.includes('ROLE_EVALUADOR');

  return (
    <MainLayout title="Dashboard Principal" activeNav="dashboard">
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e]">
            SIGEA — Panel General
          </span>
          <h1 className="font-serif-title text-2xl text-[#1f2023] mt-1">
            Bienvenido, {nombreCompleto}
          </h1>
          <p className="text-sm text-[#5b5f66] mt-1">
            Sistema Integral de Gestión de Eventos Académicos (SIGEA) — UFPS Cúcuta.
          </p>
        </div>

        {/* Banner destacado para modo Ponente */}
        {esPonente && <BannerModoPonente enlaceConvocatorias="#/convocatorias" />}

        {/* Banner destacado para modo Evaluador (HU-17) */}
        {esEvaluador && <BannerModoEvaluador enlaceEvaluaciones="/evaluaciones" />}

        {/* HU-12: acceso directo a la trayectoria del conferencista invitado */}
        {esConferencista && (
          <div className="bg-[#fdecec] border border-[#a6192e]/30 rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#a6192e] text-white rounded-full mb-1">
                Modo Conferencista Activo
              </span>
              <h2 className="text-base font-bold text-[#1f2023]">Tu trayectoria académica y profesional</h2>
              <p className="text-xs text-[#5b5f66] mt-1 max-w-xl">
                Revisa y actualiza tu biografía, estudios y publicaciones. Los cambios se ven de inmediato en la
                página pública de los eventos en los que participas.
              </p>
            </div>
            <a
              href={`#${RUTA_MI_PERFIL_CONFERENCISTA}`}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#a6192e] hover:bg-[#7a0c1e] text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0 shadow-xs"
            >
              Ir a mi perfil de conferencista
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-xs font-medium text-[#5b5f66]">Convocatorias Activas</p>
            <p className="font-serif-title text-3xl text-[#a6192e] mt-2">12</p>
          </div>
          <div className="p-5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-xs font-medium text-[#5b5f66]">Eventos Programados</p>
            <p className="font-serif-title text-3xl text-[#1f2023] mt-2">8</p>
          </div>
          <div className="p-5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-xs font-medium text-[#5b5f66]">Certificados Emitidos</p>
            <p className="font-serif-title text-3xl text-[#1f2023] mt-2">145</p>
          </div>
        </div>

        <div className="text-sm text-[#5b5f66] bg-[#f7f7f8] border border-[#e5e7ea] rounded-[12px] p-5 space-y-2">
          <h3 className="font-semibold text-[#1f2023] text-base mb-2">Información de la Sesión Actual</h3>
          <p><strong className="text-[#1f2023]">Nombre Completo:</strong> {nombreCompleto}</p>
          <p><strong className="text-[#1f2023]">Correo Electrónico:</strong> {email}</p>
          <p><strong className="text-[#1f2023]">Perfil de Ingreso:</strong> {esConferencista ? 'Conferencista invitado' : esEvaluador ? 'Evaluador de Propuestas (HU-17)' : esPonente ? 'Ponente / Autor de Convocatorias' : 'Asistente General'}</p>
          <p><strong className="text-[#1f2023]">Rol del Sistema:</strong> {rol}</p>
          {afiliacion && <p><strong className="text-[#1f2023]">Afiliación Institucional:</strong> {afiliacion}</p>}
        </div>
      </div>
    </MainLayout>
  );
}
