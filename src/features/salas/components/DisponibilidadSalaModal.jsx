import { useState } from 'react';
import Swal from 'sweetalert2';
import { Clock } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import CalendarioDisponibilidad from './CalendarioDisponibilidad';
import {
  formatearHora,
  verificarConflictosCambioDisponibilidad,
} from '../salaUtils';

/**
 * @file DisponibilidadSalaModal.jsx
 * @description Gestión interactiva de franjas horarias de disponibilidad para una sala (HU-20: Criterios 1 y 5).
 * Integra el calendario interactivo por días de semana y fechas puntuales, mostrando
 * los horarios disponibles y los horarios ya ocupados por eventos.
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

  const [guardando, setGuardando] = useState(false);

  if (!isOpen || !sala) return null;

  // Criterio 5: Evaluación reactiva de conflicto de actividades ya programadas
  const conflictoActividades = verificarConflictosCambioDisponibilidad(franjas, actividadesSala);

  const handleGuardar = async () => {
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
        text: err?.message || 'No se pudo guardar la disponibilidad de la sala.',
        confirmButtonColor: '#a6192e',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      titulo={`Horarios y Disponibilidad — ${sala.nombre}`}
      subtitulo={`Aforo máximo: ${sala.aforoMaximo} personas • Tipo: ${
        sala.tipo === 'virtual' ? 'Virtual' : 'Física'
      }`}
      icono={Clock}
      onClose={onClose}
      ancho="max-w-3xl"
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
      <div className="space-y-4">
        <CalendarioDisponibilidad
          franjas={franjas}
          ocupaciones={sala?.ocupaciones || []}
          onChange={setFranjas}
          editable={true}
        />
      </div>
    </ModalShell>
  );
}
