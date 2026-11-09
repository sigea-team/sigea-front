import React from 'react';

/**
 * @file Footer.jsx
 * @description Footer global de aplicación para SIGEA.
 * Muestra el texto institucional de derechos al pie de las páginas internas.
 * @module components/ui/Footer
 */
export default function Footer({ className = '' }) {
  return (
    <footer className={`bg-surface-page border-t border-border py-4 px-8 text-center sm:text-left ${className}`}>
      <p className="text-xs sm:text-sm text-ink-600 font-normal">
        Programa de Ingeniería de Sistemas — Universidad Francisco de Paula Santander (UFPS) Cúcuta &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
}
