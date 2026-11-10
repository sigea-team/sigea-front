import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { CalendarDays } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import AlertaConflicto from './AlertaConflicto';
import {
  verificarConflictoProgramacionActividad,
} from '../salaUtils';
import { parametroEventoService } from '../../../api/parametroEventoService';

/** Carga por defecto de los tipos de actividad del evento (HU-05); se puede inyectar en pruebas. */
const cargarTiposPorDefecto = (eventoId) => parametroEventoService.listar('tipos', eventoId);

/**
 * @file ProgramarActividadModal.jsx
 * @description Modal de programación y verificación de actividades en el evento (HU-20: Criterio 4).
 * Valida la actividad frente al aforo y la disponibilidad horaria de la sala y del ponente asignado,
 * advirtiendo el conflicto antes de aplicarla.
 */
export default function ProgramarActividadModal({
  isOpen,
  evento,
  salas = [],
  ponentes = [],
  onClose,
  onSubmit,
  cargarTiposActividad = cargarTiposPorDefecto,
}) {
  const [form, setForm] = useState({
    nombre: '',
    tipoActividadId: '',
    salaId: salas[0]?.id ? String(salas[0].id) : '',
    ponenteId: '',
    fecha: evento?.fechaInicio || '',
    horaInicio: '09:00',
    horaFin: '11:00',
    modalidad: 'presencial',
    inscripcionesActivas: '0',
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  // El backend exige tipoActividadId (ActividadRequest @NotNull); sin él responde 400.
  const [tiposActividad, setTiposActividad] = useState([]);
  const [estadoTipos, setEstadoTipos] = useState('cargando'); // 'cargando' | 'listo' | 'error'

  const eventoId = evento?.id;
  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    Promise.resolve(cargarTiposActividad(eventoId))
      .then((lista) => {
        if (!activo) return;
        const tipos = Array.isArray(lista) ? lista : [];
        setTiposActividad(tipos);
        setEstadoTipos('listo');
        if (tipos.length === 1) {
          setForm((p) => (p.tipoActividadId ? p : { ...p, tipoActividadId: String(tipos[0].id) }));
        }
      })
      .catch(() => {
        if (activo) setEstadoTipos('error');
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, cargarTiposActividad]);

  if (!isOpen) return null;

  const salaSeleccionada = salas.find((s) => String(s.id) === String(form.salaId));
  const ponenteSeleccionado = ponentes.find((p) => String(p.personaId) === String(form.ponenteId));

  // Criterio 4: Detección reactiva de conflicto de horario antes de confirmar
  const chequeoConflicto = verificarConflictoProgramacionActividad(
    { fecha: form.fecha, horaInicio: form.horaInicio, horaFin: form.horaFin },
    salaSeleccionada?.disponibilidad || [],
    ponenteSeleccionado ? ponenteSeleccionado.disponibilidad || [] : null
  );

  // Chequeo de aforo
  const aforoExcedido =
    salaSeleccionada &&
    Number(form.inscripcionesActivas) > 0 &&
    Number(form.inscripcionesActivas) > salaSeleccionada.aforoMaximo;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = {};
    if (!form.nombre.trim()) err.nombre = 'Escribe el nombre de la actividad.';
    if (!form.tipoActividadId) err.tipoActividadId = 'Selecciona el tipo de actividad.';
    if (!form.salaId) err.salaId = 'Selecciona una sala.';
    if (!form.fecha) err.fecha = 'Selecciona la fecha.';
    if (!form.horaInicio) err.horaInicio = 'Indica la hora de inicio.';
    if (!form.horaFin) err.horaFin = 'Indica la hora de fin.';
    if (form.horaInicio >= form.horaFin) {
      err.horaFin = 'La hora de fin debe ser posterior a la de inicio.';
    }

    if (Object.keys(err).length > 0) {
      setErrores(err);
      return;
    }

    // Criterio 4: Advertencia antes de aplicar la operación
    if (chequeoConflicto.hayConflicto || aforoExcedido) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: '¿Confirmar programación con advertencia?',
        html: `
          <div class="text-left text-sm text-ink-900 space-y-2">
            <p>Se detectaron los siguientes conflictos para esta actividad:</p>
            <ul class="list-disc list-inside text-xs text-brand-600 font-medium space-y-1">
              ${chequeoConflicto.motivos.map((m) => `<li>${m}</li>`).join('')}
              ${
                aforoExcedido
                  ? `<li>Las inscripciones (${form.inscripcionesActivas}) superan el aforo de la sala (${salaSeleccionada.aforoMaximo}).</li>`
                  : ''
              }
            </ul>
            <p class="text-xs text-ink-600 mt-2">
              ¿Deseas programarla de todas formas con la advertencia registrada?
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, programar de todos modos',
        cancelButtonText: 'Revisar horario y sala',
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
      await onSubmit({
        ...form,
        tipoActividadId: Number(form.tipoActividadId),
        salaId: Number(form.salaId),
        ponenteId: form.ponenteId ? Number(form.ponenteId) : null,
        inscripcionesActivas: Number(form.inscripcionesActivas || 0),
      });
      onClose();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al programar actividad',
        text: error.message || 'No se pudo guardar la actividad.',
        confirmButtonColor: '#a6192e',
      });
    } finally {
      setGuardando(false);
    }
  };

  const opcionesSalas = [
    { value: '', label: 'Selecciona una sala...' },
    ...salas.map((s) => ({
      value: String(s.id),
      label: `${s.nombre} (${s.tipo === 'virtual' ? 'Virtual' : 'Física'} — Aforo: ${s.aforoMaximo})`,
    })),
  ];

  const opcionesTipos = [
    {
      value: '',
      label:
        estadoTipos === 'cargando'
          ? 'Cargando tipos...'
          : tiposActividad.length === 0
            ? 'El evento no tiene tipos de actividad'
            : 'Selecciona un tipo...',
    },
    ...tiposActividad.map((t) => ({ value: String(t.id), label: t.nombre })),
  ];

  const ayudaTipos =
    estadoTipos === 'error'
      ? 'No se pudieron cargar los tipos de actividad del evento.'
      : estadoTipos === 'listo' && tiposActividad.length === 0
        ? 'Crea al menos uno en Eventos → «Tipos y líneas temáticas».'
        : null;

  const opcionesPonentes = [
    { value: '', label: 'Sin ponente asignado (opcional)' },
    ...ponentes.map((p) => ({
      value: String(p.personaId),
      label: `${p.nombres} ${p.apellidos} (${p.disponibilidad?.length || 0} franjas disponibles)`,
    })),
  ];

  return (
    <ModalShell
      titulo="Programar actividad en agenda"
      subtitulo="Asigna sala y ponente verificando horarios y aforos de referencia (HU-20)"
      icono={CalendarDays}
      onClose={onClose}
      ancho="max-w-2xl"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Programando...' : 'Programar actividad'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Criterio 4: Advertencia en vivo */}
        {chequeoConflicto.hayConflicto && (
          <AlertaConflicto
            tipo="horario"
            titulo="Advertencia de horario: Actividad fuera de disponibilidad (Criterio 4)"
            motivos={chequeoConflicto.motivos}
          />
        )}

        {aforoExcedido && (
          <AlertaConflicto
            tipo="aforo"
            titulo="Advertencia de cupo: Asistentes superan aforo de la sala (Criterio 4)"
            motivos={[
              `La sala «${salaSeleccionada.nombre}» tiene un aforo máximo de ${salaSeleccionada.aforoMaximo} personas, pero se registraron ${form.inscripcionesActivas} inscritos.`,
            ]}
          />
        )}

        <Input
          id="nombre-actividad"
          label="Nombre o título de la actividad *"
          placeholder="Ej. Taller de Algoritmos Genéticos o Keynote Principal"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          error={errores.nombre}
          autoFocus
        />

        <div>
          <Select
            id="tipo-actividad"
            label="Tipo de actividad *"
            value={form.tipoActividadId}
            onChange={(e) => setForm((p) => ({ ...p, tipoActividadId: e.target.value }))}
            options={opcionesTipos}
            error={errores.tipoActividadId}
            disabled={estadoTipos !== 'listo' || tiposActividad.length === 0}
          />
          {ayudaTipos && <p className="text-[11px] text-brand-700 mt-1">{ayudaTipos}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Select
              id="sala-actividad"
              label="Sala o espacio asignado *"
              value={form.salaId}
              onChange={(e) => setForm((p) => ({ ...p, salaId: e.target.value }))}
              options={opcionesSalas}
              error={errores.salaId}
            />
            {salaSeleccionada && (
              <p className="text-[11px] text-ink-600 mt-1">
                Disponibilidad: {salaSeleccionada.disponibilidad?.length || 0} franjas registradas.
              </p>
            )}
          </div>

          <div>
            <Select
              id="ponente-actividad"
              label="Ponente principal"
              value={form.ponenteId}
              onChange={(e) => setForm((p) => ({ ...p, ponenteId: e.target.value }))}
              options={opcionesPonentes}
            />
            {ponenteSeleccionado && (
              <p className="text-[11px] text-ink-600 mt-1">
                {ponenteSeleccionado.disponibilidad?.length
                  ? `Disponibilidad: ${ponenteSeleccionado.disponibilidad.length} franjas.`
                  : 'Sin disponibilidad horaria registrada aún.'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">Fecha *</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
              className="w-full text-xs h-9 px-2.5 rounded-lg border border-field-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errores.fecha && <p className="text-xs text-brand-700 mt-1">{errores.fecha}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">Hora inicio *</label>
            <input
              type="time"
              value={form.horaInicio}
              onChange={(e) => setForm((p) => ({ ...p, horaInicio: e.target.value }))}
              className="w-full text-xs h-9 px-2.5 rounded-lg border border-field-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errores.horaInicio && <p className="text-xs text-brand-700 mt-1">{errores.horaInicio}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">Hora fin *</label>
            <input
              type="time"
              value={form.horaFin}
              onChange={(e) => setForm((p) => ({ ...p, horaFin: e.target.value }))}
              className="w-full text-xs h-9 px-2.5 rounded-lg border border-field-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errores.horaFin && <p className="text-xs text-brand-700 mt-1">{errores.horaFin}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <Input
              id="inscripciones-actividad"
              label="Inscripciones activas iniciales"
              type="number"
              min="0"
              value={form.inscripcionesActivas}
              onChange={(e) => setForm((p) => ({ ...p, inscripcionesActivas: e.target.value }))}
              helperText="Número de asistentes esperados o inscritos."
            />
          </div>

          <div>
            <Select
              id="modalidad-actividad"
              label="Modalidad"
              value={form.modalidad}
              onChange={(e) => setForm((p) => ({ ...p, modalidad: e.target.value }))}
              options={[
                { value: 'presencial', label: 'Presencial' },
                { value: 'virtual', label: 'Virtual' },
                { value: 'hibrida', label: 'Híbrida' },
              ]}
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
