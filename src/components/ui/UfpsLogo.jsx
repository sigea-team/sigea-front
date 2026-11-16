import ufpsLogoVertical from '../../assets/ufps-logo-vertical.png';
import ufpsLogoHorizontal from '../../assets/ufps-logo-horizontal.png';

/**
 * @file UfpsLogo.jsx
 * @description Componente institucional del logo oficial de la UFPS (Universidad Francisco de Paula Santander).
 * Importa los assets directamente para garantizar que Vite resuelva el path con el `base: '/sigea-front/'`
 * tanto en desarrollo local como en producción / GitHub Pages.
 * @module components/ui/UfpsLogo
 */
export default function UfpsLogo({
  variante = 'vertical',
  className = 'h-10 w-auto object-contain',
  alt = 'Logo UFPS',
  ...props
}) {
  const src = variante === 'horizontal' ? ufpsLogoHorizontal : ufpsLogoVertical;

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

export { ufpsLogoVertical, ufpsLogoHorizontal };
