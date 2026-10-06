import PropTypes from 'prop-types';
import { Pencil, Trash2, Send, Lock, Globe } from 'lucide-react';
import Button from '../../../components/ui/Button';
import BotonAccion from '../../../components/ui/BotonAccion';
import EstadoConvocatoriaBadge from './EstadoConvocatoriaBadge';
import {
  esBorradorEditable,
  formatearFechaHora,
  puedeEnviarPropuesta,
} from '../convocatoriaUtils';

/**
 * @file ConvocatoriasTable.jsx
 * @description Tabla para visualizar y gestionar convocatorias académicas.
 * Desacopla la lógica de presentación de la página principal e implementa:
 * - Publicación de convocatorias en borrador para abrirlas a recepción.
 * - Criterio 3: Bloqueo de acciones de edición si no está en borrador.
 * - Criterio 4: Indicación clara y bloqueo de botón de envío cuando la fecha ya se cumplió o está en borrador.
 * @module features/convocatorias/components/ConvocatoriasTable
 */

/**
 * @param {Object} props
 * @param {Array<Object>} props.convocatorias - Lista filtrada de convocatorias.
 * @param {boolean} [props.cargando=false] - Bandera de carga.
 * @param {boolean} [props.hayFiltros=false] - Indica si hay filtros activos en la búsqueda.
 * @param {Function} props.onEditar - Callback para editar una convocatoria.
 * @param {Function} props.onPublicar - Callback para publicar una convocatoria en borrador.
 * @param {Function} props.onEliminar - Callback para eliminar una convocatoria en borrador.
 * @param {Function} props.onIntentarEnviar - Callback para simular envío de propuesta (Criterio 4).
 */
export default function ConvocatoriasTable({
  convocatorias = [],
  cargando = false,
  hayFiltros = false,
  onEditar,
  onPublicar,
  onEliminar,
  onIntentarEnviar,
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-5">Convocatoria / Evento</th>
              <th scope="col" className="py-3.5 px-5">Periodo de recepción</th>
              <th scope="col" className="py-3.5 px-5">Estado</th>
              <th scope="col" className="py-3.5 px-5">Envío de propuesta</th>
              <th scope="col" className="py-3.5 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
            {cargando && convocatorias.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 px-5 text-center text-[#5b5f66]" role="status">
                  Cargando convocatorias...
                </td>
              </tr>
            )}

            {!cargando && convocatorias.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 px-5 text-center">
                  <p className="font-semibold text-base text-[#1f2023]">
                    {hayFiltros
                      ? 'Ninguna convocatoria coincide con los criterios de búsqueda'
                      : 'Todavía no hay convocatorias registradas'}
                  </p>
                  <p className="text-xs mt-1 text-[#5b5f66]">
                    {hayFiltros
                      ? 'Prueba con otros términos o cambia el filtro de estado.'
                      : 'Usa «Crear convocatoria» para configurar la primera.'}
                  </p>
                </td>
              </tr>
            )}

            {convocatorias.map((convocatoria) => {
              const editable = esBorradorEditable(convocatoria);
              const validacionEnvio = puedeEnviarPropuesta(convocatoria);

              return (
                <tr key={convocatoria.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                  {/* Convocatoria y evento */}
                  <td className="py-4 px-5 align-middle max-w-sm">
                    <p className="font-semibold text-[#1f2023] leading-snug">{convocatoria.titulo}</p>
                    <p className="text-xs text-[#a6192e] font-medium mt-1">
                      {convocatoria.eventoNombre}
                    </p>
                    <p className="text-xs text-[#5b5f66] mt-1 line-clamp-2">
                      {convocatoria.descripcion}
                    </p>
                  </td>

                  {/* Periodo de recepción */}
                  <td className="py-4 px-5 align-middle whitespace-nowrap text-xs text-[#1f2023]">
                    <div className="space-y-1">
                      <p>
                        <span className="text-[#5b5f66]">Apertura:</span>{' '}
                        <strong>{formatearFechaHora(convocatoria.fechaApertura)}</strong>
                      </p>
                      <p>
                        <span className="text-[#5b5f66]">Cierre:</span>{' '}
                        <strong>{formatearFechaHora(convocatoria.fechaCierre)}</strong>
                      </p>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-5 align-middle whitespace-nowrap">
                    <EstadoConvocatoriaBadge
                      estado={convocatoria.estado}
                      fechaCierre={convocatoria.fechaCierre}
                    />
                  </td>

                  {/* Simulación de Envío para Autor (Criterio 4) */}
                  <td className="py-4 px-5 align-middle whitespace-nowrap">
                    <Button
                      type="button"
                      variant={validacionEnvio.permitido ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onIntentarEnviar(convocatoria)}
                      disabled={!validacionEnvio.permitido}
                      title={validacionEnvio.motivo || 'Enviar propuesta'}
                      className="text-xs"
                    >
                      {validacionEnvio.permitido ? (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar propuesta</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-[#a6192e]" />
                          <span>Recepción cerrada</span>
                        </>
                      )}
                    </Button>
                  </td>

                  {/* Acciones de administración */}
                  <td className="py-4 px-5 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {/* Publicar convocatoria en borrador */}
                      <BotonAccion
                        icono={Globe}
                        etiqueta="Publicar convocatoria"
                        onClick={() => onPublicar && onPublicar(convocatoria)}
                        disabled={!editable}
                        motivo="Solo se pueden publicar convocatorias en estado borrador."
                      />

                      {/* Criterio 3: Editar en borrador */}
                      <BotonAccion
                        icono={Pencil}
                        etiqueta="Editar convocatoria"
                        onClick={() => onEditar(convocatoria)}
                        disabled={!editable}
                        motivo="Solo se pueden editar convocatorias en estado borrador."
                      />

                      {/* Eliminar borrador */}
                      <BotonAccion
                        icono={Trash2}
                        etiqueta="Eliminar convocatoria"
                        onClick={() => onEliminar(convocatoria)}
                        disabled={!editable}
                        motivo="Solo se pueden eliminar convocatorias en estado borrador."
                        peligro
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

ConvocatoriasTable.propTypes = {
  convocatorias: PropTypes.arrayOf(PropTypes.object),
  cargando: PropTypes.bool,
  hayFiltros: PropTypes.bool,
  onEditar: PropTypes.func.isRequired,
  onPublicar: PropTypes.func,
  onEliminar: PropTypes.func.isRequired,
  onIntentarEnviar: PropTypes.func.isRequired,
};
