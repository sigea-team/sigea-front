import { useState, useMemo } from 'react';
import { MapPin, Clock, AlertTriangle, Link2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import TipoSalaBadge from './TipoSalaBadge';
import AforoBadge from './AforoBadge';
import {
  formatearHora,
  obtenerFranjasDisponiblesEfectivas,
  verificarConflictoConOcupaciones,
} from '../salaUtils';

/**
 * @file AsignarSalaEventoModal.jsx
 * @description Modal para vincular una sala existente del catálogo institucional a un evento académico.
 * Muestra los horarios disponibles de la sala y previene la doble asignación de horas ya ocupadas por otros eventos.
 * Permite tanto la vinculación general de la sala como la reserva opcional de una franja horaria inicial.
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

  // Reserva opcional de franja horaria inicial
  const [reservarHorario, setReservarHorario] = useState(false);
  const [fechaReserva, setFechaReserva] = useState('');
  const [horaInicioReserva, setHoraInicioReserva] = useState('09:00');
  const [horaFinReserva, setHoraFinReserva] = useState('11:00');
  const [nombreActividadReserva, setNombreActividadReserva] = useState('');

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

  // Calcular franjas efectivas disponibles (restando horas ocupadas por cualquier evento)
  const franjasEfectivas = useMemo(() => {
    if (!salaSeleccionada) return [];
    return obtenerFranjasDisponiblesEfectivas(
      salaSeleccionada.disponibilidad || [],
      salaSeleccionada.ocupaciones || []
    );
  }, [salaSeleccionada]);

  if (!isOpen) return null;

  const opcionesSalas = [
    { value: '', label: 'Seleccionar sala del catálogo institucional...' },
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

  // Verificar si la sala ya está vinculada a este evento
  const yaEstaVinculada = Boolean(
    salaSeleccionada?.eventosVinculados?.some((e) => String(e.id) === String(eventoDestinoId)) ||
      (salaSeleccionada?.eventoId && String(salaSeleccionada.eventoId) === String(eventoDestinoId))
  );

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setError(null);

    if (!salaSeleccionadaId) {
      setError('Por favor selecciona una sala para vincular.');
      return;
    }
    if (!eventoDestinoId) {
      setError('Por favor selecciona el evento de destino.');
      return;
    }

    let datosReserva = null;
    if (reservarHorario) {
      if (!fechaReserva) {
        setError('Selecciona la fecha para la reserva de la sala.');
        return;
      }
      if (!horaInicioReserva || !horaFinReserva) {
        setError('Indica la hora de inicio y de fin.');
        return;
      }
      if (horaInicioReserva >= horaFinReserva) {
        setError('La hora de fin debe ser posterior a la de inicio.');
        return;
      }

      // Validar si el horario choca con una ocupación existente
      const chequeoOcupacion = verificarConflictoConOcupaciones(
        { fecha: fechaReserva, horaInicio: horaInicioReserva, horaFin: horaFinReserva },
        salaSeleccionada?.ocupaciones || []
      );

      if (chequeoOcupacion.hayConflicto) {
        const ocups = chequeoOcupacion.ocupacionesEnConflicto;
        setError(
          `La sala ya está ocupada en esa fecha y horario por el evento «${ocups[0]?.eventoNombre || 'otro evento'}» (${formatearHora(ocups[0]?.horaInicio)} – ${formatearHora(ocups[0]?.horaFin)}). Esas horas no están disponibles.`
        );
        return;
      }

      datosReserva = {
        fecha: fechaReserva,
        horaInicio: horaInicioReserva,
        horaFin: horaFinReserva,
        nombre: nombreActividadReserva.trim() || `Uso de ${salaSeleccionada.nombre}`,
      };
    }

    try {
      setAsignando(true);
      await onAsignar({
        sala: salaSeleccionada,
        eventoDestinoId,
        eventoDestino,
        reserva: datosReserva,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Error al vincular la sala al evento.');
    } finally {
      setAsignando(false);
    }
  };

  return (
    <ModalShell
      titulo="Vincular Sala a un Evento"
      subtitulo="Reutiliza un auditorio, aula o sala virtual del catálogo institucional asociándolo a un evento específico"
      icono={Link2}
      onClose={onClose}
      ancho="max-w-2xl"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={asignando}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirmar}
            disabled={asignando || !salaSeleccionadaId || !eventoDestinoId}
          >
            {asignando ? 'Vinculando...' : 'Vincular Sala al Evento'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleConfirmar} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-[10px] bg-brand-100 border border-brand-600 text-brand-700 text-xs">
            {error}
          </div>
        )}

        {/* 1. Selección de Sala */}
        <div>
          <Select
            id="selector-sala-asignar"
            label="Sala Institucional *"
            value={salaSeleccionadaId}
            onChange={(e) => setSalaSeleccionadaId(e.target.value)}
            options={opcionesSalas}
            required
          />
          {salasDisponibles.length === 0 && (
            <p className="text-[11px] text-ink-600 mt-1">
              No hay salas registradas en el catálogo. Primero crea una sala con el botón «Crear sala».
            </p>
          )}
        </div>

        {/* 2. Detalle y Horarios de la Sala Elegida */}
        {salaSeleccionada && (
          <div className="p-3.5 rounded-[12px] bg-surface-muted border border-border space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm text-ink-900">{salaSeleccionada.nombre}</h4>
                {salaSeleccionada.ubicacion && (
                  <p className="text-xs text-ink-600 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>{salaSeleccionada.ubicacion}</span>
                  </p>
                )}
              </div>
              <TipoSalaBadge tipo={salaSeleccionada.tipo} />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-xs">
              <AforoBadge aforo={salaSeleccionada.aforoMaximo} />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white border border-border text-ink-600">
                <Clock className="w-3 h-3" />
                {franjasEfectivas.length} franjas libres para asignación
              </span>
            </div>

            {/* Eventos a los que ya pertenece */}
            {salaSeleccionada.eventosVinculados?.length > 0 && (
              <div className="pt-2 border-t border-border text-xs text-ink-600">
                <span className="font-medium text-ink-900 block mb-1">
                  Eventos a los que ya está vinculada:
                </span>
                <div className="flex flex-wrap gap-1">
                  {salaSeleccionada.eventosVinculados.map((ev) => (
                    <span
                      key={ev.id}
                      className="px-2 py-0.5 rounded bg-white border border-border text-[11px] text-ink-900"
                    >
                      {ev.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Aviso de horarios ocupados */}
            {salaSeleccionada.ocupaciones?.length > 0 && (
              <div className="p-2.5 rounded-[8px] bg-brand-100 border border-brand-600 text-xs text-brand-700 space-y-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Horarios ya asignados a otros eventos (no disponibles):
                </span>
                <ul className="list-disc list-inside text-[11px] space-y-0.5">
                  {salaSeleccionada.ocupaciones.map((oc, i) => (
                    <li key={oc.actividadId || i}>
                      {oc.fecha}: {formatearHora(oc.horaInicio)} – {formatearHora(oc.horaFin)}
                      {' • '}
                      <em>{oc.eventoNombre}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 3. Selección de Evento Destino */}
        <div>
          <Select
            id="selector-evento-destino"
            label="Evento de Destino *"
            value={eventoDestinoId}
            onChange={(e) => setEventoDestinoId(e.target.value)}
            options={opcionesEventos}
            required
          />
          {yaEstaVinculada && (
            <p className="text-[11px] text-brand-700 mt-1 font-medium">
              Nota: La sala «{salaSeleccionada?.nombre}» ya está vinculada a este evento. Puedes reservar un nuevo horario a continuación.
            </p>
          )}
        </div>

        {/* 4. Reserva Opcional de Horario Inicial */}
        <div className="p-3.5 rounded-[12px] bg-white border border-border space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink-900">
            <input
              type="checkbox"
              checked={reservarHorario}
              onChange={(e) => {
                setReservarHorario(e.target.checked);
                if (e.target.checked && franjasEfectivas[0]) {
                  setFechaReserva(franjasEfectivas[0].fecha);
                  setHoraInicioReserva(franjasEfectivas[0].horaInicio);
                  setHoraFinReserva(franjasEfectivas[0].horaFin);
                }
              }}
              className="rounded text-brand-600 focus:ring-brand-600"
            />
            <span>Asignar fecha y horario específico de una vez para este evento (opcional)</span>
          </label>

          {reservarHorario && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Input
                  id="reserva-nombre-actividad"
                  label="Nombre o motivo de la asignación"
                  placeholder="Ej. Sesión Plenaria Inaugural"
                  value={nombreActividadReserva}
                  onChange={(e) => setNombreActividadReserva(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  id="reserva-fecha"
                  label="Fecha *"
                  type="date"
                  value={fechaReserva}
                  onChange={(e) => setFechaReserva(e.target.value)}
                  required
                />
                <Input
                  id="reserva-hora-inicio"
                  label="Hora Inicio *"
                  type="time"
                  value={horaInicioReserva}
                  onChange={(e) => setHoraInicioReserva(e.target.value)}
                  required
                />
                <Input
                  id="reserva-hora-fin"
                  label="Hora Fin *"
                  type="time"
                  value={horaFinReserva}
                  onChange={(e) => setHoraFinReserva(e.target.value)}
                  required
                />
              </div>

              {/* Franjas sugeridas libres */}
              {franjasEfectivas.length > 0 && (
                <div className="text-[11px] text-ink-600">
                  <span className="font-medium text-ink-900 block mb-1">
                    Franjas libres recomendadas de la sala:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {franjasEfectivas.slice(0, 5).map((f, i) => (
                      <button
                        key={f.id || i}
                        type="button"
                        onClick={() => {
                          setFechaReserva(f.fecha);
                          setHoraInicioReserva(f.horaInicio);
                          setHoraFinReserva(f.horaFin);
                        }}
                        className="px-2 py-0.5 rounded bg-surface-muted border border-border hover:border-brand-600 hover:text-brand-600 transition-colors"
                      >
                        {f.fecha} ({formatearHora(f.horaInicio)} - {formatearHora(f.horaFin)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </ModalShell>
  );
}
