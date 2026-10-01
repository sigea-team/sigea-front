import { useState } from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
import AlertaError from './AlertaError';
import { ESTADOS_EVENTO, esEditable, extraerError } from '../eventoUtils';

/**
 * @file EventoDeleteModal.jsx
 * @description Confirmación para eliminar un evento o edición (HU-04, Criterio 5).
 * - Bloquea la acción si el evento ya no está en configuración o si es base de otras ediciones,
 *   para conservar la integridad histórica.
 * - En otro caso pide confirmación explícita antes de eliminar.
 * El backend aplica las mismas reglas; si responde con error, se muestra aquí.
 * @module features/eventos/components/EventoDeleteModal
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento
 * @param {number} [props.edicionesDerivadas=0] - Ediciones que tienen a este evento como base.
 * @param {function(): void} props.onClose
 * @param {function(Object): Promise<any>} props.onConfirm
 */
export default function EventoDeleteModal({ isOpen, evento, edicionesDerivadas = 0, onClose, onConfirm }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !evento) return null;

  const noEditable = !esEditable(evento);
  const tieneEdiciones = edicionesDerivadas > 0;
  const bloqueado = noEditable || tieneEdiciones;

  const confirmar = async () => {
    setEliminando(true);
    setError(null);
    try {
      await onConfirm(evento);
    } catch (err) {
      setError(extraerError(err).mensaje);
      setEliminando(false);
    }
  };

  return (
    <ModalShell
      titulo={bloqueado ? 'No se puede eliminar' : 'Eliminar evento'}
      subtitulo={evento.nombre}
      icono={bloqueado ? ShieldAlert : Trash2}
      onClose={onClose}
      ancho="max-w-lg"
      tituloId="eliminar-evento-titulo"
      pie={
        bloqueado ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Entendido
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onClose} disabled={eliminando}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={confirmar} loading={eliminando}>
              <Trash2 className="w-4 h-4" />
              <span>Eliminar evento</span>
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {error && <AlertaError titulo="No se pudo eliminar">{error}</AlertaError>}

        {noEditable && (
          <AlertaError titulo="El evento ya no está en configuración">
            Su estado es «{ESTADOS_EVENTO[evento.estado] || evento.estado}». Solo se pueden eliminar eventos en
            configuración, para conservar el historial de los eventos realizados.
          </AlertaError>
        )}

        {!noEditable && tieneEdiciones && (
          <AlertaError titulo="Es el evento base de otras ediciones">
            Tiene {edicionesDerivadas} {edicionesDerivadas === 1 ? 'edición vinculada' : 'ediciones vinculadas'}.
            Elimina primero esas ediciones para no romper el historial.
          </AlertaError>
        )}

        {!bloqueado && (
          <>
            <p className="text-sm text-[#1f2023] leading-relaxed">
              ¿Eliminar <strong className="font-semibold">{evento.nombre}</strong>
              {evento.semestre ? ` (${evento.semestre})` : ''}?
            </p>
            <p className="text-xs text-[#5b5f66] bg-[#f7f7f8] p-3 rounded-[8px] border border-[#e5e7ea] leading-relaxed">
              Esta acción es permanente. También se eliminará la información que el evento tenga registrada, como
              comité organizador, presupuesto o convocatorias.
            </p>
          </>
        )}
      </div>
    </ModalShell>
  );
}
