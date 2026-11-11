import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { escaparHtml } from '../../../utils/html';
import {
  CalendarDays,
  Layers,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import ModalShell from '../../eventos/components/ModalShell';
import AlertaConflictoAgenda from './AlertaConflictoAgenda';
import {
  validarActividad,
  detectarConflictosActividad,
  MODALIDADES_ACTIVIDAD,
} from '../agendaUtils';
import { opcionesPropuestasProgramables } from '../../observaciones/observacionUtils';

/**
 * @file ActividadFormModal.jsx
 * @description Modal para programar o modificar una actividad de la agenda (HU-21: Criterios 1, 2, 3, 4 y 5).
 * Valida obligatorios, detecta cruces de horario, sala o ponente antes de guardar,
 * y permite marcar simultaneidad intencional.
 * HU-19, Criterio 3: permite vincular la actividad a una propuesta aprobada en versión definitiva (`propuestas`, de
 * `GET /eventos/{id}/propuestas-programables`); al elegirla sugiere el nombre y el ponente.
 */
export default function ActividadFormModal({
  isOpen,
  actividad = null, // null = crear nueva, objeto = editar existente (Criterio 5)
  evento,
  salas = [],
  ponentes = [],
  tiposActividad = [],
  propuestas = [],
  actividadesExistentes = [],
  onClose,
  onSubmit,
}) {
  const esEdicion = Boolean(actividad?.id);

  const [form, setForm] = useState({
    nombre: actividad?.nombre || '',
    tipoActividadId: actividad?.tipoActividadId ? String(actividad.tipoActividadId) : (tiposActividad[0]?.id ? String(tiposActividad[0].id) : ''),
    fecha: actividad?.fecha || evento?.fechaInicio || '',
    horaInicio: actividad?.horaInicio || '09:00',
    horaFin: actividad?.horaFin || '10:30',
    salaId: actividad?.salaId ? String(actividad.salaId) : (salas[0]?.id ? String(salas[0].id) : ''),
    ponenteId: actividad?.ponenteId ? String(actividad.ponenteId) : '',
    propuestaId: actividad?.propuestaId ? String(actividad.propuestaId) : '',
    modalidad: actividad?.modalidad || 'presencial',
    permiteSimultaneidad: actividad?.permiteSimultaneidad ?? false,
    descripcion: actividad?.descripcion || '',
    asistentesEsperados: actividad?.asistentesEsperados ? String(actividad.asistentesEsperados) : '',
  });

  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Detección reactiva de conflictos en tiempo real (Criterios 2, 3 y 5)
  const chequeoConflicto = useMemo(() => {
    if (!form.fecha || !form.horaInicio || !form.horaFin) {
      return { hayConflicto: false, motivos: [] };
    }

    return detectarConflictosActividad(
      {
        id: actividad?.id,
        nombre: form.nombre,
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        salaId: form.salaId,
        ponenteId: form.ponenteId,
        permiteSimultaneidad: form.permiteSimultaneidad,
      },
      actividadesExistentes,
      {
        salas,
        ponentes,
        actividadIdExcluir: actividad?.id, // Criterio 5: no chocar consigo misma al editar
      }
    );
  }, [
    form.nombre,
    form.fecha,
    form.horaInicio,
    form.horaFin,
    form.salaId,
    form.ponenteId,
    form.permiteSimultaneidad,
    actividad?.id,
    actividadesExistentes,
    salas,
    ponentes,
  ]);

  if (!isOpen) return null;

  const salaSeleccionada = salas.find((s) => String(s.id ?? s.salaId) === String(form.salaId));
  const ponenteSeleccionado = ponentes.find((p) => {
    const pId = p.personaId ?? p.id;
    return String(pId) === String(form.ponenteId);
  });

  const opcionesSalas = [
    { value: '', label: 'Selecciona una sala o espacio *' },
    ...salas.map((s) => ({
      value: String(s.id ?? s.salaId),
      label: `${s.nombre} (${s.tipo === 'virtual' ? 'Virtual' : 'Física'} — Aforo: ${s.aforoMaximo || 'N/D'})`,
    })),
  ];

  const opcionesPonentes = [
    { value: '', label: 'Sin ponente asignado (opcional)' },
    ...ponentes.map((p) => {
      const pId = p.personaId ?? p.id;
      const nom = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.nombre || `Ponente #${pId}`;
      const inst = p.institucion ? ` — ${p.institucion}` : '';
      return {
        value: String(pId),
        label: `${nom}${inst}`,
      };
    }),
  ];

  // HU-19: solo propuestas con versión definitiva (el backend rechaza las demás)
  const opcionesPropuestas = opcionesPropuestasProgramables(propuestas, actividad?.propuestaId);
  const propuestaSeleccionada = propuestas.find((p) => String(p.propuestaId) === String(form.propuestaId));

  const elegirPropuesta = (valor) => {
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

  const opcionesTipos = [
    { value: '', label: 'Selecciona el tipo de actividad (opcional)' },
    ...tiposActividad.map((t) => ({
      value: String(t.id),
      label: t.nombre,
    })),
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Criterio 4: Rechazo y validación de campos obligatorios
    const validacion = validarActividad(form);
    if (!validacion.esValido) {
      setErrores(validacion.errores);
      Swal.fire({
        icon: 'error',
        title: 'Datos obligatorios incompletos',
        text: 'Por favor completa todos los campos requeridos (nombre, fecha, hora inicio, hora fin y sala).',
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
      return;
    }

    if (!form.tipoActividadId && tiposActividad.length > 0) {
      setErrores((prev) => ({ ...prev, tipoActividadId: 'El tipo de actividad es obligatorio.' }));
      Swal.fire({
        icon: 'error',
        title: 'Tipo de actividad obligatorio',
        text: 'Por favor selecciona el tipo de actividad para clasificarla en el evento.',
        confirmButtonColor: '#a6192e',
      });
      return;
    }

    const CLASES_ALERTA = {
      popup: 'rounded-[16px]',
      confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
      cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
    };
    const listaHtml = (items) =>
      `<ul class="list-disc list-inside space-y-1.5 bg-brand-100 p-3 rounded-lg border border-brand-600 text-brand-700">${items
        .map((m) => `<li>${escaparHtml(m)}</li>`)
        .join('')}</ul>`;

    // Criterios 2, 3 y 5: un cruce de horario, sala o ponente no se puede guardar (el backend responde
    // 409 CONFLICTO_PROGRAMACION); solo se ofrece corregir.
    if (chequeoConflicto.hayCruces) {
      const cruces = [
        ...chequeoConflicto.conflictosHorario,
        ...chequeoConflicto.conflictosSala,
        ...chequeoConflicto.conflictosPonente,
      ].map((c) => c.mensaje);
      await Swal.fire({
        icon: 'error',
        title: 'La actividad se cruza con otras de la agenda',
        html: `
          <div class="text-left text-xs text-ink-900 space-y-2.5">
            ${listaHtml(cruces)}
            <div class="p-2.5 rounded-lg bg-surface-muted border border-border text-ink-900 text-[11px]">
              <span class="font-semibold">Criterio 3:</span>
              si son actividades paralelas, márcalas ambas como simultáneas y usa ponentes distintos.
              Para compartir sala, la sala debe admitir actividades simultáneas.
            </div>
          </div>
        `,
        confirmButtonText: 'Revisar y corregir',
        confirmButtonColor: '#a6192e',
        customClass: CLASES_ALERTA,
      });
      return;
    }

    // HU-20: quedar fuera de la disponibilidad registrada solo advierte; se puede confirmar.
    let advertenciasConfirmadas = false;
    if (chequeoConflicto.conflictosDisponibilidad.length > 0) {
      const resultadoAlerta = await Swal.fire({
        icon: 'warning',
        title: 'Fuera de la disponibilidad registrada',
        html: `
          <div class="text-left text-xs text-ink-900 space-y-2.5">
            ${listaHtml(chequeoConflicto.conflictosDisponibilidad.map((c) => c.mensaje))}
            <p class="text-xs text-ink-600 mt-2">¿Deseas programarla de todos modos?</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, programar de todos modos',
        cancelButtonText: 'Revisar y corregir',
        confirmButtonColor: '#a6192e',
        cancelButtonColor: '#5b5f66',
        customClass: CLASES_ALERTA,
      });
      if (!resultadoAlerta.isConfirmed) return;
      advertenciasConfirmadas = true;
    }

    const tipoObj = tiposActividad.find((t) => String(t.id) === String(form.tipoActividadId));
    const construirPayload = (confirmar) => ({
      ...form,
      nombre: form.nombre.trim(),
      salaId: Number(form.salaId),
      salaNombre: salaSeleccionada?.nombre || 'Sala asignada',
      tipoActividadId: form.tipoActividadId ? Number(form.tipoActividadId) : null,
      tipoActividadNombre: tipoObj?.nombre || '',
      ponenteId: form.ponenteId ? Number(form.ponenteId) : null,
      ponenteNombre: ponenteSeleccionado
        ? `${ponenteSeleccionado.nombres || ''} ${ponenteSeleccionado.apellidos || ''}`.trim() || ponenteSeleccionado.nombre
        : null,
      permiteSimultaneidad: Boolean(form.permiteSimultaneidad),
      simultanea: Boolean(form.permiteSimultaneidad),
      confirmarAdvertencias: confirmar,
      asistentesEsperados: form.asistentesEsperados ? Number(form.asistentesEsperados) : null,
      tieneAdvertencia: chequeoConflicto.hayConflicto,
      motivosAdvertencia: chequeoConflicto.motivos,
    });

    const mostrarErrorGuardado = (error) => {
      if (error?.codigo === 'CONFLICTO_PROGRAMACION') {
        return Swal.fire({
          icon: 'error',
          title: 'Cruce no planificado en la agenda',
          html: `
            <div class="text-left text-xs text-ink-900 space-y-2">
              <p class="font-medium text-brand-700">${escaparHtml(error.message)}</p>
              ${listaHtml((error.conflictos || []).map((c) => c.mensaje))}
            </div>
          `,
          confirmButtonColor: '#a6192e',
          customClass: CLASES_ALERTA,
        });
      }
      return Swal.fire({
        icon: 'error',
        title: 'Error al registrar la actividad',
        text: error?.message || 'Ocurrió un error inesperado al procesar la solicitud.',
        confirmButtonColor: '#a6192e',
        customClass: CLASES_ALERTA,
      });
    };

    try {
      setGuardando(true);
      await onSubmit(construirPayload(advertenciasConfirmadas));
      onClose();
    } catch (error) {
      // El backend puede encontrar advertencias que la revisión local no vio (p. ej. franjas sin cargar).
      if (error.codigo !== 'CONFIRMACION_REQUERIDA') {
        await mostrarErrorGuardado(error);
        return;
      }
      const confirmar = await Swal.fire({
        icon: 'warning',
        title: 'Advertencia de disponibilidad horaria',
        html: `
          <div class="text-left text-xs text-ink-900 space-y-2">
            <p class="font-medium text-brand-700">${escaparHtml(error.message)}</p>
            ${listaHtml((error.advertencias || []).map((a) => a.mensaje))}
            <p class="mt-2 text-ink-600">¿Deseas confirmar la programación de la actividad aceptando estas advertencias?</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar y guardar',
        cancelButtonText: 'Revisar datos',
        confirmButtonColor: '#a6192e',
        cancelButtonColor: '#5b5f66',
        customClass: CLASES_ALERTA,
      });
      if (!confirmar.isConfirmed) return;
      try {
        await onSubmit(construirPayload(true));
        onClose();
      } catch (errorReintento) {
        await mostrarErrorGuardado(errorReintento);
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalShell
      titulo={esEdicion ? 'Modificar actividad de la agenda' : 'Programar nueva actividad en la agenda'}
      subtitulo={
        esEdicion
          ? 'Revalida automáticamente los cruces de horario, sala y ponente (HU-21: Criterio 5)'
          : 'Asigna horario, sala y ponente con detección automática de conflictos (HU-21: Criterio 1 al 4)'
      }
      icono={CalendarDays}
      onClose={onClose}
      ancho="max-w-2xl"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Programar actividad'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Notificación en vivo de conflictos detectados (Criterio 2, 3 y 5) */}
        <AlertaConflictoAgenda
          resultadoConflicto={chequeoConflicto}
          permiteSimultaneidad={form.permiteSimultaneidad}
        />

        {/* Nombre de la actividad (Criterio 4) */}
        <div>
          <Input
            id="nombre-actividad"
            label="Título o nombre de la actividad *"
            placeholder="Ej. Taller Práctico de Microservicios o Conferencia Magistral"
            value={form.nombre}
            onChange={(e) => {
              setForm((p) => ({ ...p, nombre: e.target.value }));
              if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: null }));
            }}
            error={errores.nombre}
            autoFocus
          />
        </div>

        {/* Tipo de actividad y Modalidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Select
              id="tipo-actividad"
              label="Tipo de actividad *"
              value={form.tipoActividadId}
              onChange={(e) => {
                setForm((p) => ({ ...p, tipoActividadId: e.target.value }));
                if (errores.tipoActividadId) setErrores((prev) => ({ ...prev, tipoActividadId: null }));
              }}
              options={opcionesTipos}
              error={errores.tipoActividadId}
            />
          </div>

          <div>
            <Select
              id="modalidad-actividad"
              label="Modalidad"
              value={form.modalidad}
              onChange={(e) => setForm((p) => ({ ...p, modalidad: e.target.value }))}
              options={MODALIDADES_ACTIVIDAD}
            />
          </div>
        </div>

        {/* Fecha y Horario (Criterio 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">Fecha de inicio *</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => {
                setForm((p) => ({ ...p, fecha: e.target.value }));
                if (errores.fecha) setErrores((prev) => ({ ...prev, fecha: null }));
              }}
              className={`w-full text-xs h-9 px-2.5 rounded-lg border ${
                errores.fecha ? 'border-brand-600 bg-brand-100' : 'border-field-border bg-white'
              } focus:outline-none focus:ring-2 focus:ring-brand-600`}
            />
            {errores.fecha && <p className="text-xs text-brand-700 mt-1">{errores.fecha}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">Hora de inicio *</label>
            <input
              type="time"
              value={form.horaInicio}
              onChange={(e) => {
                setForm((p) => ({ ...p, horaInicio: e.target.value }));
                if (errores.horaInicio) setErrores((prev) => ({ ...prev, horaInicio: null }));
              }}
              className={`w-full text-xs h-9 px-2.5 rounded-lg border ${
                errores.horaInicio ? 'border-brand-600 bg-brand-100' : 'border-field-border bg-white'
              } focus:outline-none focus:ring-2 focus:ring-brand-600`}
            />
            {errores.horaInicio && <p className="text-xs text-brand-700 mt-1">{errores.horaInicio}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">Hora de fin *</label>
            <input
              type="time"
              value={form.horaFin}
              onChange={(e) => {
                setForm((p) => ({ ...p, horaFin: e.target.value }));
                if (errores.horaFin) setErrores((prev) => ({ ...prev, horaFin: null }));
              }}
              className={`w-full text-xs h-9 px-2.5 rounded-lg border ${
                errores.horaFin ? 'border-brand-600 bg-brand-100' : 'border-field-border bg-white'
              } focus:outline-none focus:ring-2 focus:ring-brand-600`}
            />
            {errores.horaFin && <p className="text-xs text-brand-700 mt-1">{errores.horaFin}</p>}
          </div>
        </div>

        {/* Sala y Ponente (Criterio 1 y 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <Select
              id="sala-actividad"
              label="Sala o espacio asignado *"
              value={form.salaId}
              onChange={(e) => {
                setForm((p) => ({ ...p, salaId: e.target.value }));
                if (errores.salaId) setErrores((prev) => ({ ...prev, salaId: null }));
              }}
              options={opcionesSalas}
              error={errores.salaId}
            />
            {salaSeleccionada && (
              <p className="text-[11px] text-ink-600 mt-1">
                Ubicación: {salaSeleccionada.ubicacion || 'No especificada'} • Aforo: {salaSeleccionada.aforoMaximo || 'N/D'} personas.
              </p>
            )}
          </div>

          <div>
            <Select
              id="ponente-actividad"
              label="Ponente o conferencista asignado"
              value={form.ponenteId}
              onChange={(e) => setForm((p) => ({ ...p, ponenteId: e.target.value }))}
              options={opcionesPonentes}
            />
            {ponenteSeleccionado && (
              <p className="text-[11px] text-ink-600 mt-1">
                {ponenteSeleccionado.especialidad
                  ? `Especialidad: ${ponenteSeleccionado.especialidad}`
                  : `Correo: ${ponenteSeleccionado.correo || 'Registrado'}`}
              </p>
            )}
          </div>
        </div>

        {/* HU-19, Criterio 3: propuesta aprobada en versión definitiva que presenta la actividad */}
        <div>
          <Select
            id="propuesta-actividad"
            label="Propuesta aprobada que se presenta"
            value={form.propuestaId}
            onChange={(e) => elegirPropuesta(e.target.value)}
            options={opcionesPropuestas}
          />
          <p className="text-[11px] text-ink-600 mt-1">
            {propuestaSeleccionada
              ? `Versión definitiva ${propuestaSeleccionada.numeroVersion}${
                  propuestaSeleccionada.autores?.length ? ` · ${propuestaSeleccionada.autores.join(', ')}` : ''
                }${propuestaSeleccionada.programada ? ' · ya tiene otra actividad programada' : ''}`
              : 'Solo aparecen las propuestas con versión definitiva aprobada.'}
          </p>
        </div>

        {/* Casilla de Actividad Simultánea Intencional (Criterio 3) */}
        <div className="p-3.5 rounded-xl border border-border bg-surface-muted hover:bg-white transition-colors">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              id="permite-simultaneidad-check"
              checked={form.permiteSimultaneidad}
              onChange={(e) => setForm((p) => ({ ...p, permiteSimultaneidad: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-field-border text-brand-600 focus:ring-brand-600"
            />
            <div className="text-xs">
              <span className="font-semibold text-ink-900 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                Permitir simultaneidad intencional (Criterio 3)
              </span>
              <p className="text-ink-600 text-[11px] mt-0.5 leading-relaxed">
                Marca esta opción si esta actividad se realiza en paralelo con otras (p. ej. sesiones simultáneas o talleres temáticos al mismo tiempo).
                El sistema no alertará de cruce de horario entre actividades marcadas como simultáneas, validando que no compartan sala ni ponente.
              </p>
            </div>
          </label>
        </div>

        {/* Descripción o notas */}
        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Descripción o temario de la actividad (opcional)
          </label>
          <textarea
            rows={2}
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Breve resumen de objetivos, requerimientos técnicos o público objetivo..."
            className="w-full text-xs p-2.5 rounded-lg border border-field-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      </form>
    </ModalShell>
  );
}
