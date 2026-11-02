import { useState } from 'react';
import Swal from 'sweetalert2';
import { Calendar, Clock, Plus, Trash2, User } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import AlertaConflicto from './AlertaConflicto';
import {
  formatearHora,
  validarFranjaDisponibilidad,
  verificarConflictosCambioDisponibilidad,
} from '../salaUtils';

/**
 * @file DisponibilidadPonenteModal.jsx
 * @description Configuración de rangos de disponibilidad horaria para un ponente registrado (HU-20: Criterios 2 y 5).
 * Guarda las franjas de disponibilidad y advierte si el cambio genera conflictos con actividades asignadas al ponente.
 */
export default function DisponibilidadPonenteModal({
  isOpen,
  ponente,
  actividadesPonente = [],
  onClose,
  onGuardar,
}) {
  const [franjas, setFranjas] = useState(
    Array.isArray(ponente?.disponibilidad) ? structuredClone(ponente.disponibilidad) : []
  );

  const [nuevaFranja, setNuevaFranja] = useState({
    fecha: '',
    horaInicio: '08:00',
    horaFin: '12:00',
  });

  const [errorFranja, setErrorFranja] = useState({});
  const [guardando, setGuardando] = useState(false);

  if (!isOpen || !ponente) return null;

  const nombreCompleto = `${ponente.nombres || ''} ${ponente.apellidos || ''}`.trim();

  // Criterio 5: Conflicto con actividades programadas del ponente
  const conflictoActividades = verificarConflictosCambioDisponibilidad(franjas, actividadesPonente);

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
    // Criterio 5: Advertencia si quedan actividades del ponente en conflicto
    if (conflictoActividades.hayConflicto) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: '¿Confirmar cambio de disponibilidad del ponente?',
        html: `
          <div class="text-left text-sm text-[#1f2023] space-y-2">
            <p>
              Al actualizar la disponibilidad de <strong>${nombreCompleto}</strong>,
              <strong>${conflictoActividades.actividadesEnConflicto.length} actividad(es)</strong>
              asignada(s) quedarán en conflicto (fuera de sus rangos horarios disponibles).
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
              ¿Deseas guardar los cambios de todas formas? Deberás reprogramar la actividad o reasignar el ponente.
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
      await onGuardar(ponente.personaId, franjas);
      onClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar disponibilidad',
        text: err.message || 'No se pudo guardar la disponibilidad del ponente.',
        confirmButtonColor: '#a6192e',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      titulo={`Disponibilidad — ${nombreCompleto}`}
      subtitulo={ponente.institucion || ponente.correo || 'Ponente registrado en el evento'}
      icono={User}
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
            titulo="Conflicto detectado con actividades del ponente (Criterio 5)"
            subtitulo="La nueva disponibilidad deja por fuera actividades en las que este ponente ya está programado."
            actividades={conflictoActividades.actividadesEnConflicto}
          />
        )}

        <div className="bg-[#f7f7f8] p-4 rounded-[12px] border border-[#e5e7ea] space-y-3">
          <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#a6192e]" />
            Definir rango de disponibilidad horaria (Criterio 2)
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
              <span>Añadir rango</span>
            </Button>
          </div>
        </div>

        {/* Listado de franjas actuales */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-[#1f2023] uppercase tracking-wider">
              Rangos registrados ({franjas.length})
            </h4>
            <span className="text-xs text-[#5b5f66]">Referencia para programación</span>
          </div>

          {franjas.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-[12px] border border-dashed border-[#d8dadf] bg-[#f7f7f8]/50">
              <Clock className="w-8 h-8 text-[#9ca0a6] mx-auto mb-2" />
              <p className="text-xs font-medium text-[#1f2023]">Sin disponibilidad registrada</p>
              <p className="text-[11px] text-[#5b5f66] mt-0.5">
                Agrega los rangos en los cuales este ponente puede dictar ponencias o talleres.
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
                    title="Eliminar rango"
                    aria-label={`Eliminar rango del ${f.fecha}`}
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

