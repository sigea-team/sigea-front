import { useState } from 'react';
import { CopyPlus } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ModalShell from './ModalShell';
import AlertaError from './AlertaError';
import {
  calcularSemestre,
  etiquetaModalidad,
  extraerError,
  textoONulo,
  validarEdicion,
} from '../eventoUtils';

/**
 * @file NuevaEdicionModal.jsx
 * @description Modal para crear una nueva edición a partir de un evento existente
 * (HU-04, Criterio 3). Muestra qué datos se heredan del evento origen y pide solo
 * los datos del nuevo periodo. La edición queda vinculada al evento base y en configuración.
 * El padre debe montarlo con una `key` distinta por evento origen.
 * @module features/eventos/components/NuevaEdicionModal
 */

function DatoHeredado({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs text-[#5b5f66]">{etiqueta}</dt>
      <dd className={`text-sm mt-0.5 ${valor ? 'text-[#1f2023]' : 'text-[#9ca0a6]'}`}>{valor || 'Sin registrar'}</dd>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.origen - Evento (base o edición) que sirve de plantilla.
 * @param {function(): void} props.onClose
 * @param {function(Object): Promise<any>} props.onSubmit - Recibe { nombre, fechaInicio, fechaFin, semestre }.
 */
export default function NuevaEdicionModal({ isOpen, origen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    nombre: origen?.nombre || '',
    fechaInicio: '',
    fechaFin: '',
    semestre: '',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  if (!isOpen || !origen) return null;

  const cambiar = (campo) => (e) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  const semestreSugerido = calcularSemestre(form.fechaInicio);

  const guardar = async (e) => {
    e?.preventDefault();
    const nuevosErrores = validarEdicion(form);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    setErrorGeneral(null);
    try {
      await onSubmit({
        nombre: form.nombre.trim() || origen.nombre,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        semestre: textoONulo(form.semestre),
      });
    } catch (err) {
      const { mensaje, campos } = extraerError(err);
      setErrores(campos);
      setErrorGeneral(mensaje);
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      titulo="Nueva edición"
      subtitulo={`A partir de «${origen.nombre}» (${origen.semestre || 'sin semestre'})`}
      icono={CopyPlus}
      onClose={onClose}
      tituloId="nueva-edicion-titulo"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="nueva-edicion-form" variant="primary" loading={guardando}>
            Crear edición
          </Button>
        </>
      }
    >
      <form id="nueva-edicion-form" onSubmit={guardar} noValidate className="space-y-5">
        {errorGeneral && <AlertaError titulo="No se pudo crear la edición">{errorGeneral}</AlertaError>}

        <section aria-labelledby="heredado-titulo" className="p-4 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
          <h3 id="heredado-titulo" className="text-sm font-semibold text-[#1f2023]">
            Se copia del evento origen
          </h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3">
            <DatoHeredado etiqueta="Tipo" valor={origen.tipo} />
            <DatoHeredado etiqueta="Modalidad" valor={origen.modalidad ? etiquetaModalidad(origen.modalidad) : null} />
            <div className="col-span-2">
              <DatoHeredado etiqueta="Objetivo" valor={origen.objetivo} />
            </div>
            <div className="col-span-2">
              <DatoHeredado etiqueta="Descripción" valor={origen.descripcion} />
            </div>
          </dl>
          <p className="text-xs text-[#5b5f66] mt-4 pt-3 border-t border-[#e5e7ea] leading-relaxed">
            El comité, el presupuesto, las convocatorias y demás información del evento origen no se copian.
            La edición queda en configuración, así que después puedes ajustar cualquiera de estos datos con Editar.
          </p>
        </section>

        <Input
          label="Nombre de la edición"
          id="edicion-nombre"
          value={form.nombre}
          onChange={cambiar('nombre')}
          placeholder={origen.nombre}
          maxLength={200}
          error={errores.nombre}
          helperText="Si lo dejas vacío se usará el nombre del evento origen."
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Fecha de inicio"
            id="edicion-fecha-inicio"
            type="date"
            value={form.fechaInicio}
            onChange={cambiar('fechaInicio')}
            required
            error={errores.fechaInicio}
          />
          <Input
            label="Fecha de fin"
            id="edicion-fecha-fin"
            type="date"
            value={form.fechaFin}
            onChange={cambiar('fechaFin')}
            min={form.fechaInicio || undefined}
            required
            error={errores.fechaFin}
          />
          <Input
            label="Semestre"
            id="edicion-semestre"
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
      </form>
    </ModalShell>
  );
}
