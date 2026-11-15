import { Link } from 'react-router-dom';
import { ArrowRight, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

/**
 * @file HomeCtaBanner.jsx
 * @description Banner final de conversión e invitación a la comunidad académica.
 * @module features/home/components/HomeCtaBanner
 */
export default function HomeCtaBanner() {
  const conSesion = Boolean(useAuthStore((state) => state.token));

  return (
    <section className="py-16 sm:py-20 bg-surface-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-700 rounded-[16px] p-8 sm:p-12 lg:p-16 text-white shadow-lg relative overflow-hidden">
          {/* Acentos de fondo sutiles */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold tracking-wider uppercase text-brand-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Comunidad Académica UFPS</span>
            </div>

            <h2 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              Sé parte de los próximos eventos académicos de Ingeniería de Sistemas
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-brand-100/90 font-normal leading-relaxed max-w-2xl mx-auto">
              Únete a docentes, investigadores, evaluadores y estudiantes en una experiencia académica conectada, rigurosa y enriquecedora.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              {conSesion ? (
                <Link
                  to="/dashboard"
                  className="h-12 px-8 rounded-[8px] bg-white text-brand-700 hover:bg-brand-100 font-semibold text-sm sm:text-base inline-flex items-center gap-2.5 transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>Ir a mi panel de control</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/registro"
                    className="h-12 px-8 rounded-[8px] bg-white text-brand-700 hover:bg-brand-100 font-semibold text-sm sm:text-base inline-flex items-center gap-2.5 transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Crear cuenta en SIGEA</span>
                  </Link>

                  <Link
                    to="/login"
                    className="h-12 px-6 rounded-[8px] bg-brand-700/80 hover:bg-brand-700 border border-white/20 text-white font-medium text-sm sm:text-base inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar sesión</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
