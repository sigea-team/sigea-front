import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle2, Pencil, Sparkles } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ClasificacionBadge from './ClasificacionBadge';
import AjusteClasificacionForm from './AjusteClasificacionForm';
import HistorialClasificaciones from './HistorialClasificaciones';
import ObservacionesPanel from '../../observaciones/components/ObservacionesPanel';
import { observacionService } from '../../../api/observacionService';
import { gestionaObservaciones } from '../../observaciones/observacionUtils';
import {
  etiquetaClasificacion,
  formatearFechaHora,
  formatearPuntuacion,
  interpretarErrorClasificacion,
  puedeAjustar,
  puedeClasificar,
  requiereReclasificar,
} from '../clasificacionUtils';

/**
 * @file DetalleClasificacionPanel.jsx
 * @description Clasificación de una propuesta (HU-18): puntuación, clasificación por umbrales y vigente, acción
 * de clasificar (Criterios 1 y 3), ajuste manual con motivo (Criterio 2) e historial de movimientos.
 * HU-19: con la clasificación aplicada como aceptada o aceptada con modificaciones, muestra las observaciones y la
 * aprobación de la versión definitiva; con la versión definitiva aprobada ya no se puede clasificar ni ajustar.
 * El padre debe montarlo con una `key` distinta por propuesta.
 * @module features/clasificacion/components/DetalleClasificacionPanel
 */

/**
 * @param {Object} props
 * @param {Object} props.propuesta - Fila del listado de clasificación.
 * @param {typeof import('../../../api/clasificacionService').clasificacionService} props.api
 * @param {function(string): void} props.onCambio - Se llama con un mensaje tras clasificar o ajustar.
 * @param {typeof observacionService} [props.apiObservaciones] - API de observaciones (HU-19).
 */
export default function DetalleClasificacionPanel({ propuesta, api, onCambio, apiObservaciones = observacionService }) {
  const [historial, setHistorial] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(false);
  const [versionHistorial, setVersionHistorial] = useState(0);
  const [ajustando, setAjustando] = useState(false);
  const [clasificando, setClasificando] = useState(false);
  const [error, setError] = useState(null);
  // HU-19: versión definitiva de la propuesta (llega con las observaciones)
  const [versionDefinitiva, setVersionDefinitiva] = useState(null);

  const propuestaId = propuesta.propuestaId;

  useEffect(() => {
    let activo = true;
    api
      .listarHistorial(propuestaId)
      .then((lista) => {
        if (!activo) return;
        setHistorial(lista);
        setErrorHistorial(false);
      })
      .catch(() => {
        if (activo) setErrorHistorial(true);
      });
    return () => {
      activo = false;
    };
  }, [api, propuestaId, versionHistorial]);

  const recargarHistorial = () => {
    setHistorial(null);
    setErrorHistorial(false);
    setVersionHistorial((v) => v + 1);
  };

  const conObservaciones = gestionaObservaciones(propuesta);
  // HU-19: con la versión definitiva aprobada, la clasificación ya no cambia (el backend lo rechaza).
  const bloqueoDefinitiva =
    conObservaciones && versionDefinitiva != null
      ? { permitido: false, motivo: `Ya tiene versión definitiva aprobada (versión ${versionDefinitiva}); su clasificación no cambia.` }
      : null;
  const clasificable = bloqueoDefinitiva || puedeClasificar(propuesta);
  const ajustable = bloqueoDefinitiva || puedeAjustar(propuesta);

  // Criterios 1 y 3: aplicar la clasificación por umbrales a esta propuesta
  const clasificar = async () => {
    setError(null);
    setClasificando(true);
    try {
      const actualizada = await api.aplicarPropuesta(propuestaId);
      recargarHistorial();
      onCambio(`«${propuesta.titulo}» quedó clasificada como ${etiquetaClasificacion(actualizada?.clasificacion)}.`);
    } catch (err) {
      setError(interpretarErrorClasificacion(err).mensaje);
    } finally {
      setClasificando(false);
    }
  };

  // Criterio 2: ajuste manual con motivo
  const terminarAjuste = (actualizada) => {
    setAjustando(false);
    recargarHistorial();
    onCambio(
      `La clasificación de «${propuesta.titulo}» se ajustó a ${etiquetaClasificacion(actualizada?.clasificacion)}. El motivo quedó en el historial.`
    );
  };

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Puntuación ponderada</p>
          <p className="font-serif-title text-3xl text-ink-900 mt-1 tabular-nums">
            {formatearPuntuacion(propuesta.puntuacionPonderada)}
          </p>
          <p className="text-xs text-ink-300">sobre 10</p>
        </div>
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Según los umbrales</p>
          <div className="mt-2">
            {propuesta.clasificacionPorUmbrales ? (
              <ClasificacionBadge clasificacion={propuesta.clasificacionPorUmbrales} />
            ) : (
              <span className="text-sm text-ink-600">Sin puntuación</span>
            )}
          </div>
        </div>
        <div className="p-4 rounded-[12px] border border-border bg-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Clasificación aplicada</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {propuesta.aplicada ? (
              <ClasificacionBadge clasificacion={propuesta.clasificacion} />
            ) : (
              <span className="text-sm text-ink-600">Todavía no se aplica</span>
            )}
            {propuesta.ajusteManual && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600">
                <Pencil className="w-3 h-3" aria-hidden="true" />
                Ajuste manual
              </span>
            )}
          </div>
          {propuesta.aplicada && propuesta.fechaClasificacion && (
            <p className="text-xs text-ink-300 mt-1.5">{formatearFechaHora(propuesta.fechaClasificacion)}</p>
          )}
        </div>
      </div>

      {/* Criterio 3: evaluación incompleta */}
      {!propuesta.evaluacionCompleta && (
        <div className="flex gap-2 p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700" role="status">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>No se puede clasificar todavía.</strong> {clasificable.motivo} Cuando todos los evaluadores terminen,
            el sistema calcula la puntuación y podrás clasificarla.
          </p>
        </div>
      )}

      {propuesta.evaluacionCompleta && !propuesta.aplicada && (
        <div className="flex gap-2 p-3 rounded-[12px] bg-surface-muted border border-border text-sm text-ink-900" role="status">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            {propuesta.fechaClasificacion
              ? 'La clasificación aplicada ya no coincide con la vigente (cambiaron los umbrales o la puntuación). Vuelve a clasificarla.'
              : `Evaluación completa. Al clasificarla quedará como ${etiquetaClasificacion(
                  propuesta.ajusteManual ? propuesta.clasificacion : propuesta.clasificacionPorUmbrales
                )}.`}
          </p>
        </div>
      )}

      {requiereReclasificar(propuesta) && (
        <div className="flex gap-2 p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700" role="status">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Con los umbrales actuales le corresponde {etiquetaClasificacion(propuesta.clasificacionPorUmbrales)}. Vuelve a
            clasificarla para actualizarla.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-brand-700 bg-brand-100 px-3 py-2 rounded-[8px]" role="alert">
          {error}
        </p>
      )}

      {/* Acciones */}
      {!ajustando && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setAjustando(true);
            }}
            disabled={!ajustable.permitido}
            title={ajustable.motivo || 'Ajustar manualmente con un motivo'}
            className="h-9 px-4 text-xs"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            Ajustar manualmente
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={clasificar}
            loading={clasificando}
            disabled={!clasificable.permitido}
            title={clasificable.motivo || 'Aplicar la clasificación por umbrales'}
            className="h-9 px-4 text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            {requiereReclasificar(propuesta) ? 'Volver a clasificar' : propuesta.aplicada ? 'Clasificación aplicada' : 'Clasificar'}
          </Button>
        </div>
      )}

      {ajustando && (
        <AjusteClasificacionForm
          propuesta={propuesta}
          api={api}
          onAjustada={terminarAjuste}
          onCancelar={() => setAjustando(false)}
        />
      )}

      {/* HU-19: observaciones, ajustes y versión definitiva */}
      {conObservaciones && (
        <section aria-labelledby="observaciones-clasificacion-titulo" className="space-y-3 pt-2 border-t border-border">
          <h3 id="observaciones-clasificacion-titulo" className="text-sm font-bold text-ink-900 pt-3">
            Observaciones y versión definitiva
          </h3>
          <ObservacionesPanel
            propuestaId={propuestaId}
            modo="admin"
            api={apiObservaciones}
            onResumen={(r) => setVersionDefinitiva(r?.versionDefinitiva ?? null)}
            onCambio={onCambio}
          />
        </section>
      )}

      {/* Criterio 2: historial */}
      <section aria-labelledby="historial-clasificacion-titulo" className="space-y-3">
        <h3 id="historial-clasificacion-titulo" className="text-sm font-bold text-ink-900">
          Historial de clasificación
        </h3>
        <HistorialClasificaciones movimientos={historial} error={errorHistorial} onReintentar={recargarHistorial} />
      </section>
    </div>
  );
}

DetalleClasificacionPanel.propTypes = {
  propuesta: PropTypes.shape({
    propuestaId: PropTypes.number.isRequired,
    titulo: PropTypes.string,
    evaluacionCompleta: PropTypes.bool,
    aplicada: PropTypes.bool,
    ajusteManual: PropTypes.bool,
    clasificacion: PropTypes.string,
    clasificacionPorUmbrales: PropTypes.string,
    puntuacionPonderada: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    fechaClasificacion: PropTypes.string,
  }).isRequired,
  api: PropTypes.object.isRequired,
  onCambio: PropTypes.func.isRequired,
  apiObservaciones: PropTypes.object,
};
