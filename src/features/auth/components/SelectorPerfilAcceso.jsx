import { User, Rocket, Mic, Shield } from 'lucide-react';

/**
 * @file SelectorPerfilAcceso.jsx
 * @description Componente modular para la selección de perfil de ingreso en el Login de SIGEA,
 * inspirado en la barra inferior de accesos rápidos por rol de DIVISIST 2.0 (UFPS).
 * Permite alternar entre los modos de acceso:
 * - Asistente: vista estándar de participante/eventos.
 * - Ponente / Autor: habilita el módulo de convocatorias abiertas y postulación de ponencias.
 * - Conferencista: conferencista invitado; consulta y actualiza su trayectoria (HU-12).
 * - Administrador: acceso exclusivo para cuentas con rol de administrador (gestión integral).
 * @module features/auth/components/SelectorPerfilAcceso
 */

/**
 * @typedef {'asistente' | 'ponente' | 'conferencista' | 'administrador'} ModoAcceso
 */

/** Perfiles de ingreso disponibles, en el orden en que se muestran. */
const PERFILES = [
  { modo: 'asistente', etiqueta: 'Asistente', titulo: 'Ingresar como Asistente', icono: User },
  {
    modo: 'ponente',
    etiqueta: 'Ponente',
    titulo: 'Ingresar como Ponente / Autor de propuestas',
    icono: Rocket,
    insignia: 'PROPUESTAS',
  },
  {
    modo: 'conferencista',
    etiqueta: 'Conferencista',
    titulo: 'Ingresar como Conferencista invitado para actualizar tu trayectoria',
    icono: Mic,
    insignia: 'TRAYECTORIA',
  },
  {
    modo: 'administrador',
    etiqueta: 'Administrador',
    titulo: 'Ingresar como Administrador del sistema',
    icono: Shield,
    insignia: 'GESTIÓN',
  },
];

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
      <div className="flex items-center justify-center gap-1 sm:gap-3">
        {PERFILES.map(({ modo, etiqueta, titulo, icono: Icono, insignia }) => {
          const activo = modoAcceso === modo;
          return (
            <button
              key={modo}
              type="button"
              onClick={() => onChangeModo && onChangeModo(modo)}
              disabled={disabled}
              title={titulo}
              aria-pressed={activo}
              className={`group relative flex flex-col items-center gap-1 transition-all cursor-pointer p-2 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed ${
                activo ? 'text-[#a6192e] bg-[#fdecec] font-bold' : 'text-[#5b5f66] hover:text-[#a6192e] hover:bg-white'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                  activo
                    ? 'border-[#a6192e] bg-white shadow-xs text-[#a6192e]'
                    : 'border-[#e5e7ea] bg-white text-[#5b5f66] group-hover:border-[#a6192e]/40 group-hover:text-[#a6192e]'
                }`}
              >
                <Icono className="w-5 h-5" />
              </div>
              <span className="text-xs">{etiqueta}</span>
              {insignia && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-[#a6192e] text-white text-[9px] font-bold rounded-full shadow-xs whitespace-nowrap">
                  {insignia}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
