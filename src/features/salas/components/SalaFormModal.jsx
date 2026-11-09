import { useState } from 'react';
import Swal from 'sweetalert2';
import { Building, Layers } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import AlertaConflicto from './AlertaConflicto';
import CalendarioDisponibilidad from './CalendarioDisponibilidad';
import {
  TIPOS_SALA,
  validarSala,
  verificarConflictoAforo,
} from '../salaUtils';

/**
 * @file SalaFormModal.jsx
 * @description Modal para crear o editar salas y espacios del catálogo institucional (HU-20).
 * Las salas se crean desvinculadas de cualquier evento para ser reutilizables.
 * Incluye asignación interactiva de disponibilidad mediante calendario y días de semana.
 */
export default function SalaFormModal({
  isOpen,
  sala = null,
  evento,
  salasExistentes = [],
  actividadesSala = [],
  onClose,
  onSubmit,
}) {
  const esEdicion = Boolean(sala?.id);

  const [form, setForm] = useState({
    nombre: sala?.nombre || '',
    ubicacion: sala?.ubicacion || '',
    tipo: sala?.tipo || 'fisica',
    aforoMaximo: sala?.aforoMaximo !== undefined ? String(sala.aforoMaximo) : '',
    permiteSimultaneidad: Boolean(sala?.permiteSimultaneidad),
  });

  const [franjas, setFranjas] = useState(
    Array.isArray(sala?.disponibilidad) ? structuredClone(sala.disponibilidad) : []
  );

  const [errores, setErrores] = useState({});
  const [conflictoAforo, setConflictoAforo] = useState(null);
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
    if (campo === 'aforoMaximo' && esEdicion) {
      const chequeo = verificarConflictoAforo(valor, actividadesSala);
      setConflictoAforo(chequeo.hayConflicto ? chequeo : null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validarSala(form, salasExistentes, sala?.id);
    if (Object.keys(err).length > 0) {
      setErrores(err);
      return;
    }

    if (esEdicion) {
      const chequeo = verificarConflictoAforo(form.aforoMaximo, actividadesSala);
      if (chequeo.hayConflicto) {
        const confirmacion = await Swal.fire({
          icon: 'warning',
          title: '¿Confirmar modificación de aforo?',
          html: `
            <p class="text-sm text-ink-900 mb-3">
              El nuevo aforo de <strong>${form.aforoMaximo} personas</strong> es superado por
              actividades activas que tienen hasta <strong>${chequeo.maxInscripciones} personas inscritas</strong>.
            </p>
            <p class="text-xs text-ink-600">
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
        eventoId: sala?.eventoId || null,
        aforoMaximo: Number(form.aforoMaximo),
        permiteSimultaneidad: Boolean(form.permiteSimultaneidad),
        disponibilidad: franjas,
      });
      onClose();
    } catch (error) {
      if (error?.errores) {
        setErrores(error.errores);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar la sala',
          text: error?.message || 'Ocurrió un error inesperado al guardar.',
          confirmButtonColor: '#a6192e',
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      titulo={esEdicion ? `Editar «${sala.nombre}»` : 'Registrar nueva sala o espacio'}
      subtitulo="La sala se registrará de forma independiente para ser reutilizable en diferentes eventos académicos"
      icono={Building}
      onClose={onClose}
      ancho="max-w-3xl"
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
              placeholder="Ej. Auditorio Mayor Eustorgio Gómez o Laboratorio 301"
              value={form.nombre}
              onChange={(e) => handleFieldChange('nombre', e.target.value)}
              error={errores.nombre}
              helperText="Debe ser único en el catálogo institucional."
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
              label="Ubicación o enlace de acceso"
              placeholder={
                form.tipo === 'virtual'
                  ? 'Ej. Enlace de Zoom, Teams o Meet institucional'
                  : 'Ej. Edificio Fundadores, 2do piso'
              }
              value={form.ubicacion}
              onChange={(e) => handleFieldChange('ubicacion', e.target.value)}
              error={errores.ubicacion}
            />
          </div>

          <div className="sm:col-span-2 p-3 rounded-[10px] bg-surface-muted border border-border flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-ink-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" />
                Permite actividades simultáneas
              </span>
              <p className="text-[11px] text-ink-600 mt-0.5">
                Permite programar más de una actividad en el mismo horario si ambas admiten simultaneidad (ej. salas virtuales con sub-salas).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={form.permiteSimultaneidad}
                onChange={(e) => handleFieldChange('permiteSimultaneidad', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-field-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-field-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        {/* Asignación interactiva de disponibilidad mediante calendario */}
        <div className="pt-3 border-t border-border">
          <div className="mb-3">
            <h3 className="font-semibold text-sm text-ink-900">
              Horario de disponibilidad de la sala
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Configura los días y horas en los que la sala está disponible para asignación. Puedes añadir días de la semana y rangos de manera interactiva.
            </p>
          </div>

          <CalendarioDisponibilidad
            franjas={franjas}
            ocupaciones={sala?.ocupaciones || []}
            onChange={setFranjas}
            editable={true}
            fechaSugerida={evento?.fechaInicio}
          />
        </div>
      </form>
    </ModalShell>
  );
}
