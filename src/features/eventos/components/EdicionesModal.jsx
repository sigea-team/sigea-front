import { useEffect, useState } from 'react';
import { History, CopyPlus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
import AlertaError from './AlertaError';
import EstadoEventoBadge from './EstadoEventoBadge';
import { etiquetaModalidad, extraerError, formatearRango } from '../eventoUtils';

/**
 * @file EdicionesModal.jsx
 * @description Historial de ediciones de un evento (HU-04, Criterio 4): muestra el evento
 * base y todas sus ediciones como una línea de tiempo, del más antiguo al más reciente,
 * con el estado de cada uno. Se puede abrir desde el evento base o desde cualquier edición.
 * El padre debe montarlo con una `key` distinta por evento.
 * @module features/eventos/components/EdicionesModal
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - Evento desde el que se abrió el historial.
 * @param {{ listarEdiciones: function(number): Promise<Object> }} props.api
 * @param {function(): void} props.onClose
 * @param {function(Object): void} [props.onNuevaEdicion] - Abre la creación de una edición a partir de la indicada.
 */
export default function EdicionesModal({ isOpen, evento, api, onClose, onNuevaEdicion }) {
  const [historial, setHistorial] = useState(null);
  const [error, setError] = useState(null);
  const eventoId = evento?.id;

  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    api
      .listarEdiciones(eventoId)
      .then((data) => {
        if (activo) setHistorial(data);
      })
      .catch((err) => {
        if (activo) setError(extraerError(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, api]);

  if (!isOpen || !evento) return null;

  const ediciones = historial?.ediciones || [];
  const masReciente = ediciones[ediciones.length - 1];

  return (
    <ModalShell
      titulo={historial?.nombreEventoBase || evento.nombre}
      subtitulo={
        historial
          ? `${historial.totalEdiciones} ${historial.totalEdiciones === 1 ? 'edición registrada' : 'ediciones registradas'}, de la más antigua a la más reciente`
          : 'Historial de ediciones'
      }
      icono={History}
      onClose={onClose}
      tituloId="ediciones-titulo"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {onNuevaEdicion && masReciente && (
            <Button type="button" variant="primary" onClick={() => onNuevaEdicion(masReciente)}>
              <CopyPlus className="w-4 h-4" />
              <span>Nueva edición desde la más reciente</span>
            </Button>
          )}
        </>
      }
    >
      {error && <AlertaError titulo="No se pudo cargar el historial">{error}</AlertaError>}

      {!error && !historial && (
        <p className="text-sm text-[#5b5f66] py-8 text-center" role="status">
          Cargando ediciones...
        </p>
      )}

      {historial && (
        <ol className="relative">
          {ediciones.map((edicion, indice) => {
            const esBase = edicion.eventoBaseId === null || edicion.eventoBaseId === undefined;
            const esActual = edicion.id === evento.id;
            const esUltima = indice === ediciones.length - 1;

            return (
              <li key={edicion.id} className="relative pl-10 pb-6 last:pb-0">
                {!esUltima && (
                  <span className="absolute left-[11px] top-6 bottom-0 w-px bg-[#e5e7ea]" aria-hidden="true" />
                )}
                <span
                  className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    esActual ? 'border-[#a6192e] bg-[#fdecec]' : 'border-[#d8dadf] bg-white'
                  }`}
                  aria-hidden="true"
                >
                  <span className={`w-2 h-2 rounded-full ${esActual ? 'bg-[#a6192e]' : 'bg-[#9ca0a6]'}`} />
                </span>

                <div
                  className={`p-4 rounded-[12px] border ${
                    esActual ? 'border-[#a6192e]/30 bg-white' : 'border-[#e5e7ea] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[#1f2023]">{edicion.semestre || 'Sin semestre'}</p>
                      <p className="text-sm text-[#1f2023] mt-0.5 truncate">{edicion.nombre}</p>
                    </div>
                    <EstadoEventoBadge estado={edicion.estado} />
                  </div>

                  <p className="text-xs text-[#5b5f66] mt-2">
                    {formatearRango(edicion.fechaInicio, edicion.fechaFin)}
                    {edicion.modalidad && `, ${etiquetaModalidad(edicion.modalidad).toLowerCase()}`}
                  </p>

                  {(esBase || esActual) && (
                    <div className="flex gap-2 mt-3">
                      {esBase && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]">
                          Evento base
                        </span>
                      )}
                      {esActual && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdecec] text-[#a6192e] border border-[#a6192e]/20">
                          Consultando
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </ModalShell>
  );
}
