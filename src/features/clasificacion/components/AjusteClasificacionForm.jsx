import { useState } from 'react';
import PropTypes from 'prop-types';
import { Pencil } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import TextArea from '../../eventos/components/TextArea';
import {
  etiquetaClasificacion,
  interpretarErrorClasificacion,
  MOTIVO_MAXIMO,
  opcionesAjuste,
  validarMotivo,
} from '../clasificacionUtils';

/**
 * @file AjusteClasificacionForm.jsx
 * @description Ajuste manual de la clasificación de una propuesta (HU-18, Criterio 2). El motivo es obligatorio y
 * queda en el historial. No ofrece la clasificación que ya está aplicada.
 * @module features/clasificacion/components/AjusteClasificacionForm
 */

/**
 * @param {Object} props
 * @param {Object} props.propuesta - Fila del listado de clasificación.
 * @param {{ ajustarClasificacion: Function }} props.api
 * @param {function(Object): void} props.onAjustada - Recibe la situación actualizada de la propuesta.
 * @param {function(): void} props.onCancelar
 */
export default function AjusteClasificacionForm({ propuesta, api, onAjustada, onCancelar }) {
  const opciones = opcionesAjuste(propuesta);
  const [clasificacion, setClasificacion] = useState(opciones[0]?.value || '');
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (evento) => {
    evento.preventDefault();
    const error = validarMotivo(motivo);
    if (error) {
      setErrorMotivo(error);
      return;
    }
    setGuardando(true);
    try {
      const actualizada = await api.ajustarClasificacion(propuesta.propuestaId, { clasificacion, motivo });
      onAjustada(actualizada);
    } catch (err) {
      const { mensaje, campos } = interpretarErrorClasificacion(err);
      if (campos.motivo) setErrorMotivo(campos.motivo);
      setErrorGeneral(mensaje);
      setGuardando(false);
    }
  };

  return (
    <form
      onSubmit={guardar}
      noValidate
      className="space-y-4 p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8]/60"
      aria-labelledby="ajuste-titulo"
    >
      <div>
        <p id="ajuste-titulo" className="text-sm font-bold text-[#1f2023]">
          Ajustar clasificación manualmente
        </p>
        <p className="text-xs text-[#5b5f66] mt-0.5">
          {propuesta.aplicada
            ? `Clasificación actual: ${etiquetaClasificacion(propuesta.clasificacion)}.`
            : `Según los umbrales le corresponde: ${etiquetaClasificacion(propuesta.clasificacionPorUmbrales)}.`}{' '}
          El ajuste se mantiene aunque se vuelva a aplicar la clasificación por umbrales.
        </p>
      </div>

      <Select
        id="ajuste-clasificacion"
        label="Nueva clasificación"
        value={clasificacion}
        onChange={(e) => {
          setClasificacion(e.target.value);
          setErrorGeneral(null);
        }}
        options={opciones}
      />

      <TextArea
        id="ajuste-motivo"
        label="Motivo del ajuste *"
        value={motivo}
        onChange={(e) => {
          setMotivo(e.target.value);
          setErrorMotivo(null);
          setErrorGeneral(null);
        }}
        placeholder="Ej.: el comité acordó solicitar ajustes de metodología antes de aceptarla."
        rows={3}
        maxLength={MOTIVO_MAXIMO}
        error={errorMotivo}
        helperText="Obligatorio, mínimo 10 caracteres. Queda registrado en el historial."
      />

      {errorGeneral && !errorMotivo && (
        <p className="text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando} className="h-9 px-4 text-xs">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={guardando} className="h-9 px-4 text-xs">
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          Guardar ajuste
        </Button>
      </div>
    </form>
  );
}

AjusteClasificacionForm.propTypes = {
  propuesta: PropTypes.shape({
    propuestaId: PropTypes.number.isRequired,
    clasificacion: PropTypes.string,
    clasificacionPorUmbrales: PropTypes.string,
    aplicada: PropTypes.bool,
  }).isRequired,
  api: PropTypes.shape({ ajustarClasificacion: PropTypes.func.isRequired }).isRequired,
  onAjustada: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};
