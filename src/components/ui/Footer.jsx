import React from 'react';

/**
 * @file Footer.jsx
 * @description Footer global de aplicación para SIGEA.
 * Muestra el texto institucional de derechos al pie de las páginas internas.
 * @module components/ui/Footer
 */
export default function Footer({ className = '' }) {
  return (
    <footer className={`bg-white border-t border-[#e5e7ea] py-4 px-8 text-center sm:text-left ${className}`}>
      <p className="text-xs sm:text-sm text-[#5b5f66] font-normal">
        Programa de Ingeniería de Sistemas — Universidad Francisco de Paula Santander (UFPS) Cúcuta &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
}
