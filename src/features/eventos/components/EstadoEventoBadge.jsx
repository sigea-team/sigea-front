import { ESTADOS_EVENTO } from '../eventoUtils';

/**
 * @file EstadoEventoBadge.jsx
 * @description Píldora con el estado de un evento (HU-04, Criterio 4).
 * Usa solo los tokens del sistema de diseño: el estado se distingue por el texto
 * y por el color del punto (brand-600 para el estado editable "en configuración").
 * @module features/eventos/components/EstadoEventoBadge
 */

const PUNTO_POR_ESTADO = {
  en_configuracion: 'bg-[#a6192e]',
  habilitado: 'bg-[#1f2023]',
  en_ejecucion: 'bg-[#5b5f66]',
  cerrado: 'bg-[#9ca0a6]',
};

/**
 * @param {{ estado: 'en_configuracion'|'habilitado'|'en_ejecucion'|'cerrado' }} props
 */
export default function EstadoEventoBadge({ estado }) {
  const cerrado = estado === 'cerrado';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
        cerrado
          ? 'bg-[#edeeef] text-[#5b5f66] border-[#d8dadf]'
          : 'bg-[#f7f7f8] text-[#1f2023] border-[#e5e7ea]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${PUNTO_POR_ESTADO[estado] || 'bg-[#9ca0a6]'}`} aria-hidden="true" />
      {ESTADOS_EVENTO[estado] || estado}
    </span>
  );
}
