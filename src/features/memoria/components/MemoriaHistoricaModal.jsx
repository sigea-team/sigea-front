import { useEffect, useState } from 'react';
import { Archive, RotateCw } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import MemoriaHistoricaDetalle from './MemoriaHistoricaDetalle';
import { memoriaHistoricaService } from '../../../api/memoriaHistoricaService';
import { interpretarErrorMemoria } from '../memoriaUtils';

/**
 * @file MemoriaHistoricaModal.jsx
 * @description Consulta de la memoria histórica de un evento (HU-28, Criterio 2). Carga la memoria consolidada y la
 * muestra solo para consulta. Se abre desde Eventos (menú «Más») y desde la página Memoria histórica.
 * @module features/memoria/components/MemoriaHistoricaModal
 */

/**
 * @param {Object} props
 * @param {{ id: number, nombre: string }} props.evento
 * @param {typeof memoriaHistoricaService} [props.api]
 * @param {function(): void} props.onClose
 * @param {function(): void} [props.onEliminar] - Si se da, muestra «Eliminar con autorización especial».
 */
export default function MemoriaHistoricaModal({ evento, api = memoriaHistoricaService, onClose, onEliminar }) {
  const [memoria, setMemoria] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    api
      .obtenerMemoria(evento.id)
      .then((datos) => {
        if (!activo) return;
        setMemoria(datos);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(interpretarErrorMemoria(err));
      });
    return () => {
      activo = false;
    };
  }, [api, evento.id, version]);

  const reintentar = () => {
    setError(null);
    setMemoria(null);
    setVersion((v) => v + 1);
  };

  let contenido;
  if (error) {
    contenido = (
      <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm space-y-1" role="alert">
        <p className="font-semibold">{error.titulo}</p>
        <div className="flex items-center justify-between gap-4">
          <span>{error.mensaje}</span>
          {error.status !== 404 && (
            <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer shrink-0">
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  } else if (!memoria) {
    contenido = (
      <p className="text-sm text-ink-600 py-6 text-center" role="status">
        Cargando la memoria histórica...
      </p>
    );
  } else {
    contenido = <MemoriaHistoricaDetalle memoria={memoria} />;
  }

  return (
    <ModalShell
      titulo="Memoria histórica"
      subtitulo={evento.nombre}
      icono={Archive}
      onClose={onClose}
      ancho="max-w-5xl"
      tituloId="memoria-historica-titulo"
      pie={
        <>
          {onEliminar && memoria && (
            <Button type="button" variant="outline" onClick={onEliminar} className="h-10 px-4 text-sm mr-auto">
              Eliminar con autorización especial
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose} className="h-10 px-4 text-sm">
            Cerrar
          </Button>
        </>
      }
    >
      {contenido}
    </ModalShell>
  );
}
