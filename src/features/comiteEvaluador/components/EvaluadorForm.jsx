import { useState } from 'react';
import PropTypes from 'prop-types';
import { UserPlus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import {
  FORM_EVALUADOR_VACIO,
  LIMITES_EVALUADOR,
  TIPOS_DOCUMENTO,
  aRequestEvaluador,
  interpretarErrorEvaluador,
  validarEvaluador,
} from '../comiteEvaluadorUtils';

/**
 * @file EvaluadorForm.jsx
 * @description Registro de un miembro del comité evaluador (HU-15: RF23).
 * - Criterio 3: se registra por correo con su área de experticia. Si el correo no pertenece a ninguna
 *   persona registrada, el formulario pide sus datos para crearla.
 * - Criterio 4: un correo ya registrado en el comité se marca en el campo de correo.
 * @module features/comiteEvaluador/components/EvaluadorForm
 */

/**
 * @param {Object} props
 * @param {function(Object): Promise<void>} props.onRegistrar - Recibe el cuerpo de la petición; lanza el error de la API.
 * @param {boolean} [props.disabled=false]
 */
export default function EvaluadorForm({ onRegistrar, disabled = false }) {
  const [form, setForm] = useState(FORM_EVALUADOR_VACIO);
  const [personaNueva, setPersonaNueva] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: null }));
    if (errorGeneral) setErrorGeneral(null);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const validacion = validarEvaluador(form, personaNueva);
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      return;
    }
    setGuardando(true);
    try {
      await onRegistrar(aRequestEvaluador(form, personaNueva));
      setForm(FORM_EVALUADOR_VACIO);
      setPersonaNueva(false);
      setErrores({});
    } catch (err) {
      const { mensaje, campos, requiereDatosPersona } = interpretarErrorEvaluador(err);
      if (requiereDatosPersona && !personaNueva) {
        // Criterio 3: el correo no está registrado; se muestran los datos de la persona para crearla.
        setPersonaNueva(true);
        setErrores(campos);
        setErrorGeneral('Este correo no pertenece a ninguna persona registrada. Completa sus datos para registrarla como evaluadora.');
      } else {
        setErrores(campos);
        setErrorGeneral(mensaje);
      }
    } finally {
      setGuardando(false);
    }
  };

  const bloqueado = disabled || guardando;

  return (
    <form onSubmit={enviar} noValidate className="p-4 rounded-[12px] border border-border bg-surface-muted">
      <p className="text-sm font-semibold text-ink-900">Registrar evaluador</p>
      <p className="text-xs text-ink-600 mt-0.5">
        Búscalo por su correo. Si tiene cuenta en SIGEA, recibirá el rol de evaluador para poder calificar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-3 mt-4">
        <Input
          id="evaluador-correo"
          label="Correo"
          type="email"
          value={form.correo}
          onChange={cambiar('correo')}
          placeholder="ana.perez@ufps.edu.co"
          error={errores.correo}
          maxLength={LIMITES_EVALUADOR.correo}
          disabled={bloqueado}
          required
          autoComplete="off"
        />
        <Input
          id="evaluador-area"
          label="Área de experticia"
          value={form.areaExperticia}
          onChange={cambiar('areaExperticia')}
          placeholder="Ingeniería de software"
          error={errores.areaExperticia}
          maxLength={LIMITES_EVALUADOR.areaExperticia}
          disabled={bloqueado}
          required
        />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink-900 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={personaNueva}
          onChange={(e) => setPersonaNueva(e.target.checked)}
          disabled={bloqueado}
          className="w-4 h-4 accent-brand-600 cursor-pointer"
        />
        La persona aún no está registrada en SIGEA
      </label>

      {personaNueva && (
        <fieldset className="mt-3 grid grid-cols-1 sm:grid-cols-2 items-start gap-3">
          <legend className="sr-only">Datos de la persona nueva</legend>
          <Select
            id="evaluador-tipo-documento"
            label="Tipo de documento"
            value={form.tipoDocumento}
            onChange={cambiar('tipoDocumento')}
            options={TIPOS_DOCUMENTO}
            error={errores.tipoDocumento}
            disabled={bloqueado}
            required
          />
          <Input
            id="evaluador-documento"
            label="Número de documento"
            value={form.numeroDocumento}
            onChange={cambiar('numeroDocumento')}
            placeholder="1090123456"
            error={errores.numeroDocumento}
            maxLength={LIMITES_EVALUADOR.numeroDocumento}
            disabled={bloqueado}
            required
            autoComplete="off"
          />
          <Input
            id="evaluador-nombres"
            label="Nombres"
            value={form.nombres}
            onChange={cambiar('nombres')}
            error={errores.nombres}
            maxLength={LIMITES_EVALUADOR.nombres}
            disabled={bloqueado}
            required
          />
          <Input
            id="evaluador-apellidos"
            label="Apellidos"
            value={form.apellidos}
            onChange={cambiar('apellidos')}
            error={errores.apellidos}
            maxLength={LIMITES_EVALUADOR.apellidos}
            disabled={bloqueado}
            required
          />
          <Input
            id="evaluador-telefono"
            label="Teléfono (opcional)"
            value={form.telefono}
            onChange={cambiar('telefono')}
            error={errores.telefono}
            maxLength={LIMITES_EVALUADOR.telefono}
            disabled={bloqueado}
          />
        </fieldset>
      )}

      {errorGeneral && (
        <p className="mt-3 text-sm text-brand-700 bg-brand-100 px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="submit" variant="primary" loading={guardando} disabled={disabled}>
          <UserPlus className="w-4 h-4" />
          <span>Registrar evaluador</span>
        </Button>
      </div>
    </form>
  );
}

EvaluadorForm.propTypes = {
  onRegistrar: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
