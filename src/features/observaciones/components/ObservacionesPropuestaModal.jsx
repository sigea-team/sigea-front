import PropTypes from 'prop-types';
import { MessageSquareText } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import ObservacionesPanel from './ObservacionesPanel';
import { observacionService } from '../../../api/observacionService';

/**
 * @file ObservacionesPropuestaModal.jsx
 * @description Modal con las observaciones de una propuesta (HU-19). Lo usan el evaluador (registrar y resolver)
 * y el autor (consultar). El administrador las gestiona desde el detalle de clasificación (HU-18).
 * @module features/observaciones/components/ObservacionesPropuestaModal
 */

/**
 * @param {Object} props
 * @param {{ id: number, titulo?: string }} props.propuesta
 * @param {'admin'|'evaluador'|'autor'} props.modo
 * @param {typeof observacionService} [props.api]
 * @param {function(): void} props.onClose
 * @param {function(string): void} [props.onCambio]
 */
export default function ObservacionesPropuestaModal({ propuesta, modo, api = observacionService, onClose, onCambio }) {
  return (
    <ModalShell
      titulo="Observaciones y ajustes"
      subtitulo={propuesta.titulo}
      icono={MessageSquareText}
      onClose={onClose}
      ancho="max-w-3xl"
      tituloId="observaciones-propuesta-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose} className="h-10 px-4 text-sm">
          Cerrar
        </Button>
      }
    >
      <ObservacionesPanel propuestaId={propuesta.id} modo={modo} api={api} onCambio={onCambio} />
    </ModalShell>
  );
}

ObservacionesPropuestaModal.propTypes = {
  propuesta: PropTypes.shape({ id: PropTypes.number.isRequired, titulo: PropTypes.string }).isRequired,
  modo: PropTypes.oneOf(['admin', 'evaluador', 'autor']).isRequired,
  api: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onCambio: PropTypes.func,
};
