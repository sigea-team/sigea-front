import { useState } from 'react';
import { Info, Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { formatearPesos, leerNumero } from '../presupuestoUtils';
import {
  LIMITES_GASTO,
  aPeticionGasto,
  formGastoVacio,
  hoyIso,
  interpretarErrorGasto,
  validarGasto,
} from '../ejecucionUtils';

/**
 * @file GastoForm.jsx
 * @description Formulario para registrar un gasto ejecutado contra un rubro (HU-09: RF11, Criterio 1).
 * - Muestra mientras se escribe cuánto le queda al rubro elegido. Si el gasto lo supera, solo lo
 *   informa: el gasto se puede registrar igual.
 * - Criterio 3: sin valor o con valor negativo se marca en su campo antes de enviar; si el backend
 *   igual lo rechaza (400), su mensaje se muestra en el mismo campo. El valor 0 se acepta y el
 *   soporte es opcional (puede ser un enlace o una referencia en texto).
 * El padre puede montarlo con otra `key` para reiniciarlo con un rubro ya elegido.
 * @module features/presupuesto/components/GastoForm
 */

/**
 * @param {Object} props
 * @param {Array<Object>} props.rubros - Ejecución de los rubros vigentes (EjecucionRubroResponse).
 * @param {function(Object): Promise<Object>} props.onRegistrar - Envía el gasto (GastoEjecutadoRequest). Si falla, el formulario muestra el error.
 * @param {number} [props.rubroInicial] - Rubro elegido al abrir el formulario.
 */
export default function GastoForm({ rubros, onRegistrar, rubroInicial }) {
  const [form, setForm] = useState(() => formGastoVacio(rubroInicial));
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    const valor = e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }));
    if (errorGeneral) setErrorGeneral(null);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const validacion = validarGasto(form);
    if (Object.keys(validacion).length > 0) {
      setErrores(validacion);
      return;
    }
    setGuardando(true);
    try {
      await onRegistrar(aPeticionGasto(form));
      // Se conserva el rubro y la fecha para registrar varios gastos seguidos.
      setForm((f) => ({ ...formGastoVacio(f.rubroId), fechaGasto: f.fechaGasto }));
      setErrores({});
      document.getElementById('gasto-valor')?.focus();
    } catch (err) {
      const { campos, mensaje } = interpretarErrorGasto(err);
      setErrores(campos);
      setErrorGeneral(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  const rubro = rubros.find((r) => String(r.rubroId) === form.rubroId);
  const valor = leerNumero(form.valor);
  const valorValido = valor !== null && !Number.isNaN(valor) && valor >= 0;
  // Exceso total del rubro después del gasto (ejecutado + gasto − presupuestado), igual que el backend.
  const exceso = rubro && valorValido ? Number(rubro.ejecutado) + valor - Number(rubro.presupuestado) : 0;
  const excede = exceso > 0;
  const yaExcedido = rubro && Number(rubro.disponible) < 0;

  const opciones = rubros.map((r) => ({
    value: String(r.rubroId),
    label: `${r.nombre} — disponible ${formatearPesos(r.disponible)}`,
  }));

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8]"
      aria-label="Registrar gasto ejecutado"
    >
      <p className="text-sm font-semibold text-[#1f2023]">Registrar gasto</p>
      <p className="text-xs text-[#5b5f66] mt-0.5">
        Escribe el valor en pesos, con o sin puntos de miles (350000 o 350.000). El valor 0 es válido y el soporte es opcional.
      </p>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-3 mt-4">
        <Select
          id="gasto-rubro"
          label="Rubro"
          value={form.rubroId}
          onChange={cambiar('rubroId')}
          options={opciones}
          placeholder="Selecciona el rubro"
          error={errores.rubroId}
          disabled={guardando}
          required
        />
        <Input
          id="gasto-valor"
          label="Valor (COP)"
          value={form.valor}
          onChange={cambiar('valor')}
          placeholder="350.000"
          error={errores.valor}
          disabled={guardando}
          required
          inputMode="decimal"
          autoComplete="off"
          autoFocus={Boolean(rubroInicial)}
        />
        <Input
          id="gasto-fecha"
          label="Fecha del gasto"
          type="date"
          value={form.fechaGasto}
          onChange={cambiar('fechaGasto')}
          max={hoyIso()}
          error={errores.fechaGasto}
          disabled={guardando}
          required
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_auto] items-start gap-3 mt-3">
        <Input
          id="gasto-soporte"
          label="Soporte (opcional)"
          value={form.soporteUrl}
          onChange={cambiar('soporteUrl')}
          placeholder="Enlace o referencia: factura 001, https://..."
          error={errores.soporteUrl}
          maxLength={LIMITES_GASTO.soporte}
          disabled={guardando}
          autoComplete="off"
        />
        <Input
          id="gasto-descripcion"
          label="Descripción (opcional)"
          value={form.descripcion}
          onChange={cambiar('descripcion')}
          placeholder="Ej. tiquetes del conferencista"
          error={errores.descripcion}
          maxLength={LIMITES_GASTO.descripcion}
          disabled={guardando}
          autoComplete="off"
        />
        <Button type="submit" variant="primary" loading={guardando} className="mt-[26px]">
          <Plus className="w-4 h-4" />
          <span>Registrar</span>
        </Button>
      </div>

      <div className="mt-3 space-y-2" aria-live="polite">
        {rubro && (
          <p className="text-xs text-[#5b5f66]">
            «{rubro.nombre}»: ejecutado{' '}
            <span className="font-semibold text-[#1f2023] tabular-nums">{formatearPesos(rubro.ejecutado)}</span> de{' '}
            <span className="font-semibold text-[#1f2023] tabular-nums">{formatearPesos(rubro.presupuestado)}</span>.
            Disponible:{' '}
            <span className={`font-semibold tabular-nums ${Number(rubro.disponible) < 0 ? 'text-[#7a0c1e]' : 'text-[#1f2023]'}`}>
              {formatearPesos(rubro.disponible)}
            </span>
          </p>
        )}
        {excede && (
          <p className="flex items-start gap-2 text-xs text-[#1f2023] bg-white border border-[#e5e7ea] rounded-[8px] px-3 py-2">
            <Info className="w-4 h-4 shrink-0 text-[#5b5f66]" aria-hidden="true" />
            <span>
              {yaExcedido ? 'El rubro ya supera lo presupuestado. ' : 'Este gasto supera el disponible del rubro. '}
              Con este gasto el rubro quedará{' '}
              <span className="font-semibold tabular-nums">{formatearPesos(exceso)}</span> por encima de lo presupuestado
              ({formatearPesos(rubro.presupuestado)}). Se puede registrar igual; el rubro quedará marcado como excedido.
            </span>
          </p>
        )}
      </div>

      {errorGeneral && (
        <p className="mt-3 text-sm text-[#7a0c1e] bg-[#fdecec] border border-[#a6192e]/20 px-3 py-2 rounded-[8px]" role="alert">
          {errorGeneral}
        </p>
      )}
    </form>
  );
}
