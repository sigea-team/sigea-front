import { useState, useMemo } from 'react';
import { MapPin, Clock } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import TipoSalaBadge from './TipoSalaBadge';
import AforoBadge from './AforoBadge';

/**
 * @file AsignarSalaEventoModal.jsx
 * @description Modal para vincular o añadir una sala existente del catálogo institucional a un evento específico.
 * Separa la acción de creación de sala de la acción de asociación a evento.
 * @module features/salas/components/AsignarSalaEventoModal
 */
export default function AsignarSalaEventoModal({
  isOpen,
  salasDisponibles = [],
  eventos = [],
  eventoActualId = '',
  onClose,
  onAsignar,
}) {
  const [salaSeleccionadaId, setSalaSeleccionadaId] = useState(
    salasDisponibles[0]?.id ? String(salasDisponibles[0].id) : ''
  );
  const [eventoDestinoId, setEventoDestinoId] = useState(
    eventoActualId || (eventos[0]?.id ? String(eventos[0].id) : '')
  );
  const [asignando, setAsignando] = useState(false);
  const [error, setError] = useState(null);

  const salaSeleccionada = useMemo(
    () => salasDisponibles.find((s) => String(s.id) === String(salaSeleccionadaId)),
    [salasDisponibles, salaSeleccionadaId]
  );

  const eventoDestino = useMemo(
    () => eventos.find((e) => String(e.id) === String(eventoDestinoId)),
    [eventos, eventoDestinoId]
  );

  if (!isOpen) return null;

  const opcionesSalas = [
    { value: '', label: 'Seleccionar sala del catálogo...' },
    ...salasDisponibles.map((s) => ({
      value: String(s.id),
      label: `${s.nombre} (${s.tipo === 'virtual' ? 'Virtual' : 'Física'} — Aforo: ${s.aforoMaximo})`,
    })),
  ];

  const opcionesEventos = [
    { value: '', label: 'Seleccionar evento de destino...' },
    ...eventos.map((e) => ({
      value: String(e.id),
      label: `${e.nombre} (${e.semestre || e.estado || 'Activo'})`,
    })),
  ];

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setError(null);

    if (!salaSeleccionadaId) {
      setError('Por favor selecciona una sala para añadir.');
      return;
    }
    if (!eventoDestinoId) {
      setError('Por favor selecciona el evento de destino.');
      return;
    }

    try {
      setAsignando(true);
      await onAsignar({
        sala: salaSeleccionada,
        eventoDestinoId,
        eventoDestino,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error al añadir la sala al evento.');
    } finally {
      setAsignando(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Añadir Sala a un Evento"
      subtitle="Vincular un auditorio, aula o sala virtual existente al cronograma del evento seleccionado"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleConfirmar} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-[10px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-xs">
            {error}
          </div>
        )}

        {/* 1. Selección de Sala */}
        <div>
          <Select
            id="selector-sala-asignar"
            label="Sala a Añadir"
            value={salaSeleccionadaId}
            onChange={(e) => setSalaSeleccionadaId(e.target.value)}
            options={opcionesSalas}
            required
          />
          {salasDisponibles.length === 0 && (
            <p className="text-[11px] text-[#5b5f66] mt-1">
              No hay salas en el catálogo. Primero crea una sala con el botón «Crear sala».
            </p>
          )}
        </div>

        {/* Detalle visual de la sala elegida */}
        {salaSeleccionada && (
          <div className="p-3.5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea] space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm text-[#1f2023]">{salaSeleccionada.nombre}</h4>
                {salaSeleccionada.ubicacion && (
                  <p className="text-xs text-[#5b5f66] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#a6192e] shrink-0" />
                    <span>{salaSeleccionada.ubicacion}</span>
                  </p>
                )}
              </div>
              <TipoSalaBadge tipo={salaSeleccionada.tipo} />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e5e7ea]/60 text-xs">
              <AforoBadge aforo={salaSeleccionada.aforoMaximo} />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white border border-[#e5e7ea] text-[#5b5f66]">
                <Clock className="w-3 h-3" />
                {salaSeleccionada.disponibilidad?.length || 0} franjas de disponibilidad
              </span>
            </div>
          </div>
        )}

        {/* 2. Selección de Evento Destino */}
        <div>
          <Select
            id="selector-evento-destino"
            label="Evento de Destino"
            value={eventoDestinoId}
            onChange={(e) => setEventoDestinoId(e.target.value)}
            options={opcionesEventos}
            required
          />
        </div>

        {/* Botones de acción */}
        <div className="pt-4 border-t border-[#e5e7ea] flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={asignando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={asignando || !salaSeleccionadaId || !eventoDestinoId}
          >
            {asignando ? 'Añadiendo...' : 'Añadir Sala al Evento'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
