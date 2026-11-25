import { useEffect, useState } from 'react';

/**
 * @file useImagenProtegida.js
 * @description Muestra una imagen de un endpoint que exige el token (fondo o firma de la plantilla de certificados):
 * la pide como Blob y entrega una URL local para el `<img>`, que se libera al cambiar o desmontar.
 * @module features/certificados/useImagenProtegida
 */

/**
 * @param {(function(): Promise<Blob>)|null} obtener - Función que trae la imagen; `null` si no hay imagen.
 * @param {string} clave - Cambia cuando la imagen cambia (id + versión), para volver a pedirla.
 * @returns {{ url: string|null, error: boolean }}
 */
export default function useImagenProtegida(obtener, clave) {
  const [resultado, setResultado] = useState({ clave: null, url: null, error: false });
  const hayImagen = Boolean(obtener);

  useEffect(() => {
    if (!hayImagen) return undefined;
    let activo = true;
    let url = null;
    obtener()
      .then((blob) => {
        if (!activo) return;
        url = URL.createObjectURL(blob);
        setResultado({ clave, url, error: false });
      })
      .catch(() => {
        if (activo) setResultado({ clave, url: null, error: true });
      });
    return () => {
      activo = false;
      if (url) URL.revokeObjectURL(url);
    };
    // `obtener` se recrea en cada render; la imagen solo se vuelve a pedir cuando cambia la clave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, hayImagen]);

  if (!obtener || resultado.clave !== clave) return { url: null, error: false };
  return { url: resultado.url, error: resultado.error };
}
