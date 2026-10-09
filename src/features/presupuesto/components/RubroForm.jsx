import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import {
  FORM_RUBRO_VACIO,
  LIMITES_RUBRO,
  aPeticionRubro,
  calcularSubtotal,
  formatearPesos,
  interpretarErrorRubro,
  leerNumero,
  validarRubro,
} from '../presupuestoUtils';

/**
 * @file RubroForm.jsx
 * @description Formulario para agregar un rubro al presupuesto preliminar (HU-07, Criterio 1).
 * Muestra el valor del rubro (cantidad × valor unitario) mientras se escribe.
 * - Criterio 3: nombre vacío, valor vacío o negativo se marcan en su campo antes de enviar;
 *   si el backend igual los rechaza (400), sus mensajes se muestran en el mismo campo.
 * - Nombre repetido: se avisa antes de enviar y también se traduce el 409 RUBRO_DUPLICADO.
 * @module features/presupuesto/components/RubroForm
 */

/**
 * @param {Object} props
 * @param {function(Object): Promise<Object>} props.onAgregar - Envía el rubro (RubroRequest). Si falla, el formulario muestra el error.
 * @param {Array<Object>} [props.rubros=[]] - Rubros actuales, para avisar de nombres repetidos.
 */
export default function RubroForm({ onAgregar, rubros = [] }) {
  const [form, setForm] = useState(FORM_RUBRO_VACIO);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }));
    if (errorGeneral) setErrorGeneral(null);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const validacion = validarRubro(form, rubros);
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      return;
    }
    setGuardando(true);
    try {
      await onAgregar(aPeticionRubro(form));
      setForm(FORM_RUBRO_VACIO);
      setErrores({});
      document.getElementById('rubro-nombre')?.focus();
    } catch (err) {
      const { campos, mensaje } = interpretarErrorRubro(err);
      setErrores(campos);
      setErrorGeneral(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const cantidad = leerNumero(form.cantidad);
  const subtotal = calcularSubtotal(cantidad === null ? 1 : cantidad, leerNumero(form.valorUnitario));

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8]"
      aria-label="Agregar rubro al presupuesto"
    >
      <p className="text-sm font-semibold text-[#1f2023]">Agregar rubro</p>
      <p className="text-xs text-[#5b5f66] mt-0.5">
        Escribe los valores en pesos, con o sin puntos de miles (350000 o 350.000). El valor 0 es válido.
      </p>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_auto] items-start gap-3 mt-4">
        <Input
          id="rubro-nombre"
          label="Rubro"
          value={form.nombre}
          onChange={cambiar('nombre')}
          placeholder="Transporte de conferencistas"
          error={errores.nombre}
          maxLength={LIMITES_RUBRO.nombre}
          disabled={guardando}
          required
          autoComplete="off"
        />
        <Input
          id="rubro-cantidad"
          label="Cantidad"
          value={form.cantidad}
          onChange={cambiar('cantidad')}
          placeholder="1"
          error={errores.cantidad}
          disabled={guardando}
          inputMode="decimal"
          autoComplete="off"
        />
        <Input
          id="rubro-valor"
          label="Valor unitario (COP)"
          value={form.valorUnitario}
          onChange={cambiar('valorUnitario')}
          placeholder="350.000"
          error={errores.valorUnitario}
          disabled={guardando}
          required
          inputMode="decimal"
          autoComplete="off"
        />
        <Button type="submit" variant="primary" loading={guardando} className="mt-[26px]">
          <Plus className="w-4 h-4" />
          <span>Agregar</span>
        </Button>
      </div>

      <p className="mt-3 text-xs text-[#5b5f66]" aria-live="polite">
        Valor del rubro:{' '}
        <span className="font-semibold text-[#1f2023] tabular-nums">{subtotal === null ? '—' : formatearPesos(subtotal)}</span>
      </p>

      {errorGeneral && (
        <p className="mt-3 text-sm text-[#7a0c1e] bg-[#fdecec] border border-[#a6192e]/20 px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}
    </form>
  );
}
