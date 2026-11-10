import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import { AlertTriangle, ArrowLeft, Award, CheckCheck, CheckCircle2, Pencil, TrendingUp } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import ClasificacionBadge from './ClasificacionBadge';
import DetalleClasificacionPanel from './DetalleClasificacionPanel';
import UmbralesClasificacionForm from './UmbralesClasificacionForm';
import {
  agruparPropuestas,
  contarPorClasificar,
  formatearPuntuacion,
  GRUPOS,
  interpretarErrorClasificacion,
  motivoIncompleta,
  plural,
  requiereReclasificar,
  resumenAplicacion,
} from '../clasificacionUtils';

/**
 * @file ClasificacionPropuestasModal.jsx
 * @description Clasificación de las propuestas evaluadas de una convocatoria (HU-18: RF27).
 * - Criterio 1: muestra y permite definir los umbrales; «Clasificar todas» asigna a cada propuesta evaluada su
 *   clasificación (Aceptada, Aceptada con modificaciones o Rechazada).
 * - Criterio 2: desde el detalle de cada propuesta se ajusta la clasificación con un motivo, que queda en el
 *   historial.
 * - Criterio 3: las propuestas sin evaluación completa no se pueden clasificar; se listan aparte con el motivo.
 * El padre debe montarlo con una `key` distinta por convocatoria.
 * @module features/clasificacion/components/ClasificacionPropuestasModal
 */

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  cancelButtonColor: '#5b5f66',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
    cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {{ id: number, titulo: string, eventoNombre?: string }} props.convocatoria
 * @param {typeof import('../../../api/clasificacionService').clasificacionService} props.api
 * @param {function(): void} props.onClose
 * @param {Object} [props.apiObservaciones] - API de observaciones y versión definitiva (HU-19); Storybook la simula.
 */
export default function ClasificacionPropuestasModal({ isOpen, convocatoria, api, onClose, apiObservaciones }) {
  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [editandoUmbrales, setEditandoUmbrales] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [aplicando, setAplicando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'exito'|'error', texto, omitidas? }

  const convocatoriaId = convocatoria?.id;

  useEffect(() => {
    if (!isOpen || !convocatoriaId) return undefined;
    let activo = true;
    api
      .listarPorConvocatoria(convocatoriaId)
      .then((respuesta) => {
        if (!activo) return;
        setDatos(respuesta);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(interpretarErrorClasificacion(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, convocatoriaId, api, version]);

  const propuestas = useMemo(() => datos?.propuestas || [], [datos]);
  const grupos = useMemo(() => agruparPropuestas(propuestas), [propuestas]);
  const porClasificar = useMemo(() => contarPorClasificar(propuestas), [propuestas]);

  if (!isOpen || !convocatoria) return null;

  const recargar = () => setVersion((v) => v + 1);
  const seleccionada = propuestas.find((p) => p.propuestaId === seleccionadaId) || null;
  const gruposVisibles = filtro === 'todas' ? grupos : grupos.filter((g) => g.id === filtro);
  const umbrales = datos ? { umbralAceptacion: datos.umbralAceptacion, umbralAjustes: datos.umbralAjustes } : null;

  // Criterio 1: umbrales guardados
  const terminarUmbrales = (respuesta) => {
    setEditandoUmbrales(false);
    const porReaplicar = Number(respuesta?.propuestasPorReaplicar) || 0;
    setAviso({
      tipo: 'exito',
      texto:
        porReaplicar > 0
          ? `Umbrales guardados. ${plural(porReaplicar, 'propuesta ya clasificada cambiaría', 'propuestas ya clasificadas cambiarían')} con los nuevos umbrales: usa «Clasificar todas» para actualizarlas.`
          : 'Umbrales guardados. Se usarán en las próximas clasificaciones.',
    });
    recargar();
  };

  // Criterios 1 y 3: clasificar todas las propuestas evaluadas
  const clasificarTodas = async () => {
    const incompletas = datos?.totales?.evaluacion_incompleta || 0;
    const { isConfirmed } = await Swal.fire({
      ...ESTILO_SWAL,
      icon: 'question',
      title: '¿Clasificar las propuestas evaluadas?',
      text: `Se aplicará la clasificación por umbrales a ${plural(porClasificar, 'propuesta')}.${
        incompletas > 0
          ? ` ${plural(incompletas, 'propuesta')} sin evaluación completa no se ${incompletas === 1 ? 'clasificará' : 'clasificarán'}.`
          : ''
      } Los ajustes manuales se respetan.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, clasificar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!isConfirmed) return;

    setAviso(null);
    setAplicando(true);
    try {
      const resultado = await api.aplicarConvocatoria(convocatoriaId);
      setAviso({ tipo: 'exito', texto: resumenAplicacion(resultado), omitidas: resultado?.omitidas || [] });
      recargar();
    } catch (err) {
      setAviso({ tipo: 'error', texto: interpretarErrorClasificacion(err).mensaje });
    } finally {
      setAplicando(false);
    }
  };

  const terminarCambioDetalle = (mensaje) => {
    setAviso({ tipo: 'exito', texto: mensaje });
    recargar();
  };

  return (
    <ModalShell
      titulo={seleccionada ? 'Clasificación de la propuesta' : 'Clasificación de propuestas'}
      subtitulo={
        seleccionada
          ? seleccionada.titulo
          : `${convocatoria.titulo}${convocatoria.eventoNombre ? ` · ${convocatoria.eventoNombre}` : ''}`
      }
      icono={Award}
      onClose={onClose}
      ancho="max-w-5xl"
      tituloId="clasificacion-propuestas-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {aviso && (
        <div
          className={`mb-4 p-3 rounded-[12px] border text-sm ${
            aviso.tipo === 'error'
              ? 'bg-brand-100 border-brand-600 text-brand-700'
              : 'bg-surface-muted border border-border text-ink-900'
          }`}
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
        >
          <p>{aviso.texto}</p>
          {aviso.omitidas?.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-brand-700" aria-label="Propuestas no clasificadas">
              {aviso.omitidas.map((o) => (
                <li key={o.propuestaId}>
                  <strong>{o.titulo}:</strong> {o.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {seleccionada ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setSeleccionadaId(null);
              setAviso(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver a las propuestas
          </button>
          <DetalleClasificacionPanel
            key={`detalle-${seleccionada.propuestaId}`}
            propuesta={seleccionada}
            api={api}
            onCambio={terminarCambioDetalle}
            apiObservaciones={apiObservaciones}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {errorCarga && (
            <div className="py-10 text-center" role="alert">
              <p className="font-semibold text-ink-900">No se pudo cargar la clasificación</p>
              <p className="text-xs text-ink-600 mt-1">{errorCarga}</p>
              <button
                type="button"
                onClick={recargar}
                className="text-xs mt-2 text-brand-600 font-semibold underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {!errorCarga && !datos && (
            <p className="py-10 text-center text-sm text-ink-600" role="status">
              Cargando clasificación...
            </p>
          )}

          {!errorCarga && datos && (
            <>
              {/* Criterio 1: umbrales de la convocatoria */}
              <section
                aria-labelledby="umbrales-titulo"
                className="p-4 rounded-[12px] border border-border bg-surface-muted space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 id="umbrales-titulo" className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-brand-600" aria-hidden="true" />
                      Umbrales de clasificación
                    </h3>
                    {!editandoUmbrales && (
                      <p className="text-xs text-ink-600 mt-1">
                        Aceptada desde <strong className="text-ink-900">{formatearPuntuacion(umbrales.umbralAceptacion)}</strong>{' '}
                        · Aceptada con modificaciones desde{' '}
                        <strong className="text-ink-900">{formatearPuntuacion(umbrales.umbralAjustes)}</strong> · Rechazada
                        por debajo (puntuación de 0 a 10)
                      </p>
                    )}
                  </div>
                  {!editandoUmbrales && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAviso(null);
                        setEditandoUmbrales(true);
                      }}
                      className="h-9 px-4 text-xs shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      Editar umbrales
                    </Button>
                  )}
                </div>
                {editandoUmbrales && (
                  <UmbralesClasificacionForm
                    key={`umbrales-${umbrales.umbralAceptacion}-${umbrales.umbralAjustes}`}
                    convocatoriaId={convocatoriaId}
                    umbrales={umbrales}
                    api={api}
                    onGuardado={terminarUmbrales}
                    onCancelar={() => setEditandoUmbrales(false)}
                  />
                )}
              </section>

              {/* Resumen por grupo (también filtra) y acción masiva */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por resultado">
                  <BotonFiltro activo={filtro === 'todas'} onClick={() => setFiltro('todas')}>
                    Todas ({propuestas.length})
                  </BotonFiltro>
                  {GRUPOS.map((g) => (
                    <BotonFiltro key={g.id} activo={filtro === g.id} onClick={() => setFiltro(g.id)}>
                      {g.titulo} ({datos.totales?.[g.id] ?? 0})
                    </BotonFiltro>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={clasificarTodas}
                  loading={aplicando}
                  disabled={porClasificar === 0}
                  title={porClasificar === 0 ? 'No hay propuestas evaluadas pendientes de clasificar.' : undefined}
                  className="h-10 px-4 text-sm shrink-0"
                >
                  <CheckCheck className="w-4 h-4" aria-hidden="true" />
                  Clasificar todas{porClasificar > 0 ? ` (${porClasificar})` : ''}
                </Button>
              </div>

              {propuestas.length === 0 && (
                <div className="py-10 text-center">
                  <p className="font-semibold text-ink-900">La convocatoria todavía no tiene propuestas</p>
                  <p className="text-xs mt-1 text-ink-600">Aquí aparecerán cuando se envíen y se evalúen.</p>
                </div>
              )}

              {propuestas.length > 0 && gruposVisibles.length === 0 && (
                <p className="py-8 text-center text-sm text-ink-600">No hay propuestas en este grupo.</p>
              )}

              {/* Listado agrupado por resultado */}
              {gruposVisibles.map((grupo) => (
                <section key={grupo.id} aria-labelledby={`grupo-${grupo.id}`} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <h3 id={`grupo-${grupo.id}`} className="text-sm font-bold text-ink-900">
                      {grupo.titulo}
                    </h3>
                    <span className="text-xs text-ink-600">{plural(grupo.propuestas.length, 'propuesta')}</span>
                  </div>
                  {grupo.descripcion && <p className="text-xs text-ink-600">{grupo.descripcion}</p>}
                  <div className="overflow-hidden rounded-[12px] border border-border bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-muted border-b border-border text-xs font-bold text-ink-900 uppercase tracking-wider">
                          <th scope="col" className="py-2.5 px-4">Propuesta</th>
                          <th scope="col" className="py-2.5 px-4 text-right">Puntuación</th>
                          <th scope="col" className="py-2.5 px-4">Clasificación</th>
                          <th scope="col" className="py-2.5 px-4 text-right">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm text-ink-900">
                        {grupo.propuestas.map((p) => (
                          <FilaPropuesta
                            key={p.propuestaId}
                            propuesta={p}
                            onVer={() => {
                              setAviso(null);
                              setSeleccionadaId(p.propuestaId);
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      )}
    </ModalShell>
  );
}

/** Botón de filtro por grupo. */
function BotonFiltro({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
        activo
          ? 'bg-brand-600 border-brand-600 text-white'
          : 'bg-white border-field-border text-ink-900 hover:bg-surface-muted'
      }`}
    >
      {children}
    </button>
  );
}

BotonFiltro.propTypes = {
  activo: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

/** Fila del listado agrupado. */
function FilaPropuesta({ propuesta: p, onVer }) {
  const reclasificar = requiereReclasificar(p);
  return (
    <tr className="hover:bg-surface-muted transition-colors">
      <td className="py-3 px-4 align-middle max-w-md">
        <p className="font-semibold leading-snug">{p.titulo}</p>
        {!p.evaluacionCompleta && <p className="text-xs text-ink-600 mt-1">{motivoIncompleta(p)}</p>}
        {reclasificar && (
          <p className="inline-flex items-center gap-1 text-xs text-brand-700 mt-1">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            Con los umbrales actuales cambiaría a otra clasificación
          </p>
        )}
      </td>
      <td className="py-3 px-4 align-middle text-right tabular-nums whitespace-nowrap">
        {formatearPuntuacion(p.puntuacionPonderada)}
      </td>
      <td className="py-3 px-4 align-middle">
        <div className="flex flex-wrap items-center gap-1.5">
          {p.aplicada ? (
            <ClasificacionBadge clasificacion={p.clasificacion} />
          ) : p.evaluacionCompleta ? (
            <span className="text-xs text-ink-600">
              Le corresponde: <ClasificacionBadge clasificacion={p.ajusteManual ? p.clasificacion : p.clasificacionPorUmbrales} />
            </span>
          ) : (
            <span className="text-xs text-ink-300">—</span>
          )}
          {p.ajusteManual && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600" title="Ajustada manualmente con un motivo">
              <Pencil className="w-3 h-3" aria-hidden="true" />
              Manual
            </span>
          )}
          {p.aplicada && !reclasificar && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" aria-label="Aplicada" />}
        </div>
      </td>
      <td className="py-3 px-4 align-middle text-right">
        <Button type="button" variant="outline" onClick={onVer} className="h-9 px-3 text-xs">
          {p.evaluacionCompleta ? 'Clasificar o ajustar' : 'Ver detalle'}
        </Button>
      </td>
    </tr>
  );
}

FilaPropuesta.propTypes = {
  propuesta: PropTypes.object.isRequired,
  onVer: PropTypes.func.isRequired,
};

ClasificacionPropuestasModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  apiObservaciones: PropTypes.object,
  convocatoria: PropTypes.shape({
    id: PropTypes.number.isRequired,
    titulo: PropTypes.string,
    eventoNombre: PropTypes.string,
  }),
  api: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
