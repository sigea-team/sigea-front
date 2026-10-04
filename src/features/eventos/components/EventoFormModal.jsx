import { useState } from 'react';
import Swal from 'sweetalert2';
import { CalendarPlus, Pencil } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
import TextArea from './TextArea';
import {
  LIMITES,
  MODALIDADES,
  calcularSemestre,
  extraerError,
  textoONulo,
  validarEvento,
} from '../eventoUtils';

/**
 * @file EventoFormModal.jsx
 * @description Modal para crear un evento (HU-04, Criterio 1) o modificar su configuración
 * mientras está en configuración (Criterio 2). Valida los datos obligatorios antes de enviar
 * y muestra los errores que devuelva el backend (Criterio 5).
 * El padre debe montarlo con una `key` distinta por evento para reiniciar el formulario.
 * @module features/eventos/components/EventoFormModal
 */

function formularioInicial(evento) {
  return {
    nombre: evento?.nombre || '',
    tipo: evento?.tipo || '',
    modalidad: evento?.modalidad || '',
    fechaInicio: evento?.fechaInicio || '',
    fechaFin: evento?.fechaFin || '',
    semestre: evento?.semestre || '',
    objetivo: evento?.objetivo || '',
    descripcion: evento?.descripcion || '',
  };
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} [props.evento] - Evento a editar; null para crear uno nuevo.
 * @param {function(): void} props.onClose
 * @param {function(Object): Promise<any>} props.onSubmit - Recibe el payload para la API. Si lanza error, el modal lo muestra.
 */
export default function EventoFormModal({ isOpen, evento = null, onClose, onSubmit }) {
  const editando = Boolean(evento?.id);
  const [form, setForm] = useState(() => formularioInicial(evento));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const cambiar = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  const semestreSugerido = calcularSemestre(form.fechaInicio);

  const guardar = async (e) => {
    e?.preventDefault();
    const nuevosErrores = validarEvento(form);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    try {
      await onSubmit({
        nombre: form.nombre.trim(),
        tipo: form.tipo.trim(),
        modalidad: form.modalidad,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        semestre: textoONulo(form.semestre),
        objetivo: textoONulo(form.objetivo),
        descripcion: textoONulo(form.descripcion),
      });
    } catch (err) {
      const { mensaje, campos } = extraerError(err);
      setErrores(campos);
      setGuardando(false);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar el evento',
        text: mensaje,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]' },
      });
    }
  };

  return (
    <ModalShell
      titulo={editando ? `Editar «${evento.nombre}»` : 'Crear evento'}
      subtitulo={
        editando
          ? 'Puedes cambiar la configuración mientras el evento no esté publicado.'
          : 'El evento quedará en configuración hasta que se apruebe y publique.'
      }
      icono={editando ? Pencil : CalendarPlus}
      onClose={onClose}
      tituloId="evento-form-titulo"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="evento-form" variant="primary" loading={guardando}>
            {editando ? 'Guardar cambios' : 'Crear evento'}
          </Button>
        </>
      }
    >
      <form id="evento-form" onSubmit={guardar} noValidate className="space-y-5">
        <Input
          label="Nombre del evento"
          id="evento-nombre"
          value={form.nombre}
          onChange={cambiar('nombre')}
          placeholder="Ej. Congreso de Ingeniería de Sistemas"
          maxLength={200}
          required
          error={errores.nombre}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tipo de evento"
            id="evento-tipo"
            value={form.tipo}
            onChange={cambiar('tipo')}
            placeholder="Ej. Congreso, seminario, feria"
            maxLength={50}
            required
            error={errores.tipo}
          />
          <Select
            label="Modalidad"
            id="evento-modalidad"
            value={form.modalidad}
            onChange={cambiar('modalidad')}
            options={MODALIDADES}
            placeholder="Selecciona la modalidad"
            required
            error={errores.modalidad}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Fecha de inicio"
            id="evento-fecha-inicio"
            type="date"
            value={form.fechaInicio}
            onChange={cambiar('fechaInicio')}
            required
            error={errores.fechaInicio}
          />
          <Input
            label="Fecha de fin"
            id="evento-fecha-fin"
            type="date"
            value={form.fechaFin}
            onChange={cambiar('fechaFin')}
            min={form.fechaInicio || undefined}
            required
            error={errores.fechaFin}
          />
          <Input
            label="Semestre"
            id="evento-semestre"
            value={form.semestre}
            onChange={cambiar('semestre')}
            placeholder={semestreSugerido || 'AAAA-1 o AAAA-2'}
            maxLength={6}
            error={errores.semestre}
            helperText={
              semestreSugerido
                ? `Si lo dejas vacío se usará ${semestreSugerido}.`
                : 'Opcional. Se calcula con la fecha de inicio.'
            }
          />
        </div>

        <TextArea
          label="Objetivo"
          id="evento-objetivo"
          value={form.objetivo}
          onChange={cambiar('objetivo')}
          placeholder="¿Qué busca lograr el evento?"
          maxLength={LIMITES.objetivo}
          error={errores.objetivo}
        />

        <TextArea
          label="Descripción"
          id="evento-descripcion"
          value={form.descripcion}
          onChange={cambiar('descripcion')}
          placeholder="Temática, público al que se dirige y otros detalles generales."
          rows={4}
          maxLength={LIMITES.descripcion}
          error={errores.descripcion}
        />
      </form>
    </ModalShell>
  );
}
