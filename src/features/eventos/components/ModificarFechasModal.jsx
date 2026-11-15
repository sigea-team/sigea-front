import { useState } from 'react';
import Swal from 'sweetalert2';
import { CalendarDays } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
import { extraerError, formatearRango } from '../eventoUtils';

/**
 * @file ModificarFechasModal.jsx
 * @description Modal para cambiar (por ejemplo, ampliar) las fechas de un evento ya publicado
 * o en ejecución. En ejecución solo se puede mover la fecha de fin. El resto de la
 * configuración no cambia. El padre debe montarlo con una `key` distinta por evento.
 * @module features/eventos/components/ModificarFechasModal
 */

/** Fecha de hoy en formato AAAA-MM-DD según el reloj local. */
function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - Evento habilitado o en ejecución.
 * @param {function(): void} props.onClose
 * @param {function(Object): Promise<any>} props.onSubmit - Recibe { fechaInicio, fechaFin }.
 */
export default function ModificarFechasModal({ isOpen, evento, onClose, onSubmit }) {
  const [form, setForm] = useState({
    fechaInicio: evento?.fechaInicio || '',
    fechaFin: evento?.fechaFin || '',
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  if (!isOpen || !evento) return null;

  const enEjecucion = evento.estado === 'en_ejecucion';
  const hoy = hoyISO();

  const cambiar = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  const validar = () => {
    const e = {};
    if (!form.fechaInicio) e.fechaInicio = 'La fecha de inicio es obligatoria.';
    if (!form.fechaFin) e.fechaFin = 'La fecha de fin es obligatoria.';
    if (!enEjecucion && form.fechaInicio && form.fechaInicio < hoy) {
      e.fechaInicio = 'La fecha de inicio no puede ser anterior a hoy.';
    }
    if (form.fechaFin && form.fechaFin < hoy) e.fechaFin = 'La fecha de fin no puede ser anterior a hoy.';
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      e.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.';
    }
    if (!e.fechaInicio && !e.fechaFin && form.fechaInicio === evento.fechaInicio && form.fechaFin === evento.fechaFin) {
      e.fechaFin = 'Las fechas son iguales a las actuales.';
    }
    return e;
  };

  const guardar = async (ev) => {
    ev?.preventDefault();
    const nuevosErrores = validar();
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    try {
      await onSubmit({ fechaInicio: form.fechaInicio, fechaFin: form.fechaFin });
    } catch (err) {
      const { mensaje, campos } = extraerError(err);
      setErrores(campos);
      setGuardando(false);
      Swal.fire({
        icon: 'error',
        title: 'No se pudieron cambiar las fechas',
        text: mensaje,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]' },
      });
    }
  };

  return (
    <ModalShell
      titulo="Modificar fechas"
      subtitulo={`«${evento.nombre}» · actualmente ${formatearRango(evento.fechaInicio, evento.fechaFin)}`}
      icono={CalendarDays}
      onClose={onClose}
      tituloId="modificar-fechas-titulo"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="modificar-fechas-form" variant="primary" loading={guardando}>
            Guardar fechas
          </Button>
        </>
      }
    >
      <form id="modificar-fechas-form" onSubmit={guardar} noValidate className="space-y-5">
        <p className="text-sm text-ink-600 leading-relaxed">
          {enEjecucion
            ? 'El evento ya está en ejecución, así que solo puedes cambiar su fecha de fin.'
            : 'Puedes mover el inicio y el fin. Si adelantas el inicio, ninguna convocatoria del evento puede cerrar después de la nueva fecha.'}
          {' '}El evento se cierra automáticamente el día siguiente a su fecha de fin.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de inicio"
            id="fechas-inicio"
            type="date"
            value={form.fechaInicio}
            onChange={cambiar('fechaInicio')}
            min={enEjecucion ? undefined : hoy}
            disabled={enEjecucion}
            required
            error={errores.fechaInicio}
          />
          <Input
            label="Fecha de fin"
            id="fechas-fin"
            type="date"
            value={form.fechaFin}
            onChange={cambiar('fechaFin')}
            min={form.fechaInicio > hoy ? form.fechaInicio : hoy}
            required
            error={errores.fechaFin}
          />
        </div>
      </form>
    </ModalShell>
  );
}
