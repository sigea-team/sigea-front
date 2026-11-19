import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ArrowDown, ArrowUp, Lock, Plus, Save, Trash2, UserRound, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TextArea from '../../eventos/components/TextArea';
import { encuestaService } from '../../../api/encuestaService';
import {
  ESCALA_MAX_PERMITIDA,
  ESCALA_MIN_PERMITIDA,
  MAX_DESCRIPCION,
  MAX_OPCIONES,
  MAX_PREGUNTAS,
  MAX_TEXTO_OPCION,
  MAX_TEXTO_PREGUNTA,
  MAX_TITULO,
  TIPOS_PREGUNTA,
  aEncuestaRequest,
  aFormulario,
  cambiarTipoPregunta,
  erroresDeBackend,
  formularioVacio,
  interpretarErrorEncuesta,
  opcionesAlcance,
  preguntaVacia,
  validarEncuesta,
} from '../encuestaUtils';

/**
 * @file EncuestaFormulario.jsx
 * @description Configuración de una encuesta de satisfacción en borrador (HU-25, Criterio 1): título, a qué se
 * aplica (el evento en general o una actividad), si es anónima o identificada (Criterio 2), fecha de cierre opcional
 * y preguntas de escala, opción única o texto libre, obligatorias u opcionales. Al guardar reemplaza todas las
 * preguntas de la encuesta.
 * @module features/encuestas/components/EncuestaFormulario
 */

const OPCIONES_TIPO = Object.entries(TIPOS_PREGUNTA).map(([value, t]) => ({ value, label: t.etiqueta }));

/**
 * @param {Object} props
 * @param {number} props.eventoId
 * @param {Object|null} [props.encuesta] - Encuesta en borrador a modificar; null para crear una nueva.
 * @param {typeof encuestaService} [props.api]
 * @param {function(Object, string): void} props.onGuardada - Recibe la encuesta guardada y un mensaje.
 * @param {function(): void} props.onCancelar
 */
export default function EncuestaFormulario({ eventoId, encuesta = null, api = encuestaService, onGuardada, onCancelar }) {
  const [form, setForm] = useState(() => (encuesta ? aFormulario(encuesta) : formularioVacio()));
  const [errores, setErrores] = useState({ preguntas: {} });
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [actividades, setActividades] = useState(null);
  const [errorActividades, setErrorActividades] = useState(false);

  useEffect(() => {
    let activo = true;
    api
      .listarActividadesEvento(eventoId)
      .then((lista) => {
        if (activo) setActividades(lista || []);
      })
      .catch(() => {
        if (activo) {
          setActividades([]);
          setErrorActividades(true);
        }
      });
    return () => {
      activo = false;
    };
  }, [api, eventoId]);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const cambiarPregunta = (i, cambios) => {
    setForm((f) => ({ ...f, preguntas: f.preguntas.map((p, j) => (j === i ? { ...p, ...cambios } : p)) }));
    setErrores((e) => ({ ...e, preguntas: { ...e.preguntas, [i]: undefined } }));
  };

  const moverPregunta = (i, delta) => {
    setForm((f) => {
      const lista = [...f.preguntas];
      const destino = i + delta;
      if (destino < 0 || destino >= lista.length) return f;
      [lista[i], lista[destino]] = [lista[destino], lista[i]];
      return { ...f, preguntas: lista };
    });
    setErrores((e) => ({ ...e, preguntas: {} }));
  };

  const quitarPregunta = (i) => {
    setForm((f) => ({ ...f, preguntas: f.preguntas.filter((_, j) => j !== i) }));
    setErrores((e) => ({ ...e, preguntas: {} }));
  };

  const agregarPregunta = (tipo) => {
    setForm((f) => ({ ...f, preguntas: [...f.preguntas, preguntaVacia(tipo)] }));
    setErrores((e) => ({ ...e, preguntasGeneral: undefined }));
  };

  const cambiarOpcion = (i, j, texto) => {
    const p = form.preguntas[i];
    cambiarPregunta(i, { opciones: p.opciones.map((o, k) => (k === j ? texto : o)) });
  };

  const guardar = async () => {
    setErrorGeneral(null);
    const validacion = validarEncuesta(form);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      setErrorGeneral({ titulo: 'Revisa los campos marcados', mensaje: 'Hay datos incompletos o inválidos en la encuesta.' });
      return;
    }
    setGuardando(true);
    try {
      const solicitud = aEncuestaRequest(form);
      const guardada = encuesta
        ? await api.actualizarEncuesta(eventoId, encuesta.encuestaId, solicitud)
        : await api.crearEncuesta(eventoId, solicitud);
      onGuardada(
        guardada,
        encuesta
          ? `Se guardaron los cambios de «${guardada.titulo}».`
          : `La encuesta «${guardada.titulo}» quedó en borrador. Publícala cuando esté lista.`
      );
    } catch (err) {
      const info = interpretarErrorEncuesta(err);
      setErrores(erroresDeBackend(info.campos));
      setErrorGeneral(info);
    } finally {
      setGuardando(false);
    }
  };

  const alcance = opcionesAlcance(actividades);

  return (
    <div className="space-y-5">
      {errorGeneral && (
        <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-1" role="alert">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {errorGeneral.titulo}
          </p>
          <p>{errorGeneral.mensaje}</p>
        </div>
      )}

      <section className="space-y-4" aria-labelledby="encuesta-config-titulo">
        <h3 id="encuesta-config-titulo" className="text-sm font-bold text-ink-900">Configuración</h3>
        <Input
          id="encuesta-titulo"
          label="Título"
          required
          value={form.titulo}
          onChange={(e) => cambiar('titulo', e.target.value)}
          placeholder="Por ejemplo: ¿Cómo te pareció el taller?"
          maxLength={MAX_TITULO}
          error={errores.titulo}
        />
        <TextArea
          id="encuesta-descripcion"
          label="Instrucciones (opcional)"
          value={form.descripcion}
          onChange={(e) => cambiar('descripcion', e.target.value)}
          placeholder="Lo que verán los participantes antes de las preguntas."
          rows={2}
          maxLength={MAX_DESCRIPCION}
          error={errores.descripcion}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="encuesta-alcance"
            label="Se aplica a"
            value={form.actividadId}
            onChange={(e) => cambiar('actividadId', e.target.value)}
            options={alcance}
            disabled={actividades === null}
            error={errores.actividadId}
            helperText={
              actividades === null
                ? 'Cargando actividades...'
                : errorActividades
                ? 'No se pudieron cargar las actividades; puedes crear la encuesta general del evento.'
                : 'Solo la responden quienes registraron su asistencia.'
            }
          />
          <Input
            id="encuesta-fecha-cierre"
            type="datetime-local"
            label="Fecha de cierre (opcional)"
            value={form.fechaCierre}
            onChange={(e) => cambiar('fechaCierre', e.target.value)}
            error={errores.fechaCierre}
            helperText="Después de esta fecha ya no se reciben respuestas."
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink-900 mb-1.5">Respuestas</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { valor: true, icono: Lock, titulo: 'Anónimas', texto: 'Se guardan sin identificar al participante. Solo verás resultados consolidados.' },
              { valor: false, icono: UserRound, titulo: 'Identificadas', texto: 'Se guardan con el nombre del participante y podrás ver quién respondió qué.' },
            ].map((op) => {
              const Icono = op.icono;
              const elegida = form.anonima === op.valor;
              return (
                <label
                  key={op.titulo}
                  className={`flex gap-3 p-3 rounded-[12px] border cursor-pointer transition-colors ${
                    elegida ? 'border-brand-600 bg-brand-100' : 'border-field-border bg-white hover:bg-surface-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="encuesta-anonima"
                    checked={elegida}
                    onChange={() => cambiar('anonima', op.valor)}
                    className="mt-1 w-4 h-4 accent-brand-600"
                  />
                  <span>
                    <span className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
                      <Icono className="w-4 h-4 text-brand-600" aria-hidden="true" />
                      {op.titulo}
                    </span>
                    <span className="block text-xs text-ink-600 mt-0.5">{op.texto}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-ink-600">No se puede cambiar después de publicar.</p>
        </fieldset>
      </section>

      <section className="space-y-3" aria-labelledby="encuesta-preguntas-titulo">
        <div className="flex items-center justify-between gap-3">
          <h3 id="encuesta-preguntas-titulo" className="text-sm font-bold text-ink-900">
            Preguntas <span className="text-ink-600 font-normal">({form.preguntas.length})</span>
          </h3>
        </div>

        {form.preguntas.length === 0 && (
          <p className="text-sm text-ink-600 p-4 rounded-[12px] border border-dashed border-field-border text-center">
            Todavía no hay preguntas. Puedes guardar el borrador, pero necesitas al menos una para publicar.
          </p>
        )}

        <ol className="space-y-3">
          {form.preguntas.map((p, i) => {
            const e = errores.preguntas?.[i] || {};
            return (
              <li key={p.clave} className="p-4 rounded-[12px] border border-border bg-white space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Pregunta {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moverPregunta(i, -1)}
                      disabled={i === 0}
                      className="p-1.5 rounded-full text-ink-600 hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label={`Subir la pregunta ${i + 1}`}
                      title="Subir"
                    >
                      <ArrowUp className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverPregunta(i, 1)}
                      disabled={i === form.preguntas.length - 1}
                      className="p-1.5 rounded-full text-ink-600 hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label={`Bajar la pregunta ${i + 1}`}
                      title="Bajar"
                    >
                      <ArrowDown className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => quitarPregunta(i)}
                      className="p-1.5 rounded-full text-ink-600 hover:text-brand-700 hover:bg-brand-100 cursor-pointer"
                      aria-label={`Quitar la pregunta ${i + 1}`}
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <TextArea
                  id={`pregunta-${p.clave}-texto`}
                  label="Enunciado"
                  value={p.texto}
                  onChange={(ev) => cambiarPregunta(i, { texto: ev.target.value })}
                  rows={2}
                  maxLength={MAX_TEXTO_PREGUNTA}
                  error={e.texto}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <Select
                    id={`pregunta-${p.clave}-tipo`}
                    label="Tipo de respuesta"
                    value={p.tipoRespuesta}
                    onChange={(ev) => cambiarPregunta(i, cambiarTipoPregunta(p, ev.target.value))}
                    options={OPCIONES_TIPO}
                    helperText={TIPOS_PREGUNTA[p.tipoRespuesta]?.descripcion}
                  />
                  <label className="flex items-center gap-2 text-sm text-ink-900 cursor-pointer select-none h-11 sm:mt-[26px]">
                    <input
                      type="checkbox"
                      checked={p.obligatoria}
                      onChange={(ev) => cambiarPregunta(i, { obligatoria: ev.target.checked })}
                      className="w-4 h-4 accent-brand-600"
                    />
                    Obligatoria
                  </label>
                </div>

                {p.tipoRespuesta === 'escala' && (
                  <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-3 max-w-xs">
                      <Input
                        id={`pregunta-${p.clave}-min`}
                        type="number"
                        label="Desde"
                        min={ESCALA_MIN_PERMITIDA}
                        max={ESCALA_MAX_PERMITIDA}
                        value={p.escalaMinima}
                        onChange={(ev) => cambiarPregunta(i, { escalaMinima: ev.target.value })}
                      />
                      <Input
                        id={`pregunta-${p.clave}-max`}
                        type="number"
                        label="Hasta"
                        min={ESCALA_MIN_PERMITIDA}
                        max={ESCALA_MAX_PERMITIDA}
                        value={p.escalaMaxima}
                        onChange={(ev) => cambiarPregunta(i, { escalaMaxima: ev.target.value })}
                      />
                    </div>
                    {e.escala && <p className="text-xs text-brand-700 font-medium">{e.escala}</p>}
                  </div>
                )}

                {p.tipoRespuesta === 'opcion' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-ink-900">Opciones</p>
                    {p.opciones.map((o, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="text-xs text-ink-600 w-5 pt-3.5 text-right tabular-nums">{j + 1}.</span>
                        <div className="flex-1">
                          <Input
                            id={`pregunta-${p.clave}-opcion-${j}`}
                            aria-label={`Opción ${j + 1} de la pregunta ${i + 1}`}
                            value={o}
                            onChange={(ev) => cambiarOpcion(i, j, ev.target.value)}
                            maxLength={MAX_TEXTO_OPCION}
                            error={e.porOpcion?.[j]}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => cambiarPregunta(i, { opciones: p.opciones.filter((_, k) => k !== j) })}
                          className="mt-2.5 p-1.5 rounded-full text-ink-600 hover:text-brand-700 hover:bg-brand-100 cursor-pointer"
                          aria-label={`Quitar la opción ${j + 1} de la pregunta ${i + 1}`}
                          title="Quitar opción"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    {e.opciones && <p className="text-xs text-brand-700 font-medium">{e.opciones}</p>}
                    <button
                      type="button"
                      onClick={() => cambiarPregunta(i, { opciones: [...p.opciones, ''] })}
                      disabled={p.opciones.length >= MAX_OPCIONES}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-ink-300 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      Agregar opción
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {errores.preguntasGeneral && (
          <p className="text-xs text-brand-700 font-medium" role="alert">{errores.preguntasGeneral}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {OPCIONES_TIPO.map((t) => (
            <Button
              key={t.value}
              type="button"
              variant="outline"
              onClick={() => agregarPregunta(t.value)}
              disabled={form.preguntas.length >= MAX_PREGUNTAS}
              className="h-9 px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Pregunta de {t.label.toLowerCase()}
            </Button>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando} className="h-10 px-4 text-sm">
          Cancelar
        </Button>
        <Button type="button" variant="primary" onClick={guardar} loading={guardando} className="h-10 px-4 text-sm">
          <Save className="w-4 h-4" aria-hidden="true" />
          {encuesta ? 'Guardar cambios' : 'Guardar borrador'}
        </Button>
      </div>
    </div>
  );
}

EncuestaFormulario.propTypes = {
  eventoId: PropTypes.number.isRequired,
  encuesta: PropTypes.object,
  api: PropTypes.shape({
    listarActividadesEvento: PropTypes.func.isRequired,
    crearEncuesta: PropTypes.func.isRequired,
    actualizarEncuesta: PropTypes.func.isRequired,
  }),
  onGuardada: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};
