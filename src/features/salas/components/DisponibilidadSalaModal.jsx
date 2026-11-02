import { useState } from 'react';
import Swal from 'sweetalert2';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import AlertaConflicto from './AlertaConflicto';
import {
  formatearHora,
  validarFranjaDisponibilidad,
  verificarConflictosCambioDisponibilidad,
} from '../salaUtils';

/**
 * @file DisponibilidadSalaModal.jsx
 * @description Gestión de franjas horarias de disponibilidad para una sala (HU-20: Criterios 1 y 5).
 * Valida solapamientos y advierte si el cambio de horario deja en conflicto actividades ya programadas.
 */
export default function DisponibilidadSalaModal({
  isOpen,
  sala,
  actividadesSala = [],
  onClose,
  onGuardar,
}) {
  const [franjas, setFranjas] = useState(
    Array.isArray(sala?.disponibilidad) ? structuredClone(sala.disponibilidad) : []
  );

  const [nuevaFranja, setNuevaFranja] = useState({
    fecha: '',
    horaInicio: '08:00',
    horaFin: '12:00',
  });

  const [errorFranja, setErrorFranja] = useState({});
  const [guardando, setGuardando] = useState(false);

  if (!isOpen || !sala) return null;

  // Criterio 5: Evaluación reactiva de conflicto de actividades ya programadas
  const conflictoActividades = verificarConflictosCambioDisponibilidad(franjas, actividadesSala);

  const agregarFranja = () => {
    const err = validarFranjaDisponibilidad(nuevaFranja, franjas);
    if (Object.keys(err).length > 0) {
      setErrorFranja(err);
      return;
    }

    setFranjas((prev) => [
      ...prev,
      {
        id: Date.now(),
        fecha: nuevaFranja.fecha,
        horaInicio: nuevaFranja.horaInicio,
        horaFin: nuevaFranja.horaFin,
      },
    ]);
    setErrorFranja({});
  };

  const eliminarFranja = (index) => {
    setFranjas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    // Criterio 5: Si hay conflicto con actividades ya programadas, advertir antes de aplicar
    if (conflictoActividades.hayConflicto) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: '¿Confirmar cambio de disponibilidad?',
        html: `
          <div class="text-left text-sm text-[#1f2023] space-y-2">
            <p>
              Al actualizar la disponibilidad de <strong>${sala.nombre}</strong>,
              <strong>${conflictoActividades.actividadesEnConflicto.length} actividad(es)</strong>
              programada(s) quedarán fuera del horario disponible registrado.
            </p>
            <ul class="list-disc list-inside text-xs text-[#a6192e] font-medium space-y-1">
              ${conflictoActividades.actividadesEnConflicto
                .map(
                  (a) =>
                    `<li>${a.nombre} (${a.fecha}: ${formatearHora(a.horaInicio)} - ${formatearHora(
                      a.horaFin
                    )})</li>`
                )
                .join('')}
            </ul>
            <p class="text-xs text-[#5b5f66] mt-2">
              ¿Deseas guardar los cambios de todas formas? Deberás reprogramar las actividades en conflicto.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, aplicar cambios',
        cancelButtonText: 'Cancelar y revisar',
        confirmButtonColor: '#a6192e',
        cancelButtonColor: '#5b5f66',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
          cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });

      if (!confirmacion.isConfirmed) {
        return;
      }
    }

    try {
      setGuardando(true);
      await onGuardar(sala.id, franjas);
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar disponibilidad',
        text: err.message || 'No se pudo guardar la disponibilidad de la sala.',
        confirmButtonColor: '#a6192e',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      titulo={`Disponibilidad horaria — ${sala.nombre}`}
      subtitulo={`Aforo máximo: ${sala.aforoMaximo} personas • Tipo: ${
        sala.tipo === 'virtual' ? 'Virtual' : 'Física'
      }`}
      icono={Clock}
      onClose={onClose}
      ancho="max-w-2xl"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar disponibilidad'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Criterio 5: Advertencia de conflicto si el cambio deja actividades fuera */}
        {conflictoActividades.hayConflicto && (
          <AlertaConflicto
            tipo="horario"
            titulo="Conflicto detectado con actividades programadas (Criterio 5)"
            subtitulo="La nueva disponibilidad de la sala deja por fuera actividades que ya habían sido programadas."
            actividades={conflictoActividades.actividadesEnConflicto}
          />
        )}

        <div className="bg-[#f7f7f8] p-4 rounded-[12px] border border-[#e5e7ea] space-y-3">
          <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#a6192e]" />
            Agregar franja de disponibilidad
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1f2023] mb-1">Fecha *</label>
              <input
                type="date"
                value={nuevaFranja.fecha}
                onChange={(e) => setNuevaFranja((p) => ({ ...p, fecha: e.target.value }))}
                className="w-full text-xs h-9 px-2.5 rounded-lg border border-[#d8dadf] bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1f2023] mb-1">Hora inicio *</label>
              <input
                type="time"
                value={nuevaFranja.horaInicio}
                onChange={(e) => setNuevaFranja((p) => ({ ...p, horaInicio: e.target.value }))}
                className="w-full text-xs h-9 px-2.5 rounded-lg border border-[#d8dadf] bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1f2023] mb-1">Hora fin *</label>
              <input
                type="time"
                value={nuevaFranja.horaFin}
                onChange={(e) => setNuevaFranja((p) => ({ ...p, horaFin: e.target.value }))}
                className="w-full text-xs h-9 px-2.5 rounded-lg border border-[#d8dadf] bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
              />
            </div>
          </div>

          {(errorFranja.horaFin || errorFranja.fecha || errorFranja.general) && (
            <p className="text-xs text-red-600 font-medium">
              {errorFranja.horaFin || errorFranja.fecha || errorFranja.general}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={agregarFranja}>
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir franja</span>
            </Button>
          </div>
        </div>

        {/* Listado de franjas actuales */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider">
              Franjas configuradas ({franjas.length})
            </h4>
            <span className="text-xs text-[#5b5f66]">Referencia para programación</span>
          </div>

          {franjas.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-[#f7f7f8]/50">
              <Clock className="w-8 h-8 text-[#9ca0a6] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#1f2023]">Sin franjas de disponibilidad</p>
              <p className="text-[11px] text-[#5b5f66] mt-0.5">
                Usa el formulario superior para habilitar fechas y horas en esta sala.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e7ea] rounded-[12px] border border-[#e5e7ea] bg-white overflow-hidden shadow-xs">
              {franjas.map((f, idx) => (
                <div key={f.id || idx} className="px-4 py-3 flex items-center justify-between hover:bg-[#f7f7f8]/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fdecec] text-[#a6192e] flex items-center justify-center font-bold text-xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1f2023]">{f.fecha}</p>
                      <p className="text-xs text-[#5b5f66]">
                        {formatearHora(f.horaInicio)} a {formatearHora(f.horaFin)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarFranja(idx)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar franja"
                    aria-label={`Eliminar franja del ${f.fecha}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

