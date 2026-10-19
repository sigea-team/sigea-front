import { useState } from 'react';
import PropTypes from 'prop-types';
import { CalendarClock, Calendar, Bell } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { formatearFechaHora, mensajeErrorApi, validarNuevaFechaCierre } from '../convocatoriaUtils';

/**
 * @file FechaCierreModal.jsx
 * @description Modal para modificar la fecha límite de una convocatoria publicada (HU-11, Criterio 2).
 * Valida que la nueva fecha sea futura, distinta de la actual y posterior a la apertura; al confirmar,
 * el backend actualiza la convocatoria y notifica el cambio (campana) a todos los usuarios activos.
 * @module features/convocatorias/components/FechaCierreModal
 */

/** Convierte una fecha ISO del backend al formato del input datetime-local (YYYY-MM-DDTHH:mm). */
const aValorInput = (val) => (typeof val === 'string' && val.length >= 16 ? val.substring(0, 16) : '');

/**
 * @param {Object} props
 * @param {Object} props.convocatoria - Convocatoria publicada a modificar.
 * @param {Function} props.onClose - Cierra el modal sin cambios.
 * @param {function(string): Promise<void>} props.onSubmit - Recibe la nueva fecha (YYYY-MM-DDTHH:mm).
 */
export default function FechaCierreModal({ convocatoria, onClose, onSubmit }) {
  const [fechaCierre, setFechaCierre] = useState(() => aValorInput(convocatoria?.fechaCierre));
  const [error, setError] = useState(null);
  const [errorApi, setErrorApi] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async (e) => {
    e?.preventDefault();
    const errorValidacion = validarNuevaFechaCierre(fechaCierre, convocatoria);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setEnviando(true);
    setErrorApi(null);
    try {
      await onSubmit(fechaCierre);
    } catch (err) {
      setErrorApi(mensajeErrorApi(err, 'No se pudo actualizar la fecha límite.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell
      titulo="Modificar fecha límite"
      subtitulo={convocatoria?.titulo}
      icono={CalendarClock}
      onClose={onClose}
      ancho="max-w-lg"
      tituloId="modal-fecha-cierre-titulo"
      pie={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={guardar} loading={enviando}>
            Guardar y notificar
          </Button>
        </>
      }
    >
      <form onSubmit={guardar} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-[8px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-[#5b5f66]">Apertura</p>
            <p className="font-semibold text-[#1f2023] mt-0.5">{formatearFechaHora(convocatoria?.fechaApertura)}</p>
          </div>
          <div className="p-3 rounded-[8px] bg-[#f7f7f8] border border-[#e5e7ea]">
            <p className="text-[#5b5f66]">Fecha límite actual</p>
            <p className="font-semibold text-[#1f2023] mt-0.5">{formatearFechaHora(convocatoria?.fechaCierre)}</p>
          </div>
        </div>

        <Input
          id="convocatoria-nueva-fecha-cierre"
          type="datetime-local"
          label="Nueva fecha y hora límite"
          required
          value={fechaCierre}
          onChange={(e) => {
            setFechaCierre(e.target.value);
            setError(null);
            setErrorApi(null);
          }}
          error={error}
          rightElement={<Calendar className="w-4 h-4 text-[#5b5f66]" />}
          helperText="Debe ser una fecha futura y posterior a la fecha de apertura."
        />

        {errorApi && (
          <div className="p-3 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-sm" role="alert">
            {errorApi}
          </div>
        )}

        <div className="bg-[#f7f7f8] rounded-[8px] p-3 border border-[#e5e7ea] flex items-start gap-2 text-xs text-[#5b5f66]">
          <Bell className="w-4 h-4 text-[#a6192e] shrink-0 mt-0.5" />
          <p>
            Al guardar, todos los usuarios activos recibirán una <strong>notificación</strong> con la nueva fecha
            límite, indicando que aún pueden enviar sus propuestas.
          </p>
        </div>
      </form>
    </ModalShell>
  );
}

FechaCierreModal.propTypes = {
  convocatoria: PropTypes.shape({
    titulo: PropTypes.string,
    fechaApertura: PropTypes.string,
    fechaCierre: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
