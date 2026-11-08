import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import {
  DIAS_SEMANA,
  formatearHora,
  generarFranjasPorDiasSemana,
  horaAMinutos,
  validarFranjaDisponibilidad,
  verificarConflictoConOcupaciones,
} from '../salaUtils';

/**
 * @file CalendarioDisponibilidad.jsx
 * @description Componente interactivo para asignar y gestionar la disponibilidad horaria de una sala.
 * Permite seleccionar días de la semana, rangos de fechas, presets de horarios y visualizar
 * tanto las horas disponibles como las horas ya ocupadas por eventos/actividades.
 * @module features/salas/components/CalendarioDisponibilidad
 */
export default function CalendarioDisponibilidad({
  franjas = [],
  ocupaciones = [],
  onChange,
  editable = true,
  fechaSugerida,
}) {
  const hoyStr = new Date().toISOString().slice(0, 10);
  const fechaBase = fechaSugerida || (franjas[0]?.fecha ? franjas[0].fecha : hoyStr);

  // Modo: 'semana' (por días de la semana) o 'individual' (fecha puntual)
  const [modo, setModo] = useState('semana');

  // Estado para asignación por días de semana
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 2, 3, 4, 5]); // Lun a Vie por defecto
  const [rangoDesde, setRangoDesde] = useState(fechaBase);
  const [rangoHasta, setRangoHasta] = useState(() => {
    const d = new Date(`${fechaBase}T00:00:00`);
    d.setDate(d.getDate() + 14); // 2 semanas por defecto
    return d.toISOString().slice(0, 10);
  });
  const [horaInicioSemana, setHoraInicioSemana] = useState('08:00');
  const [horaFinSemana, setHoraFinSemana] = useState('12:00');

  // Estado para fecha individual
  const [fechaIndividual, setFechaIndividual] = useState(fechaBase);
  const [horaInicioInd, setHoraInicioInd] = useState('08:00');
  const [horaFinInd, setHoraFinInd] = useState('12:00');

  // Mensaje de feedback
  const [mensajeFeedback, setMensajeFeedback] = useState(null);
  const [errorLocal, setErrorLocal] = useState(null);

  // Presets rápidos de horarios
  const presetsHorario = [
    { label: 'Mañana (08:00 – 12:00)', inicio: '08:00', fin: '12:00' },
    { label: 'Tarde (14:00 – 18:00)', inicio: '14:00', fin: '18:00' },
    { label: 'Jornada Completa (08:00 – 18:00)', inicio: '08:00', fin: '18:00' },
    { label: 'Noche (18:00 – 22:00)', inicio: '18:00', fin: '22:00' },
  ];

  const toggleDiaSemana = (idDia) => {
    setDiasSeleccionados((prev) =>
      prev.includes(idDia) ? prev.filter((d) => d !== idDia) : [...prev, idDia]
    );
  };

  const seleccionarTodosDias = () => setDiasSeleccionados([1, 2, 3, 4, 5, 6, 0]);
  const seleccionarLunesAViernes = () => setDiasSeleccionados([1, 2, 3, 4, 5]);
  const limpiarDias = () => setDiasSeleccionados([]);

  // Aplicar franjas por días de semana
  const handleAplicarDiasSemana = (e) => {
    e.preventDefault();
    setErrorLocal(null);
    setMensajeFeedback(null);

    if (diasSeleccionados.length === 0) {
      setErrorLocal('Selecciona al menos un día de la semana.');
      return;
    }
    if (!rangoDesde || !rangoHasta) {
      setErrorLocal('Indica la fecha de inicio y de fin del rango.');
      return;
    }
    if (rangoDesde > rangoHasta) {
      setErrorLocal('La fecha de inicio debe ser anterior o igual a la fecha de fin.');
      return;
    }
    if (horaAMinutos(horaFinSemana) <= horaAMinutos(horaInicioSemana)) {
      setErrorLocal('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    const generadas = generarFranjasPorDiasSemana(
      {
        diasSemana: diasSeleccionados,
        fechaInicio: rangoDesde,
        fechaFin: rangoHasta,
        horaInicio: horaInicioSemana,
        horaFin: horaFinSemana,
      },
      franjas
    );

    if (generadas.length === 0) {
      setErrorLocal('No se generaron franjas nuevas (ya existen o coinciden con franjas existentes).');
      return;
    }

    // Verificar si alguna coincide con horas ya ocupadas por eventos
    const conflictosConOcupaciones = generadas.filter((f) =>
      verificarConflictoConOcupaciones(f, ocupaciones).hayConflicto
    );

    const actualizadas = [...franjas, ...generadas];
    onChange(actualizadas);

    let textoAviso = `Se añadieron ${generadas.length} franja(s) de disponibilidad a los días seleccionados.`;
    if (conflictosConOcupaciones.length > 0) {
      textoAviso += ` Nota: ${conflictosConOcupaciones.length} de ellas coinciden con horarios ya reservados por eventos (se muestran identificadas abajo).`;
    }
    setMensajeFeedback(textoAviso);
  };

  // Agregar franja individual
  const handleAgregarIndividual = (e) => {
    e.preventDefault();
    setErrorLocal(null);
    setMensajeFeedback(null);

    const nueva = {
      fecha: fechaIndividual,
      horaInicio: horaInicioInd,
      horaFin: horaFinInd,
    };

    const err = validarFranjaDisponibilidad(nueva, franjas);
    if (Object.keys(err).length > 0) {
      setErrorLocal(err.horaFin || err.fecha || err.general || 'Datos de franja inválidos.');
      return;
    }

    const idNueva = Date.now() + Math.floor(Math.random() * 1000);
    const actualizadas = [...franjas, { id: idNueva, ...nueva }];
    onChange(actualizadas);
    setMensajeFeedback(`Franja añadida para el ${nueva.fecha} (${nueva.horaInicio} - ${nueva.horaFin}).`);
  };

  const handleEliminarFranja = (idOEIndice) => {
    const filtradas = franjas.filter((f, idx) => (f.id ? f.id !== idOEIndice : idx !== idOEIndice));
    onChange(filtradas);
  };

  const handleLimpiarFecha = (fecha) => {
    const filtradas = franjas.filter((f) => f.fecha !== fecha);
    onChange(filtradas);
  };

  const handleLimpiarTodo = () => {
    onChange([]);
  };

  // Agrupar franjas y ocupaciones por fecha para vista de cronograma
  const cronogramaPorFecha = useMemo(() => {
    const fechasMap = new Map();

    franjas.forEach((f) => {
      if (!fechasMap.has(f.fecha)) {
        fechasMap.set(f.fecha, { fecha: f.fecha, franjas: [], ocupaciones: [] });
      }
      fechasMap.get(f.fecha).franjas.push(f);
    });

    ocupaciones.forEach((oc) => {
      if (!fechasMap.has(oc.fecha)) {
        fechasMap.set(oc.fecha, { fecha: oc.fecha, franjas: [], ocupaciones: [] });
      }
      fechasMap.get(oc.fecha).ocupaciones.push(oc);
    });

    // Ordenar por fecha cronológicamente
    return Array.from(fechasMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [franjas, ocupaciones]);

  // Formateador de fecha amigable (ej. "Lunes, 16 de noviembre de 2026")
  const formatearFechaAmigable = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const [y, m, d] = fechaStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector de modo y resumen superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea]">
        <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-white border border-[#e5e7ea]">
          <button
            type="button"
            onClick={() => setModo('semana')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
              modo === 'semana'
                ? 'bg-[#a6192e] text-white shadow-xs'
                : 'text-[#5b5f66] hover:text-[#1f2023]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Por Días de Semana</span>
          </button>
          <button
            type="button"
            onClick={() => setModo('individual')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
              modo === 'individual'
                ? 'bg-[#a6192e] text-white shadow-xs'
                : 'text-[#5b5f66] hover:text-[#1f2023]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Fecha Individual</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#5b5f66]">
          <span>
            <strong className="text-[#1f2023] font-semibold">{franjas.length}</strong> franja(s) disponible(s)
          </span>
          {ocupaciones.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fdecec] text-[#7a0c1e] font-medium border border-[#a6192e]/20">
              <Clock className="w-3 h-3" />
              {ocupaciones.length} ocupada(s) por eventos
            </span>
          )}
          {editable && franjas.length > 0 && (
            <button
              type="button"
              onClick={handleLimpiarTodo}
              className="text-[#a6192e] hover:underline text-xs"
            >
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* Alertas de feedback / error */}
      {errorLocal && (
        <div className="p-3 rounded-[8px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorLocal}</span>
        </div>
      )}

      {mensajeFeedback && (
        <div className="p-3 rounded-[8px] bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {/* Controles de edición interactiva */}
      {editable && modo === 'semana' && (
        <div className="p-4 rounded-[12px] bg-white border border-[#e5e7ea] space-y-4 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-[#1f2023] uppercase tracking-wider mb-2">
              1. Selecciona los días de la semana
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {DIAS_SEMANA.map((d) => {
                const activo = diasSeleccionados.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDiaSemana(d.id)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors ${
                      activo
                        ? 'bg-[#a6192e] text-white border-[#a6192e]'
                        : 'bg-white text-[#5b5f66] border-[#e5e7ea] hover:bg-[#f7f7f8]'
                    }`}
                  >
                    {d.nombre}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#5b5f66]">
              <button
                type="button"
                onClick={seleccionarLunesAViernes}
                className="text-[#a6192e] hover:underline"
              >
                Lunes a Viernes
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={seleccionarTodosDias}
                className="text-[#a6192e] hover:underline"
              >
                Todos los días
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={limpiarDias}
                className="hover:underline"
              >
                Deseleccionar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#e5e7ea]">
            <Input
              id="rango-fecha-desde"
              label="Desde"
              type="date"
              value={rangoDesde}
              onChange={(e) => setRangoDesde(e.target.value)}
              required
            />
            <Input
              id="rango-fecha-hasta"
              label="Hasta"
              type="date"
              value={rangoHasta}
              onChange={(e) => setRangoHasta(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2023] uppercase tracking-wider mb-2">
              2. Horario a aplicar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
              <Input
                id="hora-inicio-semana"
                label="Hora de Inicio"
                type="time"
                value={horaInicioSemana}
                onChange={(e) => setHoraInicioSemana(e.target.value)}
                required
              />
              <Input
                id="hora-fin-semana"
                label="Hora de Fin"
                type="time"
                value={horaFinSemana}
                onChange={(e) => setHoraFinSemana(e.target.value)}
                required
              />
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[#5b5f66] mr-1 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-[#a6192e]" />
                Atajos:
              </span>
              {presetsHorario.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setHoraInicioSemana(p.inicio);
                    setHoraFinSemana(p.fin);
                  }}
                  className="px-2 py-1 rounded bg-[#f7f7f8] border border-[#e5e7ea] text-[#1f2023] hover:bg-[#e5e7ea]/50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#e5e7ea] flex justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={handleAplicarDiasSemana}
            >
              <Plus className="w-4 h-4" />
              <span>Añadir horario a días seleccionados</span>
            </Button>
          </div>
        </div>
      )}

      {editable && modo === 'individual' && (
        <div className="p-4 rounded-[12px] bg-white border border-[#e5e7ea] space-y-4 shadow-xs">
          <label className="block text-xs font-semibold text-[#1f2023] uppercase tracking-wider">
            Añadir franja a una fecha puntual
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              id="fecha-individual"
              label="Fecha"
              type="date"
              value={fechaIndividual}
              onChange={(e) => setFechaIndividual(e.target.value)}
              required
            />
            <Input
              id="hora-inicio-ind"
              label="Hora de Inicio"
              type="time"
              value={horaInicioInd}
              onChange={(e) => setHoraInicioInd(e.target.value)}
              required
            />
            <Input
              id="hora-fin-ind"
              label="Hora de Fin"
              type="time"
              value={horaFinInd}
              onChange={(e) => setHoraFinInd(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleAgregarIndividual}
            >
              <Plus className="w-4 h-4 text-[#a6192e]" />
              <span>Agregar franja</span>
            </Button>
          </div>
        </div>
      )}

      {/* Visualización del Cronograma y Disponibilidad */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1f2023] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#a6192e]" />
            Cronograma de Disponibilidad y Ocupaciones de la Sala
          </h4>
          <span className="text-[11px] text-[#5b5f66]">
            {cronogramaPorFecha.length} fecha(s) con actividad o disponibilidad
          </span>
        </div>

        {cronogramaPorFecha.length === 0 ? (
          <div className="p-8 text-center rounded-[12px] border border-dashed border-[#e5e7ea] bg-[#f7f7f8] text-[#5b5f66] text-xs">
            <CalendarIcon className="w-8 h-8 text-[#9ca0a6] mx-auto mb-2 opacity-50" />
            <p className="font-medium text-[#1f2023]">Sin franjas de disponibilidad configuradas</p>
            <p className="mt-1 max-w-sm mx-auto">
              Usa los controles de arriba para añadir horarios por días de la semana o fechas puntuales.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {cronogramaPorFecha.map((item) => (
              <div
                key={item.fecha}
                className="p-3 rounded-[12px] border border-[#e5e7ea] bg-white hover:border-[#d8dadf] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#e5e7ea]/60">
                  <span className="text-xs font-bold text-[#1f2023] capitalize">
                    {formatearFechaAmigable(item.fecha)}
                  </span>
                  {editable && item.franjas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLimpiarFecha(item.fecha)}
                      className="text-[11px] text-[#5b5f66] hover:text-[#a6192e] transition-colors"
                      title="Eliminar todas las franjas de esta fecha"
                    >
                      Limpiar fecha
                    </button>
                  )}
                </div>

                {/* Franjas disponibles configuradas */}
                <div className="space-y-1.5">
                  {item.franjas.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.franjas.map((f, idx) => (
                        <span
                          key={f.id || idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[#f7f7f8] border border-[#e5e7ea] text-[#1f2023]"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>
                            {formatearHora(f.horaInicio)} – {formatearHora(f.horaFin)}
                          </span>
                          {editable && (
                            <button
                              type="button"
                              onClick={() => handleEliminarFranja(f.id || idx)}
                              className="text-[#5b5f66] hover:text-[#a6192e] ml-1 p-0.5 rounded"
                              title="Eliminar franja"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Franjas ocupadas por eventos */}
                  {item.ocupaciones.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-dashed border-[#e5e7ea]/60">
                      {item.ocupaciones.map((oc, ocIdx) => (
                        <div
                          key={oc.actividadId || ocIdx}
                          className="flex items-center justify-between text-xs p-2 rounded-[8px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e]"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-[#a6192e]" />
                            <span>
                              <strong>{formatearHora(oc.horaInicio)} – {formatearHora(oc.horaFin)}</strong>
                              {' : '}
                              Ocupado por «{oc.eventoNombre}»
                              {oc.actividadNombre ? ` (${oc.actividadNombre})` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/70 px-1.5 py-0.5 rounded text-[#7a0c1e]">
                            No disponible
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
