import { esConvocatoriaExpirada } from '../convocatoriaUtils';

/**
 * @file EstadoConvocatoriaBadge.jsx
 * @description Badge/pill para el estado de una convocatoria en SIGEA.
 * Muestra BORRADOR, ABIERTA, o CERRADA (por fecha cumplida o estado explícito).
 * Respeta la paleta institucional (brand-600 #a6192e, brand-100 #fdecec, surface-muted, ink-600).
 * @module features/convocatorias/components/EstadoConvocatoriaBadge
 */
export default function EstadoConvocatoriaBadge({ estado, fechaCierre }) {
  const expirada = fechaCierre ? esConvocatoriaExpirada(fechaCierre) : false;

  if (estado === 'BORRADOR') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f7f7f8] text-[#5b5f66] border border-[#d8dadf]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca0a6] mr-1.5"></span>
        Borrador
      </span>
    );
  }

  if (expirada || estado === 'CERRADA') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fdecec] text-[#7a0c1e] border border-[#a6192e]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#a6192e] mr-1.5"></span>
        Cerrada (Vencida)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
      Abierta
    </span>
  );
}
