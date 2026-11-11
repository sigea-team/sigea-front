import { useState } from 'react';
import { Hourglass, Layers } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import { MODALIDADES_ACTIVIDAD, nombrePonente } from '../agendaUtils';
import {
  DURACIONES_SUGERIDAS,
  DURACION_MAXIMA,
  DURACION_MINIMA,
  formatearDuracion,
  validarPorProgramar,
} from '../agendaPublicacionUtils';
import { extraerError } from '../../eventos/eventoUtils';
import { opcionesPropuestasProgramables } from '../../observaciones/observacionUtils';

/**
 * @file ActividadPorProgramarModal.jsx
 * @description Registra o modifica una actividad sin fecha, horario ni sala, solo con su duración, para que la
 * generación automática de la agenda la ubique (HU-22, Criterio 1).
 * HU-19, Criterio 3: permite vincularla a una propuesta aprobada en versión definitiva; al elegirla sugiere el
 * nombre y el ponente.
 * @module features/agenda/components/ActividadPorProgramarModal
 */

/**
 * @param {Object} props
 * @param {Object|null} [props.actividad] - null para registrar; la actividad por programar para modificarla.
 * @param {Array<Object>} [props.tiposActividad]
 * @param {Array<Object>} [props.ponentes]
 * @param {Array<Object>} [props.propuestas] - Propuestas con versión definitiva (`GET /eventos/{id}/propuestas-programables`).
 * @param {(datos: Object) => Promise<void>} props.onSubmit - Debe lanzar el error de la API si falla.
 * @param {() => void} props.onClose
 */
export default function ActividadPorProgramarModal({
  actividad = null,
  tiposActividad = [],
  ponentes = [],
  propuestas = [],
  onSubmit,
  onClose,
}) {
  const esEdicion = Boolean(actividad?.id);
  const [form, setForm] = useState({
    nombre: actividad?.nombre || '',
    tipoActividadId: actividad?.tipoActividadId
      ? String(actividad.tipoActividadId)
      : tiposActividad[0]?.id
        ? String(tiposActividad[0].id)
        : '',
    duracionMinutos: actividad?.duracionMinutos ? String(actividad.duracionMinutos) : '60',
    ponenteId: actividad?.ponenteId ? String(actividad.ponenteId) : '',
    propuestaId: actividad?.propuestaId ? String(actividad.propuestaId) : '',
    modalidad: actividad?.modalidad || 'presencial',
    simultanea: Boolean(actividad?.permiteSimultaneidad ?? actividad?.simultanea),
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    const valor = e?.target?.type === 'checkbox' ? e.target.checked : e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  // HU-19: solo propuestas con versión definitiva (el backend rechaza las demás)
  const opcionesPropuestas = opcionesPropuestasProgramables(propuestas, actividad?.propuestaId);
  const propuestaSeleccionada = propuestas.find((p) => String(p.propuestaId) === String(form.propuestaId));

  const elegirPropuesta = (e) => {
    const valor = e.target.value;
    const elegida = propuestas.find((p) => String(p.propuestaId) === String(valor));
    setForm((actual) => {
      const siguiente = { ...actual, propuestaId: valor };
      if (elegida && !actual.nombre.trim()) siguiente.nombre = elegida.titulo;
      const sugerido = elegida?.ponenteSugeridoId != null ? String(elegida.ponenteSugeridoId) : '';
      const ponenteExiste = ponentes.some((pn) => String(pn.personaId ?? pn.id) === sugerido);
      if (sugerido && ponenteExiste && !actual.ponenteId) siguiente.ponenteId = sugerido;
      return siguiente;
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const { esValido, errores: nuevos } = validarPorProgramar(form);
    if (!esValido) {
      setErrores(nuevos);
      return;
    }
    setGuardando(true);
    setErrorGeneral('');
    try {
      await onSubmit({ ...form, nombre: form.nombre.trim(), duracionMinutos: Number(form.duracionMinutos) });
      onClose();
    } catch (err) {
      const { mensaje, campos } = extraerError(err);
      setErrores((prev) => ({ ...prev, ...campos }));
      setErrorGeneral(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const opcionesTipos = [
    { value: '', label: 'Selecciona el tipo de actividad' },
    ...tiposActividad.map((t) => ({ value: String(t.id), label: t.nombre })),
  ];
  const opcionesPonentes = [
    { value: '', label: 'Sin ponente (opcional)' },
    ...ponentes.map((p) => {
      const id = p.personaId ?? p.id;
      const nombre = nombrePonente(p);
      return { value: String(id), label: p.institucion ? `${nombre} — ${p.institucion}` : nombre };
    }),
  ];
  const opcionesModalidad = MODALIDADES_ACTIVIDAD.map((m) => ({ value: m.value, label: m.label }));

  return (
    <ModalShell
      titulo={esEdicion ? 'Modificar actividad por programar' : 'Nueva actividad por programar'}
      subtitulo="Indica cuánto dura; la generación automática le asignará fecha, horario y sala (HU-22)"
      icono={Hourglass}
      onClose={onClose}
      tituloId="por-programar-titulo"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Agregar a por programar'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errorGeneral && (
          <p role="alert" className="p-3 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-sm">
            {errorGeneral}
          </p>
        )}

        <Input
          label="Nombre de la actividad"
          name="nombre"
          value={form.nombre}
          onChange={cambiar('nombre')}
          placeholder="Ej.: Taller de microservicios"
          error={errores.nombre}
          required
          maxLength={200}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de actividad"
            name="tipoActividadId"
            value={form.tipoActividadId}
            onChange={cambiar('tipoActividadId')}
            options={opcionesTipos}
            error={errores.tipoActividadId}
            required
          />
          <Input
            label="Duración (minutos)"
            name="duracionMinutos"
            type="number"
            min={DURACION_MINIMA}
            max={DURACION_MAXIMA}
            step={5}
            value={form.duracionMinutos}
            onChange={cambiar('duracionMinutos')}
            error={errores.duracionMinutos}
            helperText={errores.duracionMinutos ? undefined : formatearDuracion(form.duracionMinutos)}
            required
          />
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Duraciones sugeridas">
          {DURACIONES_SUGERIDAS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => cambiar('duracionMinutos')(String(min))}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                String(min) === String(form.duracionMinutos)
                  ? 'bg-[#fdecec] border-[#a6192e]/30 text-[#a6192e]'
                  : 'border-[#e5e7ea] text-[#5b5f66] hover:bg-[#f7f7f8]'
              }`}
            >
              {formatearDuracion(min)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Ponente"
            name="ponenteId"
            value={form.ponenteId}
            onChange={cambiar('ponenteId')}
            options={opcionesPonentes}
            error={errores.ponenteId}
            helperText="Se ubicará dentro de su disponibilidad registrada."
          />
          <Select
            label="Modalidad"
            name="modalidad"
            value={form.modalidad}
            onChange={cambiar('modalidad')}
            options={opcionesModalidad}
            helperText={form.modalidad === 'virtual' ? 'Irá a una sala virtual.' : 'Irá a una sala física.'}
          />
        </div>

        {/* HU-19, Criterio 3: propuesta aprobada en versión definitiva que presenta la actividad */}
        <Select
          id="propuesta-por-programar"
          label="Propuesta aprobada que se presenta"
          name="propuestaId"
          value={form.propuestaId}
          onChange={elegirPropuesta}
          options={opcionesPropuestas}
          error={errores.propuestaId}
          helperText={
            propuestaSeleccionada
              ? `Versión definitiva ${propuestaSeleccionada.numeroVersion}${
                  propuestaSeleccionada.programada ? ' · ya tiene otra actividad programada' : ''
                }`
              : 'Solo aparecen las propuestas con versión definitiva aprobada.'
          }
        />

        <label className="flex items-start gap-3 p-3 rounded-[8px] border border-[#e5e7ea] cursor-pointer">
          <input
            type="checkbox"
            checked={form.simultanea}
            onChange={cambiar('simultanea')}
            className="mt-0.5 accent-[#a6192e]"
          />
          <span className="text-sm">
            <span className="font-medium text-[#1f2023] inline-flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#5b5f66]" />
              Puede ir en paralelo con otras actividades simultáneas
            </span>
            <span className="block text-xs text-[#5b5f66] mt-0.5">
              Si no la marcas, no coincidirá en horario con ninguna otra actividad del evento.
            </span>
          </span>
        </label>
      </form>
    </ModalShell>
  );
}
