import { useState } from 'react';
import Swal from 'sweetalert2';
import { Building, Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import AlertaConflicto from './AlertaConflicto';
import {
  TIPOS_SALA,
  validarFranjaDisponibilidad,
  validarSala,
  verificarConflictoAforo,
} from '../salaUtils';

/**
 * @file SalaFormModal.jsx
 * @description Modal para crear o editar salas y espacios de un evento (HU-20).
 * - Criterio 1: Nombre, ubicación, tipo, aforo máximo y franjas de disponibilidad.
 * - Criterio 3: Rechaza duplicidad de nombres o aforo <= 0.
 * - Criterio 4: Advierte si la modificación de aforo es superada por inscripciones activas.
 */
export default function SalaFormModal({
  isOpen,
  sala = null,
  evento,
  eventos = [],
  eventoId: eventoIdProp = '',
  salasExistentes = [],
  actividadesSala = [],
  onClose,
  onSubmit,
}) {
  const esEdicion = Boolean(sala?.id);

  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState(
    eventoIdProp || (evento?.id ? String(evento.id) : '')
  );

  const [form, setForm] = useState({
    nombre: sala?.nombre || '',
    ubicacion: sala?.ubicacion || '',
    tipo: sala?.tipo || 'fisica',
    aforoMaximo: sala?.aforoMaximo !== undefined ? String(sala.aforoMaximo) : '',
  });

  const [franjas, setFranjas] = useState(
    Array.isArray(sala?.disponibilidad) ? structuredClone(sala.disponibilidad) : []
  );

  const [nuevaFranja, setNuevaFranja] = useState({
    fecha: evento?.fechaInicio || '',
    horaInicio: '08:00',
    horaFin: '12:00',
  });

  const [errores, setErrores] = useState({});
  const [errorFranja, setErrorFranja] = useState({});
  const [conflictoAforo, setConflictoAforo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
    // Si cambia el aforo durante edición, evaluar conflicto
    if (campo === 'aforoMaximo' && esEdicion) {
      const chequeo = verificarConflictoAforo(valor, actividadesSala);
      setConflictoAforo(chequeo.hayConflicto ? chequeo : null);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Criterio 3: Validación de duplicidad y aforo positivo
    const err = validarSala(form, salasExistentes, sala?.id);
    if (Object.keys(err).length > 0) {
      setErrores(err);
      return;
    }

    // Criterio 4: Advertencia de aforo antes de aplicar
    if (esEdicion) {
      const chequeo = verificarConflictoAforo(form.aforoMaximo, actividadesSala);
      if (chequeo.hayConflicto) {
        const confirmacion = await Swal.fire({
          icon: 'warning',
          title: '¿Confirmar modificación de aforo?',
          html: `
            <p class="text-sm text-[#1f2023] mb-3">
              El nuevo aforo de <strong>${form.aforoMaximo} personas</strong> es superado por
              actividades activas que tienen hasta <strong>${chequeo.maxInscripciones} personas inscritas</strong>.
            </p>
            <p class="text-xs text-[#5b5f66]">
              Si confirma, la sala quedará en estado de sobrecupo para dichas actividades.
            </p>
          `,
          showCancelButton: true,
          confirmButtonText: 'Sí, aplicar cambio',
          cancelButtonText: 'Revisar aforo',
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
    }

    try {
      setGuardando(true);
      await onSubmit({
        ...form,
        eventoId: eventoSeleccionadoId,
        aforoMaximo: Number(form.aforoMaximo),
        disponibilidad: franjas,
      });
      onClose();
    } catch (error) {
      if (error.errores) {
        setErrores(error.errores);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar la sala',
          text: error.message || 'Ocurrió un error inesperado.',
          confirmButtonColor: '#a6192e',
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      titulo={esEdicion ? `Editar «${sala.nombre}»` : 'Registrar nueva sala'}
      subtitulo={evento ? `Evento: ${evento.nombre}` : 'Infraestructura institucional disponible para eventos'}
      icono={Building}
      onClose={onClose}
      ancho="max-w-2xl"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Registrar sala'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Selección de evento para el guardado en base de datos si no es edición */}
        {eventos.length > 0 && !esEdicion && (
          <div>
            <Select
              id="evento-sala-crear"
              label="Evento donde se registrará la sala *"
              value={eventoSeleccionadoId}
              onChange={(e) => setEventoSeleccionadoId(e.target.value)}
              options={eventos.map((ev) => ({
                value: String(ev.id),
                label: `${ev.nombre} (${ev.semestre || ev.estado || 'Activo'})`,
              }))}
              helperText="La sala quedará guardada en la base de datos asociada a este evento con su disponibilidad."
            />
          </div>
        )}

        {/* Conflicto de aforo advertencia en tiempo real (Criterio 4) */}
        {conflictoAforo && (
          <AlertaConflicto
            tipo="aforo"
            titulo="Advertencia: El nuevo aforo es inferior a inscripciones activas"
            subtitulo="Actividades programadas en esta sala tienen más asistentes inscritos que el cupo propuesto."
            actividades={conflictoAforo.actividadesAfectadas}
            nuevoAforo={form.aforoMaximo}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              id="nombre-sala"
              label="Nombre de la sala o espacio *"
              placeholder="Ej. Auditorio Eustorgio Gómez o Sala Zoom 1"
              value={form.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              error={errores.nombre}
              helperText="Debe ser único en el evento."
              autoFocus
            />
          </div>

          <div>
            <Select
              id="tipo-sala"
              label="Tipo de espacio *"
              value={form.tipo}
              onChange={(e) => handleFieldChange('tipo', e.target.value)}
              options={TIPOS_SALA}
              error={errores.tipo}
            />
          </div>

          <div>
            <Input
              id="aforo-sala"
              label="Aforo máximo *"
              type="number"
              min="1"
              step="1"
              placeholder="Ej. 150"
              value={form.aforoMaximo}
              onChange={(e) => handleFieldChange('aforoMaximo', e.target.value)}
              error={errores.aforoMaximo}
              helperText="Número entero mayor a cero."
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              id="ubicacion-sala"
              label="Ubicación o enlace *"
              placeholder={
                form.tipo === 'virtual'
                  ? 'Ej. Enlace de Zoom, Teams o Meet'
                  : 'Ej. Edificio Cread, 2do piso'
              }
              value={form.ubicacion}
              onChange={(e) => handleFieldChange('ubicacion', e.target.value)}
              error={errores.ubicacion}
            />
          </div>
        </div>

        {/* Criterio 1: Disponibilidad horaria inicial de la sala */}
        <div className="pt-3 border-t border-[#e5e7ea]">
          <h3 className="font-semibold text-sm text-[#1f2023] mb-1">
            Disponibilidad horaria de la sala (Criterio 1)
          </h3>
          <p className="text-xs text-[#5b5f66] mb-3">
            Define las franjas horarias en las cuales la sala estará disponible para programar actividades.
          </p>

          <div className="bg-[#f7f7f8] p-3.5 rounded-[10px] border border-[#e5e7ea] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#1f2023] mb-1">Fecha</label>
                <input
                  type="date"
                  value={nuevaFranja.fecha}
                  onChange={(e) => setNuevaFranja((p) => ({ ...p, fecha: e.target.value }))}
                  className="w-full text-xs h-9 px-2.5 rounded-lg border border-[#d8dadf] bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1f2023] mb-1">Hora inicio</label>
                <input
                  type="time"
                  value={nuevaFranja.horaInicio}
                  onChange={(e) => setNuevaFranja((p) => ({ ...p, horaInicio: e.target.value }))}
                  className="w-full text-xs h-9 px-2.5 rounded-lg border border-[#d8dadf] bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1f2023] mb-1">Hora fin</label>
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

            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={agregarFranja}>
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar franja</span>
              </Button>
            </div>
          </div>

          {franjas.length > 0 ? (
            <div className="mt-3 divide-y divide-[#e5e7ea] border border-[#e5e7ea] rounded-lg bg-white overflow-hidden">
              {franjas.map((f, i) => (
                <div key={f.id || i} className="px-3.5 py-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1f2023]">
                    📅 {f.fecha}: <span className="text-[#a6192e] font-semibold">{f.horaInicio} – {f.horaFin}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarFranja(i)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                    title="Eliminar franja"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9ca0a6] italic mt-2">
              No hay franjas horarias añadidas aún. Podrás agregarlas también desde la vista de disponibilidad.
            </p>
          )}
        </div>
      </form>
    </ModalShell>
  );
}

