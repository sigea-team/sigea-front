import ufpsLogoVertical from '../../assets/ufps-logo-vertical.png';
import ufpsLogoHorizontal from '../../assets/ufps-logo-horizontal.png';
import ufpsLogoWhite from '../../assets/ufps-logo-blanco.png';

/**
 * @file UfpsLogo.jsx
 * @description Componente institucional del logo oficial de la UFPS (Universidad Francisco de Paula Santander).
 * Importa los assets directamente para garantizar que Vite resuelva el path con el `base: '/sigea-front/'`
 * tanto en desarrollo local como en producción / GitHub Pages.
 * @module components/ui/UfpsLogo
 */

const LOGOS = {
  vertical: ufpsLogoVertical,
  horizontal: ufpsLogoHorizontal,
  white: ufpsLogoWhite,
};

export default function UfpsLogo({
  variante = 'vertical',
  className = 'h-10 w-auto object-contain',
  alt = 'Logo UFPS',
  ...props
}) {
  const src = LOGOS[variante] || ufpsLogoVertical;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      {...props}
    />
  );
}

export { ufpsLogoVertical, ufpsLogoHorizontal, ufpsLogoWhite };