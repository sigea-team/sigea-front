import { useState } from 'react';
import Swal from 'sweetalert2';
import { Trash2, ShieldAlert } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
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

  if (!isOpen || !evento) return null;

  const noEditable = !esEditable(evento);
  const tieneEdiciones = edicionesDerivadas > 0;
  const bloqueado = noEditable || tieneEdiciones;

  const confirmar = async () => {
    setEliminando(true);
    try {
      await onConfirm(evento);
    } catch (err) {
      setEliminando(false);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: extraerError(err).mensaje,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]' },
      });
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
        {noEditable && (
          <div>
            <p className="text-sm font-semibold text-[#1f2023]">El evento ya no está en configuración</p>
            <p className="text-sm text-[#5b5f66] mt-1 leading-relaxed">
              Su estado es «{ESTADOS_EVENTO[evento.estado] || evento.estado}». Solo se pueden eliminar eventos en
              configuración, para conservar el historial de los eventos realizados.
            </p>
          </div>
        )}

        {!noEditable && tieneEdiciones && (
          <div>
            <p className="text-sm font-semibold text-[#1f2023]">Es el evento base de otras ediciones</p>
            <p className="text-sm text-[#5b5f66] mt-1 leading-relaxed">
              Tiene {edicionesDerivadas} {edicionesDerivadas === 1 ? 'edición vinculada' : 'ediciones vinculadas'}.
              Elimina primero esas ediciones para no romper el historial.
            </p>
          </div>
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
