import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
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

/**
 * @file ActividadFormModal.jsx
 * @description Modal para programar o modificar una actividad de la agenda (HU-21: Criterios 1, 2, 3, 4 y 5).
 * Valida obligatorios, detecta cruces de horario, sala o ponente antes de guardar,
 * y permite marcar simultaneidad intencional.
 */
export default function ActividadFormModal({
  isOpen,
  actividad = null, // null = crear nueva, objeto = editar existente (Criterio 5)
  evento,
  salas = [],
  ponentes = [],
  tiposActividad = [],
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

    // Criterio 2 y 5: Si genera conflicto, notificar antes de guardar
    if (chequeoConflicto.hayConflicto) {
      const resultadoAlerta = await Swal.fire({
        icon: 'warning',
        title: '¡Conflicto de programación detectado!',
        html: `
          <div class="text-left text-xs text-[#1f2023] space-y-2.5">
            <p class="font-medium text-sm text-[#a6192e]">
              La actividad genera los siguientes cruces no planificados:
            </p>
            <ul class="list-disc list-inside space-y-1.5 bg-[#fdf2f2] p-3 rounded-lg border border-red-200 text-[#7a0c1e]">
              ${chequeoConflicto.motivos.map((m) => `<li>${m}</li>`).join('')}
            </ul>
            <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
              <span class="font-semibold">💡 Nota de ayuda (Criterio 3):</span>
              Si se trata de actividades paralelas intencionales (ej. talleres simultáneos),
              márquelas como simultáneas y asegúrese de que utilicen salas y ponentes diferentes.
            </div>
            <p class="text-xs text-[#5b5f66] mt-2">
              ¿Deseas guardar de todos modos con esta advertencia o prefieres corregir los datos?
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar con advertencia',
        cancelButtonText: 'Revisar y corregir',
        confirmButtonColor: '#a6192e',
        cancelButtonColor: '#5b5f66',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
          cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });

      if (!resultadoAlerta.isConfirmed) {
        return;
      }
    }

    try {
      setGuardando(true);
      const tipoObj = tiposActividad.find((t) => String(t.id) === String(form.tipoActividadId));

      const payload = {
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
        confirmarAdvertencias: Boolean(chequeoConflicto.hayConflicto),
        asistentesEsperados: form.asistentesEsperados ? Number(form.asistentesEsperados) : null,
        tieneAdvertencia: chequeoConflicto.hayConflicto,
        motivosAdvertencia: chequeoConflicto.motivos,
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      if (error.codigo === 'CONFIRMACION_REQUERIDA') {
        const confirmar = await Swal.fire({
          icon: 'warning',
          title: 'Advertencia de disponibilidad horaria',
          html: `
            <div class="text-left text-xs text-[#1f2023] space-y-2">
              <p class="font-medium text-amber-900">${error.message}</p>
              <ul class="list-disc list-inside text-amber-800 space-y-1 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ${(error.advertencias || []).map((a) => `<li>${a.mensaje}</li>`).join('')}
              </ul>
              <p class="mt-2 text-[#5b5f66]">¿Deseas confirmar la programación de la actividad aceptando estas advertencias?</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Sí, confirmar y guardar',
          cancelButtonText: 'Revisar datos',
          confirmButtonColor: '#a6192e',
          cancelButtonColor: '#5b5f66',
          customClass: {
            popup: 'rounded-[16px]',
            confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
            cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
          },
        });

        if (confirmar.isConfirmed) {
          const tipoObj = tiposActividad.find((t) => String(t.id) === String(form.tipoActividadId));
          try {
            await onSubmit({
              ...form,
              nombre: form.nombre.trim(),
              salaId: Number(form.salaId),
              salaNombre: salaSeleccionada?.nombre || 'Sala asignada',
              tipoActividadId: form.tipoActividadId ? Number(form.tipoActividadId) : null,
              tipoActividadNombre: tipoObj?.nombre || '',
              ponenteId: form.ponenteId ? Number(form.ponenteId) : null,
              simultanea: Boolean(form.permiteSimultaneidad),
              permiteSimultaneidad: Boolean(form.permiteSimultaneidad),
              confirmarAdvertencias: true,
            });
            onClose();
          } catch (errorConfirmado) {
            mostrarErrorGuardado(errorConfirmado);
          }
        }
        return;
      }

      mostrarErrorGuardado(error);
    } finally {
      setGuardando(false);
    }
  };

  /** Informa que la actividad no se guardó: los cruces con su detalle y cualquier otro error con su mensaje. */
  const mostrarErrorGuardado = (error) => {
    if (error.codigo === 'CONFLICTO_PROGRAMACION') {
      Swal.fire({
        icon: 'error',
        title: 'Cruce no planificado en la agenda',
        html: `
          <div class="text-left text-xs text-[#1f2023] space-y-2">
            <p class="font-medium text-red-600">${error.message}</p>
            <ul class="list-disc list-inside text-red-800 space-y-1 bg-red-50 p-2.5 rounded-lg border border-red-200">
              ${(error.conflictos || []).map((c) => `<li><strong>${c.tipo}:</strong> ${c.mensaje}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonColor: '#a6192e',
        customClass: {
          popup: 'rounded-[16px]',
          confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
        },
      });
      return;
    }

    Swal.fire({
      icon: 'error',
      title: 'No se guardó la actividad',
      text: error.message || 'Ocurrió un error inesperado al procesar la solicitud.',
      confirmButtonColor: '#a6192e',
      customClass: {
        popup: 'rounded-[16px]',
        confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
      },
    });
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
            <label className="block text-xs font-semibold text-[#1f2023] mb-1">Fecha de inicio *</label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => {
                setForm((p) => ({ ...p, fecha: e.target.value }));
                if (errores.fecha) setErrores((prev) => ({ ...prev, fecha: null }));
              }}
              className={`w-full text-xs h-9 px-2.5 rounded-lg border ${
                errores.fecha ? 'border-red-500 bg-red-50/30' : 'border-[#d8dadf] bg-white'
              } focus:outline-none focus:ring-2 focus:ring-[#a6192e]`}
            />
            {errores.fecha && <p className="text-xs text-red-600 mt-1">{errores.fecha}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2023] mb-1">Hora de inicio *</label>
            <input
              type="time"
              value={form.horaInicio}
              onChange={(e) => {
                setForm((p) => ({ ...p, horaInicio: e.target.value }));
                if (errores.horaInicio) setErrores((prev) => ({ ...prev, horaInicio: null }));
              }}
              className={`w-full text-xs h-9 px-2.5 rounded-lg border ${
                errores.horaInicio ? 'border-red-500 bg-red-50/30' : 'border-[#d8dadf] bg-white'
              } focus:outline-none focus:ring-2 focus:ring-[#a6192e]`}
            />
            {errores.horaInicio && <p className="text-xs text-red-600 mt-1">{errores.horaInicio}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2023] mb-1">Hora de fin *</label>
            <input
              type="time"
              value={form.horaFin}
              onChange={(e) => {
                setForm((p) => ({ ...p, horaFin: e.target.value }));
                if (errores.horaFin) setErrores((prev) => ({ ...prev, horaFin: null }));
              }}
              className={`w-full text-xs h-9 px-2.5 rounded-lg border ${
                errores.horaFin ? 'border-red-500 bg-red-50/30' : 'border-[#d8dadf] bg-white'
              } focus:outline-none focus:ring-2 focus:ring-[#a6192e]`}
            />
            {errores.horaFin && <p className="text-xs text-red-600 mt-1">{errores.horaFin}</p>}
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
              <p className="text-[11px] text-[#5b5f66] mt-1">
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
              <p className="text-[11px] text-[#5b5f66] mt-1">
                {ponenteSeleccionado.especialidad
                  ? `Especialidad: ${ponenteSeleccionado.especialidad}`
                  : `Correo: ${ponenteSeleccionado.correo || 'Registrado'}`}
              </p>
            )}
          </div>
        </div>

        {/* Casilla de Actividad Simultánea Intencional (Criterio 3) */}
        <div className="p-3.5 rounded-xl border border-[#e5e7ea] bg-[#fafbfc] hover:bg-white transition-colors">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              id="permite-simultaneidad-check"
              checked={form.permiteSimultaneidad}
              onChange={(e) => setForm((p) => ({ ...p, permiteSimultaneidad: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-[#d8dadf] text-[#a6192e] focus:ring-[#a6192e]"
            />
            <div className="text-xs">
              <span className="font-semibold text-[#1f2023] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#a6192e]" />
                Permitir simultaneidad intencional (Criterio 3)
              </span>
              <p className="text-[#5b5f66] text-[11px] mt-0.5 leading-relaxed">
                Marca esta opción si esta actividad se realiza en paralelo con otras (p. ej. sesiones simultáneas o talleres temáticos al mismo tiempo).
                El sistema no alertará de cruce de horario entre actividades marcadas como simultáneas, validando que no compartan sala ni ponente.
              </p>
            </div>
          </label>
        </div>

        {/* Descripción o notas */}
        <div>
          <label className="block text-xs font-semibold text-[#1f2023] mb-1">
            Descripción o temario de la actividad (opcional)
          </label>
          <textarea
            rows={2}
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Breve resumen de objetivos, requerimientos técnicos o público objetivo..."
            className="w-full text-xs p-2.5 rounded-lg border border-[#d8dadf] bg-white focus:outline-none focus:ring-2 focus:ring-[#a6192e]"
          />
        </div>
      </form>
    </ModalShell>
  );
}
