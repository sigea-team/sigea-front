import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import AsignarEvaluadoresPanel from './AsignarEvaluadoresPanel';
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
 * El padre debe montarlo con una `key` distinta por convocatoria.
 * @module features/asignaciones/components/PropuestasEvaluadoresModal
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {{ id: number, titulo: string, eventoNombre?: string }} props.convocatoria
 * @param {typeof import('../../../api/asignacionService').asignacionService} props.api
 * @param {function(): void} props.onClose
 */
export default function PropuestasEvaluadoresModal({ isOpen, convocatoria, api, onClose }) {
  const [propuestas, setPropuestas] = useState(null);
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
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#a6192e] hover:text-[#7a0c1e] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver a las propuestas
          </button>
          {seleccionada.autores?.length > 0 && (
            <p className="text-xs text-[#5b5f66]">Autores: {seleccionada.autores.join(', ')}</p>
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
          <p className="text-sm text-[#5b5f66]">
            Asigna cada propuesta a uno o más evaluadores del comité. Cada evaluador recibe una notificación y la
            propuesta aparece en su bandeja de evaluaciones.
          </p>

          <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Propuesta</th>
                  <th scope="col" className="py-3 px-4">Estado</th>
                  <th scope="col" className="py-3 px-4">Evaluadores</th>
                  <th scope="col" className="py-3 px-4 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
                {errorCarga && (
                  <tr>
                    <td colSpan={4} className="py-10 px-4 text-center">
                      <p className="font-semibold text-[#1f2023]">No se pudieron cargar las propuestas</p>
                      <button
                        type="button"
                        onClick={recargar}
                        className="text-xs mt-1 text-[#a6192e] font-semibold underline cursor-pointer"
                      >
                        Reintentar
                      </button>
                    </td>
                  </tr>
                )}

                {!errorCarga && !propuestas && (
                  <tr>
                    <td colSpan={4} className="py-10 px-4 text-center text-[#5b5f66]" role="status">
                      Cargando propuestas...
                    </td>
                  </tr>
                )}

                {!errorCarga && propuestas?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 px-4 text-center">
                      <p className="font-semibold text-[#1f2023]">La convocatoria todavía no tiene propuestas</p>
                      <p className="text-xs mt-1 text-[#5b5f66]">Aquí aparecerán cuando los autores las envíen.</p>
                    </td>
                  </tr>
                )}

                {!errorCarga &&
                  propuestas?.map((p) => {
                    const asignable = puedeAsignarPropuesta(p).permitido;
                    return (
                      <tr key={p.propuestaId} className="hover:bg-[#f7f7f8]/50 transition-colors">
                        <td className="py-3.5 px-4 align-middle max-w-sm">
                          <p className="font-semibold leading-snug">{p.titulo}</p>
                          <p className="text-xs text-[#5b5f66] mt-1">
                            {p.autores?.length > 0 ? p.autores.join(', ') : 'Sin autores registrados'}
                          </p>
                          <p className="text-xs text-[#9ca0a6] mt-0.5">Enviada {formatearFechaHoraCorta(p.fechaEnvio)}</p>
                        </td>
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f7f7f8] text-[#1f2023] border border-[#d8dadf]">
                            {ESTADOS_PROPUESTA[p.estado] || p.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <p className={`text-sm ${p.asignacionesTotales > 0 ? 'text-[#1f2023]' : 'text-[#a6192e] font-semibold'}`}>
                            {textoResumenAsignaciones(p)}
                          </p>
                          {p.evaluadores?.length > 0 && (
                            <p className="text-xs text-[#5b5f66] mt-0.5">{p.evaluadores.join(', ')}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-middle text-right">
                          <Button
                            type="button"
                            variant={asignable ? 'primary' : 'outline'}
                            onClick={() => setSeleccionadaId(p.propuestaId)}
                            className="h-9 px-4 text-xs"
                          >
                            {asignable ? 'Asignar' : 'Ver detalle'}
                          </Button>
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
};
