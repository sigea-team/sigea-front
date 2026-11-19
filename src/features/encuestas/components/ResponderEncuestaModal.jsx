import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle2, ClipboardList, Lock, RotateCw, Send, UserRound } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import TextArea from '../../eventos/components/TextArea';
import { encuestaService } from '../../../api/encuestaService';
import {
  MAX_TEXTO_RESPUESTA,
  aRespuestasRequest,
  erroresRespuestasDeBackend,
  formatearFechaHora,
  interpretarErrorEncuesta,
  respuestasVacias,
  textoAlcance,
  validarRespuestas,
  valoresEscala,
} from '../encuestaUtils';

/**
 * @file ResponderEncuestaModal.jsx
 * @description Formulario con el que el participante responde una encuesta de satisfacción (HU-25, CU-22).
 * - Criterio 2: envía las respuestas; se guardan anónimas o identificadas según la configuración, y se le informa cuál.
 * - Criterio 3: si no registró asistencia, el backend responde 403 ENCUESTA_NO_HABILITADA y se muestra el motivo.
 * - CU-22, flujo alterno: si ya respondió, se le informa y no se envía de nuevo.
 * @module features/encuestas/components/ResponderEncuestaModal
 */

/**
 * @param {Object} props
 * @param {number} props.encuestaId
 * @param {string} [props.titulo] - Título a mostrar mientras carga.
 * @param {typeof encuestaService} [props.api]
 * @param {function(): void} props.onClose
 * @param {function(string): void} [props.onRespondida] - Recibe el mensaje de confirmación.
 */
export default function ResponderEncuestaModal({ encuestaId, titulo, api = encuestaService, onClose, onRespondida }) {
  const [encuesta, setEncuesta] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);
  const [valores, setValores] = useState({});
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [envio, setEnvio] = useState(null);

  useEffect(() => {
    let activo = true;
    api
      .obtenerFormulario(encuestaId)
      .then((datos) => {
        if (!activo) return;
        setEncuesta(datos);
        setValores(respuestasVacias(datos.preguntas));
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(interpretarErrorEncuesta(err));
      });
    return () => {
      activo = false;
    };
  }, [api, encuestaId, version]);

  const reintentar = () => {
    setErrorCarga(null);
    setEncuesta(null);
    setVersion((v) => v + 1);
  };

  const cambiar = (preguntaId, valor) => {
    setValores((v) => ({ ...v, [preguntaId]: valor }));
    setErrores((e) => ({ ...e, [preguntaId]: undefined }));
    setErrorGeneral(null);
  };

  const enviar = async () => {
    setErrorGeneral(null);
    const validacion = validarRespuestas(encuesta.preguntas, valores);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      setErrorGeneral({
        titulo: 'Revisa tus respuestas',
        mensaje: validacion.general || 'Hay preguntas obligatorias sin responder o respuestas inválidas.',
      });
      return;
    }
    setEnviando(true);
    try {
      const r = await api.responderEncuesta(encuestaId, aRespuestasRequest(encuesta.preguntas, valores));
      setEnvio(r);
      onRespondida?.(r.mensaje);
    } catch (err) {
      const info = interpretarErrorEncuesta(err);
      const { porPregunta, general } = erroresRespuestasDeBackend(info.campos);
      setErrores(porPregunta);
      setErrorGeneral({ titulo: info.titulo, mensaje: general ? `${info.mensaje} ${general}` : info.mensaje, codigo: info.codigo });
      if (info.codigo === 'ENCUESTA_YA_RESPONDIDA' || info.codigo === 'ENCUESTA_CERRADA') onRespondida?.(null);
    } finally {
      setEnviando(false);
    }
  };

  const bloqueada =
    envio || (encuesta && (!encuesta.recibeRespuestas || encuesta.respondida)) ||
    ['ENCUESTA_YA_RESPONDIDA', 'ENCUESTA_CERRADA', 'ENCUESTA_NO_HABILITADA'].includes(errorGeneral?.codigo);

  let contenido;
  if (errorCarga) {
    const noHabilitada = errorCarga.codigo === 'ENCUESTA_NO_HABILITADA';
    contenido = (
      <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm space-y-2" role="alert">
        <p className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {errorCarga.titulo}
        </p>
        <p>{errorCarga.mensaje}</p>
        {!noHabilitada && errorCarga.status !== 404 && (
          <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer">
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            Reintentar
          </button>
        )}
      </div>
    );
  } else if (!encuesta) {
    contenido = <p className="text-sm text-ink-600 py-6 text-center" role="status">Cargando encuesta...</p>;
  } else if (envio) {
    contenido = (
      <div className="py-6 text-center space-y-3" role="status">
        <CheckCircle2 className="w-12 h-12 text-brand-600 mx-auto" aria-hidden="true" />
        <p className="font-serif-title text-xl text-ink-900">¡Gracias por responder!</p>
        <p className="text-sm text-ink-600 max-w-md mx-auto">{envio.mensaje}</p>
        <p className="text-xs text-ink-600">
          {envio.preguntasRespondidas} {envio.preguntasRespondidas === 1 ? 'respuesta enviada' : 'respuestas enviadas'} ·{' '}
          {formatearFechaHora(envio.fechaRespuesta)}
        </p>
      </div>
    );
  } else {
    contenido = (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs text-ink-600">{encuesta.eventoNombre} · {textoAlcance(encuesta)}</p>
          {encuesta.descripcion && <p className="text-sm text-ink-900 whitespace-pre-line">{encuesta.descripcion}</p>}
          <p className="text-xs text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-start gap-2">
            {encuesta.anonima ? (
              <Lock className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
            ) : (
              <UserRound className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
            )}
            {encuesta.anonima
              ? 'Encuesta anónima: tus respuestas no quedan asociadas a tu nombre.'
              : 'Encuesta identificada: los organizadores verán tus respuestas con tu nombre.'}
          </p>
          {encuesta.fechaCierre && encuesta.recibeRespuestas && (
            <p className="text-xs text-ink-600">Puedes responder hasta el {formatearFechaHora(encuesta.fechaCierre)}.</p>
          )}
        </div>

        {encuesta.respondida && (
          <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-center gap-2" role="status">
            <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
            Ya respondiste esta encuesta el {formatearFechaHora(encuesta.fechaRespuesta)}. Gracias por tu opinión.
          </p>
        )}
        {!encuesta.respondida && !encuesta.recibeRespuestas && (
          <p className="text-sm text-brand-700 bg-brand-100 border border-brand-600 px-3 py-2 rounded-[8px]" role="status">
            Esta encuesta ya no recibe respuestas.
          </p>
        )}

        {errorGeneral && (
          <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-1" role="alert">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {errorGeneral.titulo}
            </p>
            <p>{errorGeneral.mensaje}</p>
          </div>
        )}

        {!encuesta.respondida && encuesta.recibeRespuestas && (
          <ol className="space-y-4">
            {encuesta.preguntas.map((p, i) => {
              const error = errores[p.preguntaId];
              const idTitulo = `pregunta-${p.preguntaId}-titulo`;
              return (
                <li
                  key={p.preguntaId}
                  className={`p-4 rounded-[12px] border bg-white space-y-3 ${error ? 'border-brand-600' : 'border-border'}`}
                >
                  <p id={idTitulo} className="text-sm font-semibold text-ink-900">
                    {i + 1}. {p.texto}
                    {p.obligatoria ? (
                      <span className="text-brand-600 font-bold ml-1" aria-label="obligatoria">*</span>
                    ) : (
                      <span className="text-xs font-normal text-ink-600 ml-1">(opcional)</span>
                    )}
                  </p>

                  {p.tipoRespuesta === 'escala' && (
                    <div role="radiogroup" aria-labelledby={idTitulo} className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        {valoresEscala(p).map((v) => {
                          const elegido = String(valores[p.preguntaId]) === String(v);
                          return (
                            <label
                              key={v}
                              className={`min-w-10 h-10 px-3 inline-flex items-center justify-center rounded-[8px] border text-sm font-semibold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-brand-600 ${
                                elegido ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-field-border text-ink-900 hover:bg-surface-muted'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`pregunta-${p.preguntaId}`}
                                value={v}
                                checked={elegido}
                                onChange={() => cambiar(p.preguntaId, String(v))}
                                className="sr-only"
                              />
                              {v}
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-ink-600">
                        De {p.escalaMinima} (más bajo) a {p.escalaMaxima} (más alto)
                      </p>
                    </div>
                  )}

                  {p.tipoRespuesta === 'opcion' && (
                    <div role="radiogroup" aria-labelledby={idTitulo} className="space-y-1.5">
                      {(p.opciones || []).map((o) => (
                        <label key={o.opcionId} className="flex items-center gap-2 text-sm text-ink-900 cursor-pointer select-none">
                          <input
                            type="radio"
                            name={`pregunta-${p.preguntaId}`}
                            value={o.opcionId}
                            checked={String(valores[p.preguntaId]) === String(o.opcionId)}
                            onChange={() => cambiar(p.preguntaId, String(o.opcionId))}
                            className="w-4 h-4 accent-brand-600"
                          />
                          {o.texto}
                        </label>
                      ))}
                    </div>
                  )}

                  {p.tipoRespuesta === 'texto' && (
                    <TextArea
                      id={`pregunta-${p.preguntaId}-respuesta`}
                      value={valores[p.preguntaId] || ''}
                      onChange={(e) => cambiar(p.preguntaId, e.target.value)}
                      placeholder="Escribe tu respuesta."
                      rows={3}
                      maxLength={MAX_TEXTO_RESPUESTA}
                    />
                  )}

                  {error && <p className="text-xs text-brand-700 font-medium" role="alert">{error}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  }

  return (
    <ModalShell
      titulo={encuesta?.titulo || titulo || 'Encuesta de satisfacción'}
      subtitulo="Encuesta de satisfacción"
      icono={ClipboardList}
      onClose={onClose}
      ancho="max-w-2xl"
      tituloId="responder-encuesta-titulo"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={enviando} className="h-10 px-4 text-sm">
            {bloqueada || errorCarga ? 'Cerrar' : 'Cancelar'}
          </Button>
          {encuesta && !bloqueada && !errorCarga && (
            <Button type="button" variant="primary" onClick={enviar} loading={enviando} className="h-10 px-4 text-sm">
              <Send className="w-4 h-4" aria-hidden="true" />
              Enviar respuestas
            </Button>
          )}
        </>
      }
    >
      {contenido}
    </ModalShell>
  );
}

ResponderEncuestaModal.propTypes = {
  encuestaId: PropTypes.number.isRequired,
  titulo: PropTypes.string,
  api: PropTypes.shape({
    obtenerFormulario: PropTypes.func.isRequired,
    responderEncuesta: PropTypes.func.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
  onRespondida: PropTypes.func,
};
