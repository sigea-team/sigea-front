import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  Ban,
  CheckCheck,
  ClipboardList,
  Globe,
  Lock,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import EstadoEncuestaBadge from './EstadoEncuestaBadge';
import EncuestaFormulario from './EncuestaFormulario';
import ResultadosEncuesta from './ResultadosEncuesta';
import { encuestaService } from '../../../api/encuestaService';
import {
  TIPOS_PREGUNTA,
  accionesEncuesta,
  formatearFechaHora,
  formatearPorcentaje,
  interpretarErrorEncuesta,
  plural,
  textoAlcance,
} from '../encuestaUtils';

/**
 * @file EncuestasEventoModal.jsx
 * @description Encuestas de satisfacción de un evento (HU-25: RF46), del lado del organizador. Desde la fila del
 * evento (menú «Más» → «Encuestas de satisfacción»):
 * - Criterio 1: crea la encuesta en borrador, para el evento en general o para una actividad, la edita y la publica;
 *   al publicarla queda habilitada para quienes asistieron y se les avisa en la campana.
 * - Criterio 2: define si las respuestas son anónimas o identificadas.
 * - Criterio 4: consulta los resultados consolidados.
 * También cierra encuestas publicadas y elimina las que no tienen respuestas.
 * @module features/encuestas/components/EncuestasEventoModal
 */

const CONFIRMACIONES = {
  publicar: {
    titulo: 'Publicar la encuesta',
    texto: (e) =>
      `Quedará habilitada para ${e.actividadId ? 'quienes asistieron a la actividad' : 'quienes asistieron al evento'} ` +
      'y se les avisará en la campana. Después ya no podrás modificar sus preguntas.',
    boton: 'Sí, publicar',
  },
  cerrar: {
    titulo: 'Cerrar la encuesta',
    texto: () => 'Ya no recibirá más respuestas. Los resultados se conservan.',
    boton: 'Sí, cerrar',
  },
  eliminar: {
    titulo: 'Eliminar la encuesta',
    texto: () => 'Se eliminará con todas sus preguntas. Esta acción no se puede deshacer.',
    boton: 'Sí, eliminar',
  },
};

/**
 * @param {Object} props
 * @param {{ id: number, nombre: string, estado?: string }} props.evento
 * @param {typeof encuestaService} [props.api]
 * @param {function(): void} props.onClose
 */
export default function EncuestasEventoModal({ evento, api = encuestaService, onClose }) {
  const [encuestas, setEncuestas] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);

  // { tipo: 'lista' } | { tipo: 'formulario', encuesta: Object|null } | { tipo: 'resultados', encuesta: Object }
  const [vista, setVista] = useState({ tipo: 'lista' });
  const [confirmacion, setConfirmacion] = useState(null); // { accion, encuesta }
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    api
      .listarEncuestas(evento.id)
      .then((lista) => {
        if (!activo) return;
        setEncuestas(lista);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(interpretarErrorEncuesta(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, evento.id, version]);

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setErrorCarga(null);
    setEncuestas(null);
    recargar();
  };

  const irALista = (mensaje) => {
    setVista({ tipo: 'lista' });
    setError(null);
    setAviso(mensaje || null);
    if (mensaje) recargar();
  };

  const pedirConfirmacion = (accion, encuesta) => {
    setAviso(null);
    setError(null);
    setConfirmacion({ accion, encuesta });
  };

  const ejecutar = async () => {
    const { accion, encuesta } = confirmacion;
    setProcesando(true);
    setError(null);
    try {
      // El cambio se refleja en la fila apenas responde el backend; la recarga trae los totales actualizados.
      const reemplazar = (actualizada) =>
        setEncuestas((lista) => lista.map((x) => (x.encuestaId === actualizada.encuestaId ? { ...x, ...actualizada } : x)));
      if (accion === 'publicar') {
        reemplazar(await api.publicarEncuesta(evento.id, encuesta.encuestaId));
        setAviso(`La encuesta «${encuesta.titulo}» quedó publicada para quienes asistieron.`);
      } else if (accion === 'cerrar') {
        reemplazar(await api.cerrarEncuesta(evento.id, encuesta.encuestaId));
        setAviso(`La encuesta «${encuesta.titulo}» quedó cerrada.`);
      } else {
        await api.eliminarEncuesta(evento.id, encuesta.encuestaId);
        setEncuestas((lista) => lista.filter((x) => x.encuestaId !== encuesta.encuestaId));
        setAviso(`Se eliminó la encuesta «${encuesta.titulo}».`);
      }
      setConfirmacion(null);
      recargar();
    } catch (err) {
      const info = interpretarErrorEncuesta(err);
      const detalle = Object.values(info.campos || {});
      setError({ ...info, detalle });
      setConfirmacion(null);
      recargar();
    } finally {
      setProcesando(false);
    }
  };

  const titulo =
    vista.tipo === 'formulario'
      ? vista.encuesta
        ? 'Modificar encuesta'
        : 'Nueva encuesta de satisfacción'
      : vista.tipo === 'resultados'
      ? 'Resultados de la encuesta'
      : 'Encuestas de satisfacción';

  let contenido;
  if (vista.tipo === 'formulario') {
    contenido = (
      <EncuestaFormulario
        eventoId={evento.id}
        encuesta={vista.encuesta}
        api={api}
        onGuardada={(_, mensaje) => irALista(mensaje)}
        onCancelar={() => irALista()}
      />
    );
  } else if (vista.tipo === 'resultados') {
    contenido = <ResultadosEncuesta eventoId={evento.id} encuesta={vista.encuesta} api={api} onVolver={() => irALista()} />;
  } else if (errorCarga) {
    contenido = (
      <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm flex items-center justify-between gap-4" role="alert">
        <span>{errorCarga}</span>
        <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer">
          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    );
  } else if (!encuestas) {
    contenido = (
      <p className="text-sm text-ink-600 py-6 text-center" role="status">
        Cargando encuestas...
      </p>
    );
  } else {
    contenido = (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-ink-600 max-w-xl">
            Configura encuestas para el evento en general o para una actividad. Al publicarlas, solo las responden los
            participantes con asistencia registrada.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setAviso(null);
              setError(null);
              setConfirmacion(null);
              setVista({ tipo: 'formulario', encuesta: null });
            }}
            className="h-10 px-4 text-sm shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nueva encuesta
          </Button>
        </div>

        {evento.estado === 'en_configuracion' && (
          <p className="text-xs text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px]">
            El evento está en configuración: puedes preparar encuestas en borrador, pero solo se publican cuando el
            evento esté habilitado.
          </p>
        )}

        {aviso && (
          <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-center gap-2" role="status">
            <CheckCheck className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
            {aviso}
          </p>
        )}

        {error && (
          <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-1" role="alert">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error.titulo}
            </p>
            <p>{error.mensaje}</p>
            {error.detalle.length > 0 && (
              <ul className="list-disc list-inside">
                {error.detalle.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {encuestas.length === 0 ? (
          <p className="text-sm text-ink-600 p-6 rounded-[12px] border border-dashed border-field-border text-center">
            Este evento todavía no tiene encuestas de satisfacción.
          </p>
        ) : (
          <ul className="space-y-3">
            {encuestas.map((e) => {
              const acciones = accionesEncuesta(e, evento);
              const confirmando = confirmacion?.encuesta.encuestaId === e.encuestaId ? confirmacion : null;
              const tipos = [...new Set((e.preguntas || []).map((p) => TIPOS_PREGUNTA[p.tipoRespuesta]?.etiqueta).filter(Boolean))];
              return (
                <li key={e.encuestaId} className="p-4 rounded-[12px] border border-border bg-white space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink-900">{e.titulo}</p>
                        <EstadoEncuestaBadge estado={e.estado} />
                      </div>
                      <p className="text-xs text-ink-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{textoAlcance(e)}</span>
                        <span className="inline-flex items-center gap-1">
                          {e.anonima ? <Lock className="w-3.5 h-3.5" aria-hidden="true" /> : <UserRound className="w-3.5 h-3.5" aria-hidden="true" />}
                          {e.anonima ? 'Anónima' : 'Identificada'}
                        </span>
                        <span>
                          {plural((e.preguntas || []).length, 'pregunta')}
                          {tipos.length > 0 ? ` (${tipos.join(', ').toLowerCase()})` : ''}
                        </span>
                        {e.fechaCierre && (
                          <span>
                            {e.estado === 'cerrada' ? 'Cerrada el' : 'Cierra el'} {formatearFechaHora(e.fechaCierre)}
                          </span>
                        )}
                      </p>
                      {e.estado !== 'borrador' && (
                        <p className="text-xs text-ink-900 mt-1 tabular-nums">
                          <strong>{e.totalRespuestas}</strong> de {e.totalHabilitados} habilitados respondieron
                          {e.totalHabilitados > 0 ? ` (${formatearPorcentaje((e.totalRespuestas * 100) / e.totalHabilitados)})` : ''}
                          {e.estado === 'publicada' && !e.recibeRespuestas ? ' · venció la fecha de cierre' : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">
                      {acciones.resultados.permitido && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setVista({ tipo: 'resultados', encuesta: e })}
                          className="h-9 px-3 text-xs"
                        >
                          <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                          Resultados
                        </Button>
                      )}
                      {acciones.editar.permitido && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setAviso(null);
                            setError(null);
                            setVista({ tipo: 'formulario', encuesta: e });
                          }}
                          className="h-9 px-3 text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          Editar
                        </Button>
                      )}
                      {e.estado === 'borrador' && (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => pedirConfirmacion('publicar', e)}
                          disabled={!acciones.publicar.permitido || procesando}
                          title={acciones.publicar.motivo || 'Publicar la encuesta'}
                          className="h-9 px-3 text-xs"
                        >
                          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                          Publicar
                        </Button>
                      )}
                      {acciones.cerrar.permitido && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => pedirConfirmacion('cerrar', e)}
                          disabled={procesando}
                          className="h-9 px-3 text-xs"
                        >
                          <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                          Cerrar
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => pedirConfirmacion('eliminar', e)}
                        disabled={!acciones.eliminar.permitido || procesando}
                        title={acciones.eliminar.motivo || 'Eliminar la encuesta'}
                        aria-label={`Eliminar la encuesta ${e.titulo}`}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-[8px] border border-field-border text-ink-600 hover:text-brand-700 hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {e.estado === 'borrador' && !acciones.publicar.permitido && (
                    <p className="text-xs text-ink-600">Para publicar: {acciones.publicar.motivo}</p>
                  )}

                  {confirmando && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[8px] bg-brand-100 border border-brand-600">
                      <div className="text-sm text-brand-700">
                        <p className="font-semibold">{CONFIRMACIONES[confirmando.accion].titulo}</p>
                        <p>{CONFIRMACIONES[confirmando.accion].texto(e)} ¿Continuar?</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button type="button" variant="outline" onClick={() => setConfirmacion(null)} disabled={procesando} className="h-9 px-3 text-xs">
                          Cancelar
                        </Button>
                        <Button type="button" variant="primary" onClick={ejecutar} loading={procesando} className="h-9 px-4 text-xs">
                          {CONFIRMACIONES[confirmando.accion].boton}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <ModalShell
      titulo={titulo}
      subtitulo={evento.nombre}
      icono={ClipboardList}
      onClose={onClose}
      ancho="max-w-4xl"
      tituloId="encuestas-evento-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4 text-sm">
          Cerrar
        </Button>
      }
    >
      {contenido}
    </ModalShell>
  );
}

EncuestasEventoModal.propTypes = {
  evento: PropTypes.shape({ id: PropTypes.number.isRequired, nombre: PropTypes.string, estado: PropTypes.string }).isRequired,
  api: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
