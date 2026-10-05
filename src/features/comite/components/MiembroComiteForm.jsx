import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { LIMITES_COMITE, interpretarErrorMiembro, validarMiembro } from '../comiteUtils';

/**
 * @file MiembroComiteForm.jsx
 * @description Formulario para agregar un responsable o miembro al comité organizador
 * (HU-06, Criterio 1). La persona se busca por número de documento; si ya es miembro vigente,
 * el error del backend (Criterio 2) se muestra junto al campo del documento.
 * @module features/comite/components/MiembroComiteForm
 */

const FORM_VACIO = { numeroDocumento: '', rolComite: '' };

/**
 * @param {Object} props
 * @param {function({numeroDocumento: string, rolComite: string}): Promise<Object>} props.onAgregar
 *   Envía el miembro al backend. Si falla, el formulario muestra el error.
 * @param {boolean} [props.disabled=false]
 */
export default function MiembroComiteForm({ onAgregar, disabled = false }) {
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: null }));
    if (errorGeneral) setErrorGeneral(null);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const validacion = validarMiembro(form);
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      return;
    }
    setGuardando(true);
    try {
      await onAgregar({ numeroDocumento: form.numeroDocumento.trim(), rolComite: form.rolComite.trim() });
      setForm(FORM_VACIO);
      setErrores({});
    } catch (err) {
      const { campos, mensaje } = interpretarErrorMiembro(err);
      setErrores(campos);
      setErrorGeneral(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8]">
      <p className="text-sm font-semibold text-[#1f2023]">Agregar al comité</p>
      <p className="text-xs text-[#5b5f66] mt-0.5">
        La persona debe estar registrada en SIGEA. Búscala por su número de documento.
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3 mt-4">
        <Input
          id="comite-documento"
          label="Número de documento"
          value={form.numeroDocumento}
          onChange={cambiar('numeroDocumento')}
          placeholder="1090123456"
          error={errores.numeroDocumento}
          maxLength={LIMITES_COMITE.numeroDocumento}
          disabled={disabled || guardando}
          required
          autoComplete="off"
        />
        <Input
          id="comite-rol"
          label="Rol en el comité"
          value={form.rolComite}
          onChange={cambiar('rolComite')}
          placeholder="Coordinador general"
          error={errores.rolComite}
          maxLength={LIMITES_COMITE.rolComite}
          disabled={disabled || guardando}
          required
        />
        <Button type="submit" variant="primary" loading={guardando} disabled={disabled} className="mt-[26px]">
          <UserPlus className="w-4 h-4" />
          <span>Agregar</span>
        </Button>
      </div>

      {errorGeneral && (
        <p className="mt-3 text-sm text-[#7a0c1e] bg-[#fdecec] px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}
    </form>
  );
}
