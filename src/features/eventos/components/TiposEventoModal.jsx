import { useEffect, useState } from 'react';
import { Shapes } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
import CatalogoParametros from './CatalogoParametros';
import { extraerError } from '../eventoUtils';
import { CATALOGOS } from '../parametroUtils';
import { tipoEventoService } from '../../../api/tipoEventoService';

/**
 * @file TiposEventoModal.jsx
 * @description Administración del catálogo global de tipos de evento (congreso, seminario, taller...).
 * Reutiliza CatalogoParametros (HU-05) para agregar, editar y eliminar: un tipo que usa algún evento
 * no se puede eliminar. Al cerrar entrega la lista actualizada, para refrescar el combobox del formulario.
 * El padre debe montarlo con una `key` para reiniciar su estado en cada apertura.
 * @module features/eventos/components/TiposEventoModal
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {typeof tipoEventoService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {function(Array<Object>|null): void} props.onClose - Recibe el catálogo actualizado (o null si no cargó).
 */
export default function TiposEventoModal({ isOpen, api = tipoEventoService, onClose }) {
  const [tipos, setTipos] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    let activo = true;
    api
      .listar()
      .then((data) => {
        if (!activo) return;
        setTipos(Array.isArray(data) ? data : []);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(extraerError(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, api, version]);

  if (!isOpen) return null;

  const cerrar = () => onClose(tipos);

  const reintentar = () => {
    setErrorCarga(null);
    setVersion((v) => v + 1);
  };

  return (
    <ModalShell
      titulo="Tipos de evento"
      subtitulo="Catálogo compartido por todos los eventos y ediciones"
      icono={Shapes}
      onClose={cerrar}
      ancho="max-w-3xl"
      tituloId="tipos-evento-titulo"
      pie={
        <Button type="button" variant="outline" onClick={cerrar}>
          Cerrar
        </Button>
      }
    >
      {errorCarga && (
        <div className="py-10 text-center">
          <p className="font-semibold text-[#1f2023]">No se pudieron cargar los tipos de evento</p>
          <p className="text-sm text-[#5b5f66] mt-1">{errorCarga}</p>
          <button
            type="button"
            onClick={reintentar}
            className="text-xs mt-2 text-[#a6192e] font-semibold underline cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {!errorCarga && tipos === null && (
        <p className="text-sm text-[#5b5f66] py-10 text-center" role="status">
          Cargando tipos de evento...
        </p>
      )}

      {!errorCarga && tipos !== null && (
        <CatalogoParametros
          config={CATALOGOS.tiposEvento}
          items={tipos}
          modificable
          acciones={api}
          onCambio={setTipos}
        />
      )}
    </ModalShell>
  );
}
