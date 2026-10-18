import { User, Rocket } from 'lucide-react';

/**
 * @file SelectorPerfilAcceso.jsx
 * @description Componente modular para la selección de perfil de ingreso en el Login de SIGEA,
 * inspirado en la barra inferior de accesos rápidos por rol de DIVISIST 2.0 (UFPS).
 * Permite alternar entre los modos de acceso:
 * - Asistente: vista estándar de participante/eventos.
 * - Ponente / Autor: habilita el módulo de convocatorias abiertas y postulación de ponencias.
 * @module features/auth/components/SelectorPerfilAcceso
 */

/**
 * @typedef {'asistente' | 'ponente'} ModoAcceso
 */

/**
 * @param {Object} props
 * @param {ModoAcceso} props.modoAcceso - Modo actualmente seleccionado.
 * @param {function(ModoAcceso): void} props.onChangeModo - Callback disparado al cambiar de perfil.
 * @param {boolean} [props.disabled=false] - Indica si los controles se encuentran deshabilitados.
 */
export default function SelectorPerfilAcceso({
  modoAcceso = 'asistente',
  onChangeModo,
  disabled = false,
}) {
  return (
    <div className="mt-8 pt-4 border-t-2 border-[#a6192e] -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 bg-[#f7f7f8] rounded-b-[16px] px-6 py-4">
      <p className="text-center text-[10px] font-bold text-[#5b5f66] uppercase tracking-wider mb-2.5">
        Selecciona tu perfil de ingreso
      </p>
      <div className="flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={() => onChangeModo && onChangeModo('asistente')}
          disabled={disabled}
          title="Ingresar como Asistente"
          className={`group flex flex-col items-center gap-1 transition-all cursor-pointer p-2 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed ${
            modoAcceso === 'asistente'
              ? 'text-[#a6192e] bg-[#fdecec] font-bold'
              : 'text-[#5b5f66] hover:text-[#a6192e] hover:bg-white'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
              modoAcceso === 'asistente'
                ? 'border-[#a6192e] bg-white shadow-xs text-[#a6192e]'
                : 'border-[#e5e7ea] bg-white text-[#5b5f66] group-hover:border-[#a6192e]/40 group-hover:text-[#a6192e]'
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <span className="text-xs">Asistente</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeModo && onChangeModo('ponente')}
          disabled={disabled}
          title="Ingresar como Ponente / Autor de propuestas"
          className={`group relative flex flex-col items-center gap-1 transition-all cursor-pointer p-2 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed ${
            modoAcceso === 'ponente'
              ? 'text-[#a6192e] bg-[#fdecec] font-bold'
              : 'text-[#5b5f66] hover:text-[#a6192e] hover:bg-white'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
              modoAcceso === 'ponente'
                ? 'border-[#a6192e] bg-white shadow-xs text-[#a6192e]'
                : 'border-[#e5e7ea] bg-white text-[#5b5f66] group-hover:border-[#a6192e]/40 group-hover:text-[#a6192e]'
            }`}
          >
            <Rocket className="w-5 h-5" />
          </div>
          <span className="text-xs">Ponente</span>
          <span className="absolute -top-1 right-0 px-1.5 py-0.2 bg-[#a6192e] text-white text-[9px] font-bold rounded-full shadow-xs">
            PROPUESTAS
          </span>
        </button>
      </div>
    </div>
  );
}
