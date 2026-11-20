import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, Lock, MessageSquareText, RotateCw, UserRound, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import EstadoEncuestaBadge from './EstadoEncuestaBadge';
import { encuestaService } from '../../../api/encuestaService';
import {
  TIPOS_PREGUNTA,
  anchoBarra,
  formatearFecha,
  formatearFechaHora,
  formatearPorcentaje,
  formatearPromedio,
  interpretarErrorEncuesta,
  plural,
  resumenPregunta,
  textoAlcance,
} from '../encuestaUtils';

/**
 * @file ResultadosEncuesta.jsx
 * @description Resultados consolidados de una encuesta de satisfacción (HU-25, Criterio 4): habilitados, respuestas
 * y tasa de respuesta; por pregunta, el promedio y la distribución de la escala, el conteo por opción y los textos
 * libres. En las encuestas identificadas también muestra quién respondió qué (Criterio 2).
 * @module features/encuestas/components/ResultadosEncuesta
 */

/** Fila de una barra horizontal con etiqueta, cantidad y porcentaje. */
function Barra({ etiqueta, cantidad, porcentaje, ancho }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-ink-900 truncate" title={etiqueta}>{etiqueta}</span>
      <span className="flex-1 h-3 rounded-full bg-surface-muted overflow-hidden" aria-hidden="true">
        <span className="block h-full rounded-full bg-brand-600" style={{ width: `${ancho}%` }} />
      </span>
      <span className="w-20 shrink-0 text-right text-xs text-ink-600 tabular-nums whitespace-nowrap">
        {cantidad} · {formatearPorcentaje(porcentaje)}
      </span>
    </li>
  );
}

Barra.propTypes = {
  etiqueta: PropTypes.string.isRequired,
  cantidad: PropTypes.number.isRequired,
  porcentaje: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  ancho: PropTypes.number.isRequired,
};

/**
 * @param {Object} props
 * @param {number} props.eventoId
 * @param {{ encuestaId: number, titulo: string }} props.encuesta
 * @param {typeof encuestaService} [props.api]
 * @param {function(): void} props.onVolver
 */
export default function ResultadosEncuesta({ eventoId, encuesta, api = encuestaService, onVolver }) {
  const [resultados, setResultados] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const [individuales, setIndividuales] = useState(null);
  const [cargandoIndividuales, setCargandoIndividuales] = useState(false);
  const [errorIndividuales, setErrorIndividuales] = useState(null);
  const [verIndividuales, setVerIndividuales] = useState(false);

  useEffect(() => {
    let activo = true;
    api
      .obtenerResultados(eventoId, encuesta.encuestaId)
      .then((datos) => {
        if (!activo) return;
        setResultados(datos);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(interpretarErrorEncuesta(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, eventoId, encuesta.encuestaId, version]);

  const actualizar = () => {
    setError(null);
    setResultados(null);
    setIndividuales(null);
    setVerIndividuales(false);
    setVersion((v) => v + 1);
  };

  const alternarIndividuales = async () => {
    if (verIndividuales) {
      setVerIndividuales(false);
      return;
    }
    setVerIndividuales(true);
    if (individuales) return;
    setCargandoIndividuales(true);
    setErrorIndividuales(null);
    try {
      setIndividuales(await api.listarRespuestasPorParticipante(eventoId, encuesta.encuestaId));
    } catch (err) {
      setErrorIndividuales(interpretarErrorEncuesta(err).mensaje);
    } finally {
      setCargandoIndividuales(false);
    }
  };

  const encabezado = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Volver a las encuestas
      </button>
      <Button type="button" variant="outline" onClick={actualizar} className="h-9 px-3 text-xs">
        <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
        Actualizar
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-4">
        {encabezado}
        <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!resultados) {
    return (
      <div className="space-y-4">
        {encabezado}
        <p className="text-sm text-ink-600 py-6 text-center" role="status">Cargando resultados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {encabezado}

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-serif-title text-xl text-ink-900">{resultados.titulo}</h3>
          <EstadoEncuestaBadge estado={resultados.estado} />
        </div>
        <p className="text-xs text-ink-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{textoAlcance(resultados)}</span>
          <span className="inline-flex items-center gap-1">
            {resultados.anonima ? <Lock className="w-3.5 h-3.5" aria-hidden="true" /> : <UserRound className="w-3.5 h-3.5" aria-hidden="true" />}
            {resultados.anonima ? 'Anónima' : 'Identificada'}
          </span>
          <span>Consultado: {formatearFechaHora(resultados.fechaConsulta)}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Habilitados</p>
          <p className="font-serif-title text-3xl text-ink-900 mt-1 tabular-nums">{resultados.totalHabilitados}</p>
          <p className="text-xs text-ink-600">con asistencia registrada</p>
        </div>
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Respuestas</p>
          <p className="font-serif-title text-3xl text-ink-900 mt-1 tabular-nums">{resultados.totalRespuestas}</p>
          <p className="text-xs text-ink-600">participantes que respondieron</p>
        </div>
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Tasa de respuesta</p>
          <p className="font-serif-title text-3xl text-ink-900 mt-1 tabular-nums">{formatearPorcentaje(resultados.tasaRespuesta)}</p>
          <p className="text-xs text-ink-600">sobre los habilitados</p>
        </div>
      </div>

      {resultados.totalRespuestas === 0 && (
        <p className="text-sm text-ink-600 p-4 rounded-[12px] border border-dashed border-field-border text-center">
          Todavía nadie ha respondido esta encuesta.
        </p>
      )}

      <ol className="space-y-3">
        {(resultados.preguntas || []).map((p) => (
          <li key={p.preguntaId} className="p-4 rounded-[12px] border border-border bg-white space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-600">
                Pregunta {p.orden} · {TIPOS_PREGUNTA[p.tipoRespuesta]?.etiqueta || p.tipoRespuesta}
                {!p.obligatoria && ' · opcional'}
              </p>
              <p className="text-sm font-semibold text-ink-900 mt-1">{p.texto}</p>
              <p className="text-xs text-ink-600 mt-0.5">{resumenPregunta(p)}</p>
            </div>

            {p.tipoRespuesta === 'escala' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="sm:w-32 shrink-0">
                  <p className="text-xs text-ink-600">Promedio</p>
                  <p className="font-serif-title text-3xl text-brand-600 tabular-nums">{formatearPromedio(p.promedio)}</p>
                  <p className="text-xs text-ink-600">escala {p.escalaMinima} a {p.escalaMaxima}</p>
                </div>
                <ul className="flex-1 space-y-1.5" aria-label={`Distribución de «${p.texto}»`}>
                  {(p.distribucion || []).map((d) => (
                    <Barra
                      key={d.valor}
                      etiqueta={String(d.etiqueta ?? d.valor)}
                      cantidad={d.cantidad}
                      porcentaje={d.porcentaje}
                      ancho={anchoBarra(d.cantidad, p.distribucion)}
                    />
                  ))}
                </ul>
              </div>
            )}

            {p.tipoRespuesta === 'opcion' && (
              <ul className="space-y-1.5" aria-label={`Opciones de «${p.texto}»`}>
                {(p.distribucion || []).map((d) => (
                  <Barra
                    key={d.opcionId}
                    etiqueta={d.etiqueta}
                    cantidad={d.cantidad}
                    porcentaje={d.porcentaje}
                    ancho={anchoBarra(d.cantidad, p.distribucion)}
                  />
                ))}
              </ul>
            )}

            {p.tipoRespuesta === 'texto' &&
              ((p.respuestasTexto || []).length === 0 ? (
                <p className="text-xs text-ink-600">Sin respuestas escritas.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {p.respuestasTexto.map((t, k) => (
                    <li key={k} className="p-3 rounded-[8px] bg-surface-muted border border-border">
                      <p className="text-sm text-ink-900 whitespace-pre-line flex gap-2">
                        <MessageSquareText className="w-4 h-4 text-ink-300 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{t.texto}</span>
                      </p>
                      <p className="text-[11px] text-ink-600 mt-1 pl-6">
                        {t.participanteNombre ? `${t.participanteNombre} · ` : ''}
                        {formatearFecha(t.fecha)}
                      </p>
                    </li>
                  ))}
                </ul>
              ))}
          </li>
        ))}
      </ol>

      {resultados.anonima ? (
        <p className="text-xs text-ink-600 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          Encuesta anónima: las respuestas no están asociadas a los participantes.
        </p>
      ) : (
        resultados.totalRespuestas > 0 && (
          <section className="space-y-3" aria-label="Respuestas por participante">
            <Button type="button" variant="outline" onClick={alternarIndividuales} className="h-9 px-3 text-xs">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              {verIndividuales ? 'Ocultar respuestas por participante' : 'Ver respuestas por participante'}
            </Button>
            {verIndividuales && cargandoIndividuales && (
              <p className="text-sm text-ink-600" role="status">Cargando respuestas...</p>
            )}
            {verIndividuales && errorIndividuales && (
              <p className="text-sm text-brand-700" role="alert">{errorIndividuales}</p>
            )}
            {verIndividuales && individuales && (
              <ul className="space-y-2">
                {individuales.map((r) => (
                  <li key={r.personaId} className="p-3 rounded-[12px] border border-border bg-white">
                    <p className="text-sm font-semibold text-ink-900">{r.participanteNombre}</p>
                    <p className="text-xs text-ink-600">
                      {r.numeroDocumento} · {r.correo} · {formatearFechaHora(r.fechaRespuesta)}
                    </p>
                    <dl className="mt-2 space-y-1">
                      {r.respuestas.map((d) => (
                        <div key={d.preguntaId} className="text-sm grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-3">
                          <dt className="text-ink-600">{d.orden}. {d.pregunta}</dt>
                          <dd className="text-ink-900 font-medium whitespace-pre-line">{d.respuesta}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
                {individuales.length === 0 && <li className="text-sm text-ink-600">Sin respuestas.</li>}
              </ul>
            )}
            {verIndividuales && individuales && (
              <p className="text-xs text-ink-600">
                {plural(individuales.length, 'participante')} {individuales.length === 1 ? 'respondió' : 'respondieron'}.
              </p>
            )}
          </section>
        )
      )}
    </div>
  );
}

ResultadosEncuesta.propTypes = {
  eventoId: PropTypes.number.isRequired,
  encuesta: PropTypes.shape({ encuestaId: PropTypes.number.isRequired, titulo: PropTypes.string }).isRequired,
  api: PropTypes.shape({
    obtenerResultados: PropTypes.func.isRequired,
    listarRespuestasPorParticipante: PropTypes.func,
  }),
  onVolver: PropTypes.func.isRequired,
};
