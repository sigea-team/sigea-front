import React from 'react';

/**
 * MainLayout - Layout compartido para el sistema SIGEA
 * - Panel de marca a la izquierda (552px fijo, fondo brand-600 #a6192e)
 * - Área de contenido a la derecha (flexible, fondo surface-muted #f7f7f8)
 * - Oculta panel de marca por debajo de 980px
 */
export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-[#edeeef] text-[#1f2023]">
      {/* Panel de marca UFPS (552px fijo) */}
      <aside className="hidden min-[980px]:flex flex-col justify-between w-[552px] min-h-screen shrink-0 bg-[#a6192e] text-white p-12 select-none shadow-xl">
        <div className="space-y-8">
          {/* Logo / Escudo institucional UFPS */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md">
              <span className="text-[#a6192e] font-bold text-xl tracking-tight">UFPS</span>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-red-100 uppercase">
                Portal Institucional
              </p>
              <p className="text-sm font-medium text-white/90">
                División de Sistemas
              </p>
            </div>
          </div>

          {/* Identidad del Sistema */}
          <div className="space-y-4 pt-6">
            <h1 className="font-serif-title text-[40px] leading-tight text-white tracking-tight">
              SIGEA
            </h1>
            <p className="text-base text-red-50 leading-relaxed font-normal">
              Sistema Integral de Gestión de Eventos Académicos. Plataforma para la organización, inscripción, desarrollo y certificación de actividades académicas e investigativas.
            </p>
          </div>
        </div>

        {/* Pie de marca institucional */}
        <div className="pt-8 border-t border-white/20 text-sm text-red-100 leading-relaxed font-normal">
          <p className="font-semibold text-white">Programa de Ingeniería de Sistemas</p>
          <p>Facultad de Ingeniería</p>
          <p>Universidad Francisco de Paula Santander — Cúcuta</p>
        </div>
      </aside>

      {/* Área de contenido */}
      <main className="flex-1 min-h-screen bg-[#f7f7f8] flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[720px]">
          {children}
        </div>
      </main>
    </div>
  );
}
