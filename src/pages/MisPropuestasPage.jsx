import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePen, FileStack, History, Info, Lock, RotateCw } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import { propuestaService } from '../api/propuestaService';
import HistorialVersionesModal from '../features/propuestas/components/HistorialVersionesModal';
import NuevaVersionModal from '../features/propuestas/components/NuevaVersionModal';
import { ESTADOS_PROPUESTA, formatearFechaHoraCorta } from '../features/asignaciones/asignacionUtils';
import { interpretarErrorPropuesta, puedeModificarPropuesta } from '../features/propuestas/documentoUtils';

/**
 * @file MisPropuestasPage.jsx
 * @description Propuestas del autor (HU-14: RF19, RF20, RF21). Lista las propuestas que el usuario envió o
 * en las que figura como autor, con su versión actual. Desde aquí el autor:
 * - Criterio 3: modifica la propuesta (datos o documentos) y se crea una nueva versión.
 * - Criterio 4: consulta el historial de versiones con fecha y autor del cambio.
 * - Criterio 5: ve si la propuesta está bloqueada por versión definitiva o si tiene autorización para modificarla.
 * Ruta: /mis-propuestas
 * @module pages/MisPropuestasPage
 */

/**
 * @param {Object} props
 * @param {typeof propuestaService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 * @param {Function} [props.onSelectNav]
 */
export default function MisPropuestasPage({ api = propuestaService, usuarioProp, onSelectNav }) {
  const [propuestas, setPropuestas] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  // { tipo: 'historial' | 'modificar', mia }
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let activo = true;
    api
      .listarMisPropuestas()
      .then((lista) => {
        if (!activo) return;
        setPropuestas(lista);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(interpretarErrorPropuesta(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, version]);

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setError(null);
    setPropuestas(null);
    recargar();
  };

  return (
    <MainLayout title="Mis propuestas" activeNav="mis-propuestas" onSelectNav={onSelectNav} usuario={usuarioProp}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
              <FileStack className="w-3.5 h-3.5" aria-hidden="true" />
              SIGEA — Propuestas enviadas
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-1 tracking-tight">Mis propuestas</h2>
            <p className="text-sm text-ink-600 mt-1 max-w-2xl">
              Consulta el historial de versiones de tus propuestas y modifícalas mientras la convocatoria lo permita.
              Cada cambio crea una nueva versión y las anteriores se conservan como evidencia.
            </p>
          </div>
          <Link
            to="/convocatorias"
            className="h-11 px-4 rounded-[8px] border border-field-border text-sm font-medium text-ink-900 hover:bg-surface-muted inline-flex items-center gap-2 transition-colors shrink-0"
          >
            Enviar una propuesta nueva
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={reintentar}
              className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        )}

        {!error && (
          <div className="overflow-hidden rounded-[12px] border border-border bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-xs font-bold text-ink-900 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Propuesta</th>
                  <th scope="col" className="py-3 px-4">Estado</th>
                  <th scope="col" className="py-3 px-4">Versión</th>
                  <th scope="col" className="py-3 px-4 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-ink-900">
                {!propuestas && (
                  <tr>
                    <td colSpan={4} className="py-10 px-4 text-center text-ink-600" role="status">
                      Cargando propuestas...
                    </td>
                  </tr>
                )}

                {propuestas?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 px-4 text-center">
                      <p className="font-semibold text-ink-900">Todavía no has enviado propuestas</p>
                      <p className="text-xs mt-1 text-ink-600">
                        Elige una convocatoria abierta y envía tu propuesta con sus documentos.
                      </p>
                    </td>
                  </tr>
                )}

                {propuestas?.map((mia) => {
                  const p = mia.propuesta;
                  const edicion = puedeModificarPropuesta(mia);
                  return (
                    <tr key={p.id} className="hover:bg-surface-muted transition-colors">
                      <td className="py-3.5 px-4 align-middle max-w-md">
                        <p className="font-semibold leading-snug">{p.titulo}</p>
                        <p className="text-xs text-ink-600 mt-1">{p.convocatoriaTitulo}</p>
                        <p className="text-xs text-ink-300 mt-0.5">Enviada {formatearFechaHoraCorta(p.fechaEnvio)}</p>
                      </td>
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-ink-900 border border-field-border">
                          {ESTADOS_PROPUESTA[p.estado] || p.estado}
                        </span>
                        {mia.tieneVersionDefinitiva && (
                          <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-700">
                            <Lock className="w-3 h-3" aria-hidden="true" />
                            Versión definitiva
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <p>Versión {mia.versionActual || 1}</p>
                        <p className="text-xs text-ink-600">
                          {mia.totalVersiones} {mia.totalVersiones === 1 ? 'versión' : 'versiones'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setModal({ tipo: 'historial', mia })}
                            className="h-9 px-3 text-xs"
                          >
                            <History className="w-3.5 h-3.5" aria-hidden="true" />
                            Versiones
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => setModal({ tipo: 'modificar', mia })}
                            disabled={!edicion.permitido}
                            title={edicion.motivo || 'Crear una nueva versión'}
                            className="h-9 px-3 text-xs"
                          >
                            <FilePen className="w-3.5 h-3.5" aria-hidden="true" />
                            Modificar
                          </Button>
                        </div>
                        {!edicion.permitido && (
                          <p className="text-[11px] text-ink-600 text-right mt-1 max-w-xs ml-auto">{edicion.motivo}</p>
                        )}
                        {edicion.usaAutorizacion && (
                          <p className="text-[11px] text-ink-600 text-right mt-1">Modificación autorizada por el administrador.</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.tipo === 'historial' && (
        <HistorialVersionesModal
          key={`historial-${modal.mia.propuesta.id}`}
          propuesta={modal.mia.propuesta}
          api={api}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.tipo === 'modificar' && (
        <NuevaVersionModal
          key={`modificar-${modal.mia.propuesta.id}`}
          mia={modal.mia}
          api={api}
          onClose={() => setModal(null)}
          onCreada={recargar}
        />
      )}
    </MainLayout>
  );
}
