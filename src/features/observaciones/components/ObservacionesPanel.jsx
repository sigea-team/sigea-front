import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, BadgeCheck, CheckCheck, Info, Lock, MessageSquareText, Plus, RotateCw, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import TextArea from '../../eventos/components/TextArea';
import { observacionService } from '../../../api/observacionService';
import {
  MAX_DESCRIPCION,
  filaObservacionVacia,
  formatearFecha,
  infoEstadoObservacion,
  interpretarErrorObservacion,
  mensajeParaAutor,
  puedeAprobar,
  puedeRegistrar,
  puedeResolver,
  validarObservaciones,
} from '../observacionUtils';

/**
 * @file ObservacionesPanel.jsx
 * @description Observaciones y ajustes requeridos de una propuesta y aprobación de su versión definitiva
 * (HU-19: RF28, RF29). Según `modo`:
 * - `evaluador`: registra observaciones (Criterio 1) y da por resueltos los ajustes atendidos (Criterio 2).
 * - `admin`: lo mismo y, además, aprueba la versión definitiva (Criterio 3); si quedan ajustes, muestra los
 *   pendientes que devuelve el backend (Criterio 4).
 * - `autor`: solo consulta las observaciones, qué versión las atendió y qué le falta.
 * El padre debe montarlo con una `key` distinta por propuesta.
 * @module features/observaciones/components/ObservacionesPanel
 */

/**
 * @param {Object} props
 * @param {number} props.propuestaId
 * @param {'admin'|'evaluador'|'autor'} props.modo
 * @param {typeof observacionService} [props.api]
 * @param {function(Object): void} [props.onResumen] - Recibe la situación cada vez que se carga.
 * @param {function(string): void} [props.onCambio] - Recibe un mensaje tras registrar, resolver o aprobar.
 */
export default function ObservacionesPanel({ propuestaId, modo, api = observacionService, onResumen, onCambio }) {
  const [resumen, setResumen] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);

  const [filas, setFilas] = useState([filaObservacionVacia()]);
  const [erroresForm, setErroresForm] = useState({ general: null, porFila: {} });
  const [registrando, setRegistrando] = useState(false);

  const [resolviendoId, setResolviendoId] = useState(null);
  const [confirmandoAprobacion, setConfirmandoAprobacion] = useState(false);
  const [aprobando, setAprobando] = useState(false);

  const [error, setError] = useState(null); // { titulo, mensaje, pendientes }
  const [aviso, setAviso] = useState(null);

  const esAutor = modo === 'autor';
  const esAdmin = modo === 'admin';

  useEffect(() => {
    let activo = true;
    api
      .listarObservaciones(propuestaId)
      .then((datos) => {
        if (!activo) return;
        setResumen(datos);
        setErrorCarga(null);
        onResumen?.(datos);
      })
      .catch((err) => {
        if (activo) setErrorCarga(interpretarErrorObservacion(err).mensaje);
      });
    return () => {
      activo = false;
    };
    // onResumen se omite a propósito: el padre suele pasar una función nueva en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, propuestaId, version]);

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setErrorCarga(null);
    setResumen(null);
    recargar();
  };

  const avisar = (mensaje) => {
    setAviso(mensaje);
    onCambio?.(mensaje);
  };

  // ── Criterio 1: registrar observaciones ──
  const cambiarFila = (i, cambios) => {
    setFilas((actual) => actual.map((f, j) => (j === i ? { ...f, ...cambios } : f)));
    setErroresForm((e) => ({ general: null, porFila: { ...e.porFila, [i]: undefined } }));
  };

  const quitarFila = (i) => {
    setFilas((actual) => (actual.length === 1 ? [filaObservacionVacia()] : actual.filter((_, j) => j !== i)));
    setErroresForm({ general: null, porFila: {} });
  };

  const registrar = async () => {
    setError(null);
    setAviso(null);
    const validacion = validarObservaciones(filas);
    if (!validacion.valido) {
      setErroresForm({ general: validacion.general, porFila: validacion.porFila });
      return;
    }
    setRegistrando(true);
    try {
      const datos = await api.registrarObservaciones(propuestaId, validacion.observaciones);
      setResumen(datos);
      onResumen?.(datos);
      setFilas([filaObservacionVacia()]);
      setErroresForm({ general: null, porFila: {} });
      const ajustes = validacion.observaciones.filter((o) => o.requiereAjuste).length;
      avisar(
        `Se registraron ${validacion.observaciones.length} ${validacion.observaciones.length === 1 ? 'observación' : 'observaciones'}` +
          (ajustes ? ` (${ajustes} con ajuste requerido)` : '') +
          '. Se notificó a los autores.'
      );
    } catch (err) {
      setError(interpretarErrorObservacion(err));
    } finally {
      setRegistrando(false);
    }
  };

  // ── Criterio 2: dar por resuelto un ajuste atendido ──
  const resolver = async (observacion) => {
    setError(null);
    setAviso(null);
    setResolviendoId(observacion.id);
    try {
      await api.resolverObservacion(propuestaId, observacion.id);
      recargar();
      avisar(observacion.requiereAjuste ? 'El ajuste quedó resuelto.' : 'El comentario quedó cerrado.');
    } catch (err) {
      setError(interpretarErrorObservacion(err));
    } finally {
      setResolviendoId(null);
    }
  };

  // ── Criterios 3 y 4: aprobar la versión definitiva ──
  const aprobar = async () => {
    setError(null);
    setAviso(null);
    setAprobando(true);
    try {
      const r = await api.aprobarVersionDefinitiva(propuestaId);
      setConfirmandoAprobacion(false);
      recargar();
      avisar(
        `La versión ${r.numeroVersion} quedó aprobada como definitiva: ya no admite cambios y está disponible para programar en la agenda.`
      );
    } catch (err) {
      setConfirmandoAprobacion(false);
      setError(interpretarErrorObservacion(err));
      recargar();
    } finally {
      setAprobando(false);
    }
  };

  if (errorCarga) {
    return (
      <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm flex items-center justify-between gap-4" role="alert">
        <span>{errorCarga}</span>
        <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer">
          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!resumen) {
    return (
      <p className="text-sm text-ink-600 py-6 text-center" role="status">
        Cargando observaciones...
      </p>
    );
  }

  const registro = puedeRegistrar(resumen);
  const aprobacion = puedeAprobar(resumen);
  const observaciones = resumen.observaciones || [];
  const definitiva = resumen.versionDefinitiva != null;

  return (
    <div className="space-y-5">
      {/* Situación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Versión actual</p>
          <p className="font-serif-title text-3xl text-ink-900 mt-1 tabular-nums">{resumen.versionActual ?? '—'}</p>
        </div>
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Ajustes sin resolver</p>
          <p className="font-serif-title text-3xl text-ink-900 mt-1 tabular-nums">{resumen.ajustesPendientes}</p>
          {resumen.ajustesPorAtender > 0 && (
            <p className="text-xs text-brand-700">{resumen.ajustesPorAtender} sin versión del autor</p>
          )}
        </div>
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Versión definitiva</p>
          {definitiva ? (
            <>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                <Lock className="w-4 h-4" aria-hidden="true" />
                Versión {resumen.versionDefinitiva}
              </p>
              <p className="text-xs text-ink-300 mt-1">{formatearFecha(resumen.fechaDefinitiva)}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-600">Sin aprobar</p>
          )}
        </div>
      </div>

      {esAutor && (
        <div className="flex gap-2 p-3 rounded-[12px] bg-surface-muted border border-border text-sm text-ink-900" role="status">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" aria-hidden="true" />
          <p>{mensajeParaAutor(resumen)}</p>
        </div>
      )}

      {aviso && (
        <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-center gap-2" role="status">
          <CheckCheck className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
          {aviso}
        </p>
      )}

      {error && (
        <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-2" role="alert">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {error.titulo}
          </p>
          <p>{error.mensaje}</p>
          {error.pendientes.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {error.pendientes.map((p) => (
                <li key={p.id}>
                  {p.descripcion}{' '}
                  <span className="text-xs">
                    ({p.versionAtencionNumero != null ? `atendido en la versión ${p.versionAtencionNumero}, por revisar` : 'sin versión del autor'})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Lista de observaciones */}
      <section aria-labelledby={`observaciones-${propuestaId}`} className="space-y-3">
        <h3 id={`observaciones-${propuestaId}`} className="text-sm font-bold text-ink-900">
          Observaciones y ajustes
        </h3>
        {observaciones.length === 0 ? (
          <p className="text-sm text-ink-600 p-4 rounded-[12px] border border-dashed border-field-border text-center">
            Todavía no hay observaciones registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {observaciones.map((o) => {
              const info = infoEstadoObservacion(o.estado);
              const resolucion = puedeResolver(o, resumen);
              return (
                <li key={o.id} className="p-3.5 rounded-[12px] border border-border bg-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${info.clases}`}>
                      {info.etiqueta}
                    </span>
                    {o.requiereAjuste && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-600">Ajuste requerido</span>
                    )}
                  </div>
                  <p className="text-sm text-ink-900 mt-2 whitespace-pre-line">{o.descripcion}</p>
                  <p className="text-xs text-ink-600 mt-2">
                    Sobre la versión {o.numeroVersion}
                    {o.registradaPor ? ` · ${o.registradaPor}${o.registradaPorEvaluador ? ' (evaluador)' : ''}` : ''}
                    {o.fecha ? ` · ${formatearFecha(o.fecha)}` : ''}
                  </p>
                  {o.versionAtencionNumero != null && (
                    <p className="text-xs text-ink-900 mt-0.5">Atendida en la versión {o.versionAtencionNumero}</p>
                  )}
                  {o.resuelto && (
                    <p className="text-xs text-ink-600 mt-0.5">
                      Resuelta{o.resueltaPor ? ` por ${o.resueltaPor}` : ''}
                      {o.fechaResolucion ? ` · ${formatearFecha(o.fechaResolucion)}` : ''}
                    </p>
                  )}
                  {!esAutor && !o.resuelto && !definitiva && (
                    <div className="flex items-center justify-end gap-2 mt-2">
                      {!resolucion.permitido && <span className="text-[11px] text-ink-600">{resolucion.motivo}</span>}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => resolver(o)}
                        loading={resolviendoId === o.id}
                        disabled={!resolucion.permitido || (resolviendoId != null && resolviendoId !== o.id)}
                        title={resolucion.motivo || 'Dar por resuelta'}
                        className="h-8 px-3 text-xs"
                      >
                        <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        {o.requiereAjuste ? 'Dar por resuelto' : 'Cerrar comentario'}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Criterio 1: formulario */}
      {!esAutor && registro.permitido && (
        <section aria-labelledby={`registrar-observaciones-${propuestaId}`} className="space-y-3 p-4 rounded-[12px] border border-border bg-surface-muted">
          <h3 id={`registrar-observaciones-${propuestaId}`} className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
            <MessageSquareText className="w-4 h-4 text-brand-600" aria-hidden="true" />
            Registrar observaciones sobre la versión {resumen.versionActual}
          </h3>
          <p className="text-xs text-ink-600">
            Marca «Requiere ajuste» cuando el autor deba cambiar la propuesta: esos ajustes deben resolverse antes de
            aprobar la versión definitiva. Al guardar se notifica a los autores.
          </p>
          {filas.map((fila, i) => (
            <div key={i} className="p-3 rounded-[8px] border border-border bg-white space-y-2">
              <TextArea
                id={`observacion-${propuestaId}-${i}`}
                label={`Observación ${i + 1}`}
                value={fila.descripcion}
                onChange={(e) => cambiarFila(i, { descripcion: e.target.value })}
                placeholder="Describe la observación o el ajuste que debe hacer el autor."
                rows={3}
                maxLength={MAX_DESCRIPCION}
                error={erroresForm.porFila[i]}
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-ink-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fila.requiereAjuste}
                    onChange={(e) => cambiarFila(i, { requiereAjuste: e.target.checked })}
                    className="w-4 h-4 accent-brand-600"
                  />
                  Requiere ajuste
                </label>
                <button
                  type="button"
                  onClick={() => quitarFila(i)}
                  className="inline-flex items-center gap-1 text-xs text-ink-600 hover:text-brand-700 cursor-pointer"
                  aria-label={`Quitar la observación ${i + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Quitar
                </button>
              </div>
            </div>
          ))}
          {erroresForm.general && (
            <p className="text-xs text-brand-700 font-medium" role="alert">
              {erroresForm.general}
            </p>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilas((f) => [...f, filaObservacionVacia()])}
              className="h-9 px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Otra observación
            </Button>
            <Button type="button" variant="primary" onClick={registrar} loading={registrando} className="h-9 px-4 text-xs">
              <MessageSquareText className="w-3.5 h-3.5" aria-hidden="true" />
              Registrar observaciones
            </Button>
          </div>
        </section>
      )}

      {!esAutor && !registro.permitido && !definitiva && (
        <p className="text-xs text-ink-600">No se pueden registrar observaciones: {registro.motivo}</p>
      )}

      {/* Criterios 3 y 4: aprobar la versión definitiva */}
      {esAdmin && !definitiva && (
        <section className="p-4 rounded-[12px] border border-border bg-white space-y-3" aria-label="Versión definitiva">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-900">Aprobar la versión {resumen.versionActual} como definitiva</p>
              <p className="text-xs text-ink-600 mt-0.5">
                {aprobacion.permitido
                  ? 'No quedan ajustes sin resolver. Al aprobarla, se bloquea su edición y queda disponible para la agenda.'
                  : aprobacion.motivo}
              </p>
            </div>
            {!confirmandoAprobacion && (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setError(null);
                  setConfirmandoAprobacion(true);
                }}
                disabled={!aprobacion.permitido}
                title={aprobacion.motivo || 'Aprobar la versión definitiva'}
                className="h-9 px-4 text-xs shrink-0"
              >
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Aprobar versión definitiva
              </Button>
            )}
          </div>
          {confirmandoAprobacion && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[8px] bg-brand-100 border border-brand-600">
              <p className="text-sm text-brand-700">
                La propuesta quedará aprobada en la versión {resumen.versionActual} y el autor ya no podrá modificarla. ¿Continuar?
              </p>
              <div className="flex gap-2 shrink-0">
                <Button type="button" variant="outline" onClick={() => setConfirmandoAprobacion(false)} disabled={aprobando} className="h-9 px-3 text-xs">
                  Cancelar
                </Button>
                <Button type="button" variant="primary" onClick={aprobar} loading={aprobando} className="h-9 px-4 text-xs">
                  Sí, aprobar
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {definitiva && !esAutor && (
        <p className="text-xs text-ink-600 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          Con la versión definitiva aprobada, la propuesta ya no admite observaciones, cambios ni reclasificación.
        </p>
      )}
    </div>
  );
}

ObservacionesPanel.propTypes = {
  propuestaId: PropTypes.number.isRequired,
  modo: PropTypes.oneOf(['admin', 'evaluador', 'autor']).isRequired,
  api: PropTypes.shape({
    listarObservaciones: PropTypes.func.isRequired,
    registrarObservaciones: PropTypes.func,
    resolverObservacion: PropTypes.func,
    aprobarVersionDefinitiva: PropTypes.func,
  }),
  onResumen: PropTypes.func,
  onCambio: PropTypes.func,
};
