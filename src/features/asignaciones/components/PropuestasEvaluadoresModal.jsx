import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, ClipboardList, History } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import AsignarEvaluadoresPanel from './AsignarEvaluadoresPanel';
import HistorialVersionesModal from '../../propuestas/components/HistorialVersionesModal';
import { propuestaService } from '../../../api/propuestaService';
import {
  ESTADOS_PROPUESTA,
  formatearFechaHoraCorta,
  puedeAsignarPropuesta,
  textoResumenAsignaciones,
} from '../asignacionUtils';

/**
 * @file PropuestasEvaluadoresModal.jsx
 * @description Propuestas recibidas en una convocatoria y su asignación a evaluadores (HU-16: RF24).
 * Muestra cuántos evaluadores tiene cada propuesta y abre el panel de asignación de la elegida.
 * HU-14 (Criterios 4 y 5): desde cada fila el administrador consulta el historial de versiones y, si la
 * propuesta está en versión definitiva, puede autorizar su modificación.
 * El padre debe montarlo con una `key` distinta por convocatoria.
 * @module features/asignaciones/components/PropuestasEvaluadoresModal
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {{ id: number, titulo: string, eventoNombre?: string }} props.convocatoria
 * @param {typeof import('../../../api/asignacionService').asignacionService} props.api
 * @param {function(): void} props.onClose
 * @param {Object} [props.apiPropuestas=propuestaService] - API de propuestas para el historial de versiones (HU-14).
 */
export default function PropuestasEvaluadoresModal({
  isOpen,
  convocatoria,
  api,
  onClose,
  apiPropuestas = propuestaService,
}) {
  const [propuestas, setPropuestas] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [version, setVersion] = useState(0);
  const [seleccionadaId, setSeleccionadaId] = useState(null);

  const convocatoriaId = convocatoria?.id;

  useEffect(() => {
    if (!isOpen || !convocatoriaId) return undefined;
    let activo = true;
    api
      .listarPropuestasConvocatoria(convocatoriaId)
      .then((lista) => {
        if (!activo) return;
        setPropuestas(lista);
        setErrorCarga(false);
      })
      .catch(() => {
        if (activo) setErrorCarga(true);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, convocatoriaId, api, version]);

  if (!isOpen || !convocatoria) return null;

  const recargar = () => setVersion((v) => v + 1);
  const seleccionada = propuestas?.find((p) => p.propuestaId === seleccionadaId) || null;

  return (
    <>
      <ModalShell
        titulo={seleccionada ? 'Asignar evaluadores' : 'Propuestas y evaluadores'}
        subtitulo={seleccionada ? seleccionada.titulo : convocatoria.titulo}
        icono={ClipboardList}
        onClose={onClose}
        ancho="max-w-5xl"
        tituloId="propuestas-evaluadores-titulo"
        pie={
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        {seleccionada ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setSeleccionadaId(null)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Volver a las propuestas
            </button>
            {seleccionada.autores?.length > 0 && (
              <p className="text-xs text-ink-600">Autores: {seleccionada.autores.join(', ')}</p>
            )}
            <AsignarEvaluadoresPanel
              key={`panel-${seleccionada.propuestaId}`}
              propuesta={seleccionada}
              api={api}
              onCambio={recargar}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">
              Asigna cada propuesta a uno o más evaluadores del comité. Cada evaluador recibe una notificación y la
              propuesta aparece en su bandeja de evaluaciones.
            </p>

            <div className="overflow-hidden rounded-[12px] border border-border bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-muted border-b border-border text-xs font-bold text-ink-900 uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4">Propuesta</th>
                    <th scope="col" className="py-3 px-4">Estado</th>
                    <th scope="col" className="py-3 px-4">Evaluadores</th>
                    <th scope="col" className="py-3 px-4 text-right">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-ink-900">
                  {errorCarga && (
                    <tr>
                      <td colSpan={4} className="py-10 px-4 text-center">
                        <p className="font-semibold text-ink-900">No se pudieron cargar las propuestas</p>
                        <button
                          type="button"
                          onClick={recargar}
                          className="text-xs mt-1 text-brand-600 font-semibold underline cursor-pointer"
                        >
                          Reintentar
                        </button>
                      </td>
                    </tr>
                  )}

                  {!errorCarga && !propuestas && (
                    <tr>
                      <td colSpan={4} className="py-10 px-4 text-center text-ink-600" role="status">
                        Cargando propuestas...
                      </td>
                    </tr>
                  )}

                  {!errorCarga && propuestas?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 px-4 text-center">
                        <p className="font-semibold text-ink-900">La convocatoria todavía no tiene propuestas</p>
                        <p className="text-xs mt-1 text-ink-600">Aquí aparecerán cuando los autores las envíen.</p>
                      </td>
                    </tr>
                  )}

                  {!errorCarga &&
                    propuestas?.map((p) => {
                      const asignable = puedeAsignarPropuesta(p).permitido;
                      return (
                        <tr key={p.propuestaId} className="hover:bg-surface-muted transition-colors">
                          <td className="py-3.5 px-4 align-middle max-w-sm">
                            <p className="font-semibold leading-snug">{p.titulo}</p>
                            <p className="text-xs text-ink-600 mt-1">
                              {p.autores?.length > 0 ? p.autores.join(', ') : 'Sin autores registrados'}
                            </p>
                            <p className="text-xs text-ink-300 mt-0.5">Enviada {formatearFechaHoraCorta(p.fechaEnvio)}</p>
                          </td>
                          <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-ink-900 border border-field-border">
                              {ESTADOS_PROPUESTA[p.estado] || p.estado}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-middle">
                            <p className={`text-sm ${p.asignacionesTotales > 0 ? 'text-ink-900' : 'text-brand-600 font-semibold'}`}>
                              {textoResumenAsignaciones(p)}
                            </p>
                            {p.evaluadores?.length > 0 && (
                              <p className="text-xs text-ink-600 mt-0.5">{p.evaluadores.join(', ')}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setHistorial({ id: p.propuestaId, titulo: p.titulo, estado: p.estado })}
                                className="h-9 px-3 text-xs"
                                title="Historial de versiones (HU-14)"
                              >
                                <History className="w-3.5 h-3.5" aria-hidden="true" />
                                Versiones
                              </Button>
                              <Button
                                type="button"
                                variant={asignable ? 'primary' : 'outline'}
                                onClick={() => setSeleccionadaId(p.propuestaId)}
                                className="h-9 px-4 text-xs"
                              >
                                {asignable ? 'Asignar' : 'Ver detalle'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModalShell>

      {/* HU-14: historial de versiones; el administrador puede autorizar la modificación (Criterio 5) */}
      {historial && (
        <HistorialVersionesModal
          key={`historial-${historial.id}`}
          propuesta={historial}
          api={apiPropuestas}
          esAdmin
          onClose={() => setHistorial(null)}
        />
      )}
    </>
  );
}

PropuestasEvaluadoresModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  convocatoria: PropTypes.shape({
    id: PropTypes.number.isRequired,
    titulo: PropTypes.string,
  }),
  api: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  apiPropuestas: PropTypes.object,
};
