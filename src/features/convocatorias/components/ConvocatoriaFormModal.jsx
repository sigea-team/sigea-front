import { useState } from 'react';
import Swal from 'sweetalert2';
import { Calendar, FileText, AlertCircle } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import TextArea from '../../eventos/components/TextArea';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { validarConvocatoria } from '../convocatoriaUtils';

/**
 * @file ConvocatoriaFormModal.jsx
 * @description Modal para creación y edición de convocatorias asociadas a eventos.
 * Satisface:
 * - Criterio 1: Creación con datos completos y guardado en estado borrador.
 * - Criterio 2: Validación estricta de campos obligatorios y fechas (cierre > apertura),
 *   con alerta SweetAlert2 institucional en caso de rechazo.
 * - Criterio 3: Edición de convocatoria existente en borrador sin publicarla.
 * @module features/convocatorias/components/ConvocatoriaFormModal
 */

const EVENTOS_DISPONIBLES_DEFAULT = [
  { value: '101', label: 'Semana de la Ingeniería de Sistemas 2026-2' },
  { value: '102', label: 'Encuentro de Semilleros de Investigación UFPS' },
  { value: '103', label: 'Congreso Internacional de Computación Aplicada 2026' },
];

/**
 * Modal para creación y edición de convocatorias en estado borrador.
 * @param {Object} props
 * @param {boolean} props.isOpen - Indica si el modal está visible.
 * @param {Object} [props.convocatoria] - Objeto convocatoria para modo edición (null para crear).
 * @param {Array<{value: string, label: string}>} [props.eventosDisponibles] - Lista de eventos asociables.
 * @param {Function} props.onClose - Callback al cancelar o cerrar el modal.
 * @param {Function} props.onSubmit - Callback al confirmar el formulario (guarda en borrador).
 */
export default function ConvocatoriaFormModal({
  isOpen,
  convocatoria,
  eventosDisponibles = EVENTOS_DISPONIBLES_DEFAULT,
  onClose,
  onSubmit,
}) {
  const esEdicion = Boolean(convocatoria?.id);

  const [form, setForm] = useState(() => ({
    eventoId: convocatoria?.eventoId ? String(convocatoria.eventoId) : (eventosDisponibles[0]?.value || ''),
    eventoNombre: convocatoria?.eventoNombre || '',
    titulo: convocatoria?.titulo || '',
    descripcion: convocatoria?.descripcion || '',
    requisitos: convocatoria?.requisitos || '',
    fechaApertura: convocatoria?.fechaApertura || '',
    fechaCierre: convocatoria?.fechaCierre || '',
  }));

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const handleChange = (campo, valor) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === 'eventoId') {
        const item = eventosDisponibles.find((e) => String(e.value) === String(valor));
        if (item) next.eventoNombre = item.label;
      }
      return next;
    });

    if (errores[campo]) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia[campo];
        return copia;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Criterio 2: Validar campos obligatorios y coherencia de fechas
    const errs = validarConvocatoria(form);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);

      // Alerta con SweetAlert2 institucional
      Swal.fire({
        icon: 'error',
        title: 'Verifique los campos requeridos',
        text: errs.fechaCierre || 'Diligencie todos los campos obligatorios antes de continuar.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
      return;
    }

    setEnviando(true);
    try {
      await onSubmit({
        ...form,
        eventoId: Number(form.eventoId) || form.eventoId,
        eventoNombre:
          form.eventoNombre ||
          eventosDisponibles.find((ev) => String(ev.value) === String(form.eventoId))?.label ||
          'Evento UFPS',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar la convocatoria',
        text: err?.message || 'Ocurrió un error inesperado al procesar la solicitud.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell
      titulo={esEdicion ? 'Editar convocatoria (Borrador)' : 'Crear nueva convocatoria'}
      subtitulo={
        esEdicion
          ? 'Actualiza las fechas o detalles de la convocatoria sin publicarla (Criterio 3).'
          : 'Define las fechas y requisitos; la convocatoria quedará guardada en borrador (Criterio 1).'
      }
      icono={FileText}
      onClose={onClose}
      ancho="max-w-2xl"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} loading={enviando}>
            {esEdicion ? 'Guardar cambios' : 'Guardar en borrador'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Evento */}
        <Select
          id="convocatoria-evento"
          label="Evento académico asociado *"
          value={form.eventoId}
          onChange={(e) => handleChange('eventoId', e.target.value)}
          options={eventosDisponibles}
          error={errores.eventoId}
          helperText="Selecciona el evento al cual pertenecerá el proceso de recepción."
        />

        {/* Título de la convocatoria */}
        <Input
          id="convocatoria-titulo"
          label="Título de la convocatoria *"
          value={form.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          placeholder="Ej: Convocatoria de Artículos y Ponencias Científicas"
          error={errores.titulo}
          maxLength={200}
        />

        {/* Fechas de Apertura y Cierre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="convocatoria-fecha-apertura"
            type="datetime-local"
            label="Fecha y hora de apertura *"
            value={form.fechaApertura}
            onChange={(e) => handleChange('fechaApertura', e.target.value)}
            error={errores.fechaApertura}
            rightElement={<Calendar className="w-4 h-4 text-[#5b5f66]" />}
          />

          <Input
            id="convocatoria-fecha-cierre"
            type="datetime-local"
            label="Fecha y hora de cierre *"
            value={form.fechaCierre}
            onChange={(e) => handleChange('fechaCierre', e.target.value)}
            error={errores.fechaCierre}
            rightElement={<Calendar className="w-4 h-4 text-[#5b5f66]" />}
            helperText="Debe ser posterior a la fecha de apertura."
          />
        </div>

        {/* Descripción general */}
        <TextArea
          id="convocatoria-descripcion"
          label="Descripción formal del proceso *"
          value={form.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Describe el objetivo y alcance de esta convocatoria..."
          rows={3}
          maxLength={3000}
          error={errores.descripcion}
        />

        {/* Requisitos para los autores */}
        <TextArea
          id="convocatoria-requisitos"
          label="Requisitos para los autores / proponentes *"
          value={form.requisitos}
          onChange={(e) => handleChange('requisitos', e.target.value)}
          placeholder="Enumera los lineamientos, formatos permitidos (IEEE, APA, PDF) y pautas de envío..."
          rows={4}
          maxLength={3000}
          error={errores.requisitos}
        />

        <div className="bg-[#f7f7f8] rounded-[8px] p-3 border border-[#e5e7ea] flex items-start gap-2 text-xs text-[#5b5f66]">
          <AlertCircle className="w-4 h-4 text-[#a6192e] shrink-0 mt-0.5" />
          <p>
            Al registrarse, la convocatoria se guardará en <strong>estado borrador</strong>. Podrás editarla
            libremente antes de su divulgación oficial.
          </p>
        </div>
      </form>
    </ModalShell>
  );
}
