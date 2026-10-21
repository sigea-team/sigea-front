import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * @file MenuAcciones.jsx
 * @description Menú desplegable de acciones secundarias para filas de tablas en SIGEA
 * (botón «Más ▾»). Agrupa las acciones por tema, con texto e ícono, para no saturar la fila
 * de botones iconográficos.
 * <p>
 * El menú se dibuja en un portal sobre `document.body` con posición fija, de modo que no lo
 * recorta el `overflow` de la tabla. Se alinea al borde derecho del botón y se abre hacia arriba
 * cuando no cabe debajo.
 * </p>
 * Teclado (patrón WAI-ARIA «menu button»): Enter, Espacio o ↓ abren el menú y enfocan la primera
 * opción; ↑ lo abre en la última; dentro del menú ↑/↓ recorren las opciones habilitadas, Inicio/Fin
 * saltan a los extremos, Escape lo cierra y devuelve el foco al botón, y Tab lo cierra.
 * @module components/ui/MenuAcciones
 */

const ANCHO_MENU = 288;
const MARGEN = 8;

/** Alto aproximado del menú (opciones, títulos y separadores), para decidir si se abre hacia arriba. */
function estimarAlto(grupos) {
  return grupos.reduce(
    (alto, g, i) =>
      alto +
      g.acciones.reduce((suma, a) => suma + (a.disabled && a.motivo ? 54 : 36), 0) +
      (g.titulo ? 28 : 0) +
      (i > 0 ? 13 : 0),
    12
  );
}

/**
 * @typedef {Object} AccionMenu
 * @property {string} id - Identificador único dentro del menú.
 * @property {string} etiqueta - Texto visible de la opción.
 * @property {React.ElementType} [icono] - Ícono de lucide-react.
 * @property {function(): void} onClick - Acción al elegir la opción (el menú se cierra antes).
 * @property {boolean} [disabled=false] - Muestra la opción deshabilitada.
 * @property {string} [motivo] - Explica por qué está deshabilitada (se muestra bajo la etiqueta).
 * @property {boolean} [peligro=false] - Estilo de acción destructiva (rojo institucional).
 */

/**
 * @param {Object} props
 * @param {Array<{titulo?: string, acciones: AccionMenu[]}>} props.grupos - Grupos de acciones; los vacíos se omiten.
 * @param {string} [props.etiqueta='Más'] - Texto del botón.
 * @param {string} [props.ariaLabel] - Nombre accesible del botón (ej. «Más acciones de Congreso…»).
 */
export default function MenuAcciones({ grupos, etiqueta = 'Más', ariaLabel }) {
  const [posicion, setPosicion] = useState(null); // null = cerrado; { top, left, arriba }
  const [enfoqueInicial, setEnfoqueInicial] = useState('primero');
  const botonRef = useRef(null);
  const menuRef = useRef(null);
  const idMenu = useId();

  const abierto = posicion !== null;
  const gruposVisibles = grupos.filter((g) => g.acciones.length > 0);

  /**
   * Calcula dónde dibujar el menú a partir del botón: debajo si cabe; si no, arriba si cabe;
   * si no cabe en ninguno, del lado con más espacio y con scroll interno (`altoMaximo`).
   */
  const calcularPosicion = () => {
    const rect = botonRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const altoEstimado = estimarAlto(gruposVisibles);
    const espacioAbajo = window.innerHeight - rect.bottom - MARGEN * 2;
    const espacioArriba = rect.top - MARGEN * 2;
    const arriba = altoEstimado > espacioAbajo && (altoEstimado <= espacioArriba || espacioArriba > espacioAbajo);
    const left = Math.min(
      Math.max(MARGEN, rect.right - ANCHO_MENU),
      window.innerWidth - ANCHO_MENU - MARGEN
    );
    return arriba
      ? { top: rect.top - MARGEN, left, arriba: true, altoMaximo: espacioArriba }
      : { top: rect.bottom + MARGEN, left, arriba: false, altoMaximo: espacioAbajo };
  };

  const abrir = (enfoque = 'primero') => {
    setEnfoqueInicial(enfoque);
    setPosicion(calcularPosicion());
  };

  const cerrar = (devolverFoco = false) => {
    setPosicion(null);
    if (devolverFoco) botonRef.current?.focus();
  };

  const opcionesHabilitadas = () =>
    Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || []);

  // Al abrir: enfoca la primera (o última) opción y sigue al botón si la página se desplaza.
  useEffect(() => {
    if (!abierto) return undefined;
    const opciones = opcionesHabilitadas();
    (enfoqueInicial === 'ultimo' ? opciones[opciones.length - 1] : opciones[0])?.focus();

    const reubicar = () => setPosicion(calcularPosicion());
    const alHacerClicFuera = (e) => {
      if (!menuRef.current?.contains(e.target) && !botonRef.current?.contains(e.target)) cerrar();
    };
    window.addEventListener('resize', reubicar);
    window.addEventListener('scroll', reubicar, true);
    document.addEventListener('mousedown', alHacerClicFuera);
    return () => {
      window.removeEventListener('resize', reubicar);
      window.removeEventListener('scroll', reubicar, true);
      document.removeEventListener('mousedown', alHacerClicFuera);
    };
    // Solo al abrir o cerrar; reubicar no debe volver a enfocar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const teclaEnBoton = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      abrir('primero');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      abrir('ultimo');
    }
  };

  const teclaEnMenu = (e) => {
    const opciones = opcionesHabilitadas();
    const actual = opciones.indexOf(document.activeElement);
    const mover = (indice) => {
      e.preventDefault();
      opciones[(indice + opciones.length) % opciones.length]?.focus();
    };
    if (e.key === 'ArrowDown') mover(actual + 1);
    else if (e.key === 'ArrowUp') mover(actual - 1);
    else if (e.key === 'Home') mover(0);
    else if (e.key === 'End') mover(opciones.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      cerrar(true);
    } else if (e.key === 'Tab') cerrar();
  };

  const elegir = (accion) => {
    if (accion.disabled) return;
    cerrar(true);
    accion.onClick();
  };

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        aria-label={ariaLabel}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={teclaEnBoton}
        className={`h-9 pl-3.5 pr-2.5 inline-flex items-center gap-1.5 rounded-[8px] border bg-white text-[13px] font-medium text-[#1f2023] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] ${
          abierto ? 'border-[#a6192e] ring-3 ring-[#fdecec]' : 'border-[#d8dadf] hover:bg-[#f7f7f8]'
        }`}
      >
        {etiqueta}
        <ChevronDown className={`w-4 h-4 text-[#5b5f66] transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {abierto &&
        createPortal(
          <div
            ref={menuRef}
            id={idMenu}
            role="menu"
            aria-label={ariaLabel || etiqueta}
            onKeyDown={teclaEnMenu}
            style={{
              position: 'fixed',
              top: posicion.top,
              left: posicion.left,
              width: ANCHO_MENU,
              maxHeight: Math.max(160, posicion.altoMaximo),
              overflowY: 'auto',
              transform: posicion.arriba ? 'translateY(-100%)' : undefined,
            }}
            className="z-[60] bg-white border border-[#e5e7ea] rounded-[12px] p-1.5 shadow-[0_12px_32px_rgba(31,32,35,0.14),0_2px_6px_rgba(31,32,35,0.06)]"
          >
            {gruposVisibles.map((grupo, i) => (
              <div key={grupo.titulo || i} role="group" aria-label={grupo.titulo}>
                {i > 0 && <div className="h-px bg-[#e5e7ea] my-1.5 mx-1" role="separator" />}
                {grupo.titulo && (
                  <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#5b5f66]" aria-hidden="true">
                    {grupo.titulo}
                  </p>
                )}
                {grupo.acciones.map((accion) => {
                  const Icono = accion.icono;
                  return (
                    <button
                      key={accion.id}
                      type="button"
                      role="menuitem"
                      disabled={accion.disabled}
                      onClick={() => elegir(accion)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-[6px] text-left text-sm transition-colors focus:outline-none ${
                        accion.disabled
                          ? 'text-[#9ca0a6] cursor-not-allowed'
                          : accion.peligro
                          ? 'text-[#7a0c1e] hover:bg-[#fdecec] focus:bg-[#fdecec] cursor-pointer'
                          : 'text-[#1f2023] hover:bg-[#f7f7f8] focus:bg-[#f7f7f8] cursor-pointer'
                      }`}
                    >
                      {Icono && (
                        <Icono
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            accion.disabled ? 'text-[#9ca0a6]' : accion.peligro ? 'text-[#a6192e]' : 'text-[#5b5f66]'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block">{accion.etiqueta}</span>
                        {accion.disabled && accion.motivo && (
                          <span className="block text-xs text-[#5b5f66] mt-0.5">{accion.motivo}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

MenuAcciones.propTypes = {
  grupos: PropTypes.arrayOf(
    PropTypes.shape({
      titulo: PropTypes.string,
      acciones: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          etiqueta: PropTypes.string.isRequired,
          icono: PropTypes.elementType,
          onClick: PropTypes.func.isRequired,
          disabled: PropTypes.bool,
          motivo: PropTypes.string,
          peligro: PropTypes.bool,
        })
      ).isRequired,
    })
  ).isRequired,
  etiqueta: PropTypes.string,
  ariaLabel: PropTypes.string,
};
