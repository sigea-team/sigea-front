import { useState } from 'react';
import PropTypes from 'prop-types';
import { Save } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import {
  formatearPuntuacion,
  interpretarErrorClasificacion,
  leerNumero,
  validarUmbrales,
} from '../clasificacionUtils';

/**
 * @file UmbralesClasificacionForm.jsx
 * @description Edición de los umbrales de clasificación de una convocatoria (HU-18, Criterio 1). Valida como el
 * backend (0 - 10, máximo 2 decimales y el de modificaciones no mayor que el de aceptación) y muestra cómo
 * quedarían los rangos antes de guardar.
 * El padre debe montarlo con una `key` que cambie con los umbrales guardados.
 * @module features/clasificacion/components/UmbralesClasificacionForm
 */

/**
 * @param {Object} props
 * @param {number} props.convocatoriaId
 * @param {{ umbralAceptacion: number, umbralAjustes: number }} props.umbrales - Umbrales vigentes.
 * @param {{ configurarUmbrales: Function }} props.api
 * @param {function(Object): void} props.onGuardado - Recibe la respuesta del backend.
 * @param {function(): void} props.onCancelar
 */
export default function UmbralesClasificacionForm({ convocatoriaId, umbrales, api, onGuardado, onCancelar }) {
  const [valores, setValores] = useState({
    umbralAceptacion: String(umbrales.umbralAceptacion ?? ''),
    umbralAjustes: String(umbrales.umbralAjustes ?? ''),
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((er) => ({ ...er, [campo]: undefined }));
    setErrorGeneral(null);
  };

  const aceptacion = leerNumero(valores.umbralAceptacion);
  const ajustes = leerNumero(valores.umbralAjustes);
  const vistaPrevia = aceptacion !== null && ajustes !== null && ajustes <= aceptacion;
  const sinCambios =
    aceptacion === leerNumero(umbrales.umbralAceptacion) && ajustes === leerNumero(umbrales.umbralAjustes);

  const guardar = async (evento) => {
    evento.preventDefault();
    const validacion = validarUmbrales(valores);
    if (!validacion.valido) {
      setErrores(validacion.errores);
      return;
    }
    setGuardando(true);
    try {
      const respuesta = await api.configurarUmbrales(convocatoriaId, validacion.umbrales);
      onGuardado(respuesta);
    } catch (err) {
      const { mensaje, campos } = interpretarErrorClasificacion(err);
      setErrores(campos);
      setErrorGeneral(mensaje);
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate className="space-y-4" aria-label="Umbrales de clasificación">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="umbral-aceptacion"
          label="Aceptada desde"
          inputMode="decimal"
          value={valores.umbralAceptacion}
          onChange={cambiar('umbralAceptacion')}
          error={errores.umbralAceptacion}
          helperText={errores.umbralAceptacion ? undefined : 'Puntuación mínima, de 0 a 10.'}
          required
        />
        <Input
          id="umbral-ajustes"
          label="Aceptada con modificaciones desde"
          inputMode="decimal"
          value={valores.umbralAjustes}
          onChange={cambiar('umbralAjustes')}
          error={errores.umbralAjustes}
          helperText={errores.umbralAjustes ? undefined : 'Por debajo de este valor, la propuesta se rechaza.'}
          required
        />
      </div>

      {vistaPrevia && (
        <ul className="text-xs text-ink-600 space-y-0.5" aria-label="Rangos resultantes">
          <li>
            <strong className="text-brand-600">Aceptada:</strong> {formatearPuntuacion(aceptacion)} o más
          </li>
          <li>
            <strong className="text-ink-600">Aceptada con modificaciones:</strong> desde {formatearPuntuacion(ajustes)} hasta
            antes de {formatearPuntuacion(aceptacion)}
          </li>
          <li>
            <strong className="text-brand-700">Rechazada:</strong> menos de {formatearPuntuacion(ajustes)}
          </li>
        </ul>
      )}

      <p className="text-xs text-ink-600">
        Los umbrales solo se pueden cambiar antes de que abra la convocatoria.
      </p>

      {errorGeneral && (
        <p className="text-sm text-brand-700 bg-brand-100 px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando} className="h-9 px-4 text-xs">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={guardando} disabled={sinCambios} className="h-9 px-4 text-xs">
          <Save className="w-3.5 h-3.5" aria-hidden="true" />
          Guardar umbrales
        </Button>
      </div>
    </form>
  );
}

UmbralesClasificacionForm.propTypes = {
  convocatoriaId: PropTypes.number.isRequired,
  umbrales: PropTypes.shape({
    umbralAceptacion: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    umbralAjustes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  api: PropTypes.shape({ configurarUmbrales: PropTypes.func.isRequired }).isRequired,
  onGuardado: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};
