import PropTypes from 'prop-types';

/**
 * @file BotonAccion.jsx
 * @description Botón iconográfico de acción para filas de tablas en SIGEA.
 * Componente UI reutilizable en todo el sistema. Soporta estados activo,
 * deshabilitado con tooltip de motivo y variante de peligro institucional (brand-700 / brand-100).
 * @module components/ui/BotonAccion
 */

/**
 * @param {Object} props
 * @param {React.ElementType} props.icono - Icono de Lucide a renderizar.
 * @param {string} props.etiqueta - Texto accesible y título descriptivo.
 * @param {Function} props.onClick - Manejador de evento click.
 * @param {boolean} [props.disabled=false] - Indica si el botón está deshabilitado.
 * @param {string} [props.motivo] - Razón de deshabilitación para el tooltip.
 * @param {boolean} [props.peligro=false] - Aplica estilo de advertencia/eliminación.
 */
export default function BotonAccion({
  icono: Icono,
  etiqueta,
  onClick,
  disabled = false,
  motivo,
  peligro = false,
}) {
  const titulo = disabled && motivo ? motivo : etiqueta;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={titulo}
      aria-label={titulo}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-[8px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] ${
        disabled
          ? 'border-[#e5e7ea] text-[#9ca0a6] cursor-not-allowed bg-white/50'
          : peligro
          ? 'border-[#a6192e]/20 text-[#a6192e] bg-[#fdecec]/50 hover:bg-[#fdecec] cursor-pointer'
          : 'border-[#d8dadf] text-[#5b5f66] bg-white hover:bg-[#f7f7f8] hover:text-[#1f2023] cursor-pointer'
      }`}
    >
      <Icono className="w-4 h-4" />
    </button>
  );
}

BotonAccion.propTypes = {
  icono: PropTypes.elementType.isRequired,
  etiqueta: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  motivo: PropTypes.string,
  peligro: PropTypes.bool,
};
