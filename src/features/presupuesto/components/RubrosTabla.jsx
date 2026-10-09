import { useState } from 'react';
import { Check, History, Pencil, Trash2, X } from 'lucide-react';
import Input from '../../../components/ui/Input';
import {
  LIMITES_RUBRO,
  aFormularioRubro,
  aPeticionRubro,
  calcularSubtotal,
  formatearCantidad,
  formatearPesos,
  interpretarErrorRubro,
  leerNumero,
  validarRubro,
} from '../presupuestoUtils';

/**
 * @file RubrosTabla.jsx
 * @description Tabla de rubros del presupuesto preliminar con su subtotal y el total (HU-07).
 * - Criterio 1: el pie de la tabla muestra el total de los rubros vigentes.
 * - Criterio 2: edición en la fila y eliminación con confirmación; ambas aceptan un motivo
 *   opcional que queda en el historial. Los rubros eliminados se pueden mostrar en gris.
 * - Criterio 3: al editar se aplican las mismas validaciones que al agregar.
 * Solo una fila puede estar en edición o confirmando eliminación a la vez.
 * @module features/presupuesto/components/RubrosTabla
 */

/** Botón cuadrado de icono, con el mismo estilo que las acciones de la tabla de eventos. */
function BotonIcono({ icono: Icono, etiqueta, onClick, disabled, peligro = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={etiqueta}
      aria-label={etiqueta}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-[8px] border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] ${
        disabled
          ? 'border-[#e5e7ea] text-[#9ca0a6] cursor-not-allowed'
          : peligro
          ? 'border-[#a6192e]/20 text-[#a6192e] bg-[#fdecec]/50 hover:bg-[#fdecec] cursor-pointer'
          : 'border-[#d8dadf] text-[#5b5f66] bg-white hover:bg-[#f7f7f8] hover:text-[#1f2023] cursor-pointer'
      }`}
    >
      <Icono className="w-4 h-4" />
    </button>
  );
}

/** Botón de texto compacto para las confirmaciones dentro de una fila. */
function BotonCompacto({ children, onClick, principal = false, disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-9 px-4 rounded-[8px] text-sm font-medium inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e] disabled:cursor-not-allowed ${
        principal
          ? 'bg-[#a6192e] text-white hover:bg-[#7a0c1e] disabled:bg-[#d8dadf] disabled:text-[#9ca0a6] cursor-pointer'
          : 'border border-[#d8dadf] bg-white text-[#1f2023] hover:bg-[#f7f7f8] disabled:opacity-50 cursor-pointer'
      }`}
    >
      {children}
    </button>
  );
}

function AlertaError({ children }) {
  return (
    <p className="text-sm text-[#7a0c1e] bg-[#fdecec] border border-[#a6192e]/20 rounded-[8px] px-3 py-2" role="alert">
      {children}
    </p>
  );
}

/**
 * @param {Object} props
 * @param {Array<Object>} props.rubros - RubroResponse (vigentes y, si se pidió, eliminados).
 * @param {number} props.total - Total del presupuesto (solo vigentes), calculado por el backend.
 * @param {boolean} props.editable - false = solo lectura.
 * @param {function(number, Object): Promise<Object>} props.onActualizar - (rubroId, RubroRequest).
 * @param {function(number, string): Promise<Object>} props.onEliminar - (rubroId, motivo).
 * @param {function(Object): void} [props.onVerHistorial] - Abre el historial filtrado por el rubro.
 */
export default function RubrosTabla({ rubros, total, editable, onActualizar, onEliminar, onVerHistorial }) {
  // { tipo: 'editar', id, form, errores, guardando } | { tipo: 'eliminar', id, motivo, error, eliminando }
  const [accion, setAccion] = useState(null);

  const ocupado = Boolean(accion?.guardando || accion?.eliminando);
  const conAcciones = editable || Boolean(onVerHistorial);
  const columnas = conAcciones ? 5 : 4;
  const cancelar = () => setAccion(null);

  // ---------------- Editar (Criterio 2) ----------------

  const empezarEdicion = (rubro) =>
    setAccion({ tipo: 'editar', id: rubro.id, form: aFormularioRubro(rubro), errores: {}, guardando: false });

  const cambiarEdicion = (campo) => (e) => {
    const valor = e.target.value;
    setAccion((a) => ({ ...a, form: { ...a.form, [campo]: valor }, errores: { ...a.errores, [campo]: undefined, general: undefined } }));
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    const errores = validarRubro(accion.form, rubros, accion.id);
    if (Object.keys(errores).length > 0) {
      setAccion((a) => ({ ...a, errores }));
      return;
    }
    setAccion((a) => ({ ...a, guardando: true, errores: {} }));
    try {
      await onActualizar(accion.id, aPeticionRubro(accion.form));
      setAccion(null);
    } catch (err) {
      const { campos, mensaje } = interpretarErrorRubro(err);
      setAccion((a) => ({ ...a, guardando: false, errores: { ...campos, general: mensaje || undefined } }));
    }
  };

  // ---------------- Eliminar (Criterio 2) ----------------

  const pedirEliminacion = (rubro) => setAccion({ tipo: 'eliminar', id: rubro.id, motivo: '', error: null, eliminando: false });

  const confirmarEliminacion = async (e) => {
    e.preventDefault();
    if (accion.motivo.trim().length > LIMITES_RUBRO.motivo) {
      setAccion((a) => ({ ...a, error: `El motivo no puede superar los ${LIMITES_RUBRO.motivo} caracteres.` }));
      return;
    }
    setAccion((a) => ({ ...a, eliminando: true, error: null }));
    try {
      await onEliminar(accion.id, accion.motivo.trim());
      setAccion(null);
    } catch (err) {
      setAccion((a) => ({ ...a, eliminando: false, error: interpretarErrorRubro(err).mensaje || 'No se pudo eliminar el rubro.' }));
    }
  };

  // ---------------- Render ----------------

  const vigentes = rubros.filter((r) => r.activo).length;

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
            <th scope="col" className="py-3 px-4">Rubro</th>
            <th scope="col" className="py-3 px-4 text-right">Cantidad</th>
            <th scope="col" className="py-3 px-4 text-right">Valor unitario</th>
            <th scope="col" className="py-3 px-4 text-right">Subtotal</th>
            {conAcciones && (
              <th scope="col" className="py-3 px-4 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
          {rubros.length === 0 && (
            <tr>
              <td colSpan={columnas} className="py-10 px-4 text-center">
                <p className="font-semibold text-[#1f2023]">El presupuesto todavía no tiene rubros</p>
                {editable && <p className="text-xs mt-1 text-[#5b5f66]">Agrega el primero con su valor estimado.</p>}
              </td>
            </tr>
          )}

          {rubros.map((rubro) => {
            const enAccion = accion?.id === rubro.id;

            // ----- Fila en edición -----
            if (enAccion && accion.tipo === 'editar') {
              const cantidad = leerNumero(accion.form.cantidad);
              const subtotal = calcularSubtotal(cantidad === null ? 1 : cantidad, leerNumero(accion.form.valorUnitario));
              return (
                <tr key={rubro.id} className="bg-[#f7f7f8]/60">
                  <td colSpan={columnas} className="p-4">
                    <form
                      onSubmit={guardarEdicion}
                      noValidate
                      onKeyDown={(e) => e.key === 'Escape' && !accion.guardando && cancelar()}
                      aria-label={`Editar ${rubro.nombre}`}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1.4fr)_auto] gap-3 items-start">
                        <Input
                          id={`rubro-editar-nombre-${rubro.id}`}
                          label="Rubro"
                          value={accion.form.nombre}
                          onChange={cambiarEdicion('nombre')}
                          maxLength={LIMITES_RUBRO.nombre}
                          error={accion.errores.nombre}
                          disabled={accion.guardando}
                          required
                          autoFocus
                        />
                        <Input
                          id={`rubro-editar-cantidad-${rubro.id}`}
                          label="Cantidad"
                          value={accion.form.cantidad}
                          onChange={cambiarEdicion('cantidad')}
                          error={accion.errores.cantidad}
                          disabled={accion.guardando}
                          inputMode="decimal"
                        />
                        <Input
                          id={`rubro-editar-valor-${rubro.id}`}
                          label="Valor unitario (COP)"
                          value={accion.form.valorUnitario}
                          onChange={cambiarEdicion('valorUnitario')}
                          error={accion.errores.valorUnitario}
                          disabled={accion.guardando}
                          required
                          inputMode="decimal"
                        />
                        <div className="flex gap-2 pt-[30px]">
                          <BotonIcono type="submit" icono={Check} etiqueta="Guardar cambios" disabled={accion.guardando} />
                          <BotonIcono icono={X} etiqueta="Cancelar edición" onClick={cancelar} disabled={accion.guardando} />
                        </div>
                      </div>
                      <Input
                        id={`rubro-editar-motivo-${rubro.id}`}
                        label="Motivo del cambio (opcional, queda en el historial)"
                        value={accion.form.motivo}
                        onChange={cambiarEdicion('motivo')}
                        placeholder="Ej. tarifa actualizada por el proveedor"
                        maxLength={LIMITES_RUBRO.motivo}
                        error={accion.errores.motivo}
                        disabled={accion.guardando}
                      />
                      <p className="text-xs text-[#5b5f66]">
                        Nuevo subtotal:{' '}
                        <span className="font-semibold text-[#1f2023] tabular-nums">
                          {subtotal === null ? '—' : formatearPesos(subtotal)}
                        </span>{' '}
                        (antes {formatearPesos(rubro.subtotal)})
                      </p>
                      {accion.errores.general && <AlertaError>{accion.errores.general}</AlertaError>}
                    </form>
                  </td>
                </tr>
              );
            }

            // ----- Fila normal (con confirmación de eliminación debajo si aplica) -----
            const confirmando = enAccion && accion.tipo === 'eliminar';
            return [
              <tr key={rubro.id} className={!rubro.activo ? 'bg-[#f7f7f8]/60' : confirmando ? 'bg-[#fdecec]/30' : ''}>
                <td className="py-3.5 px-4 align-middle">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold break-words ${rubro.activo ? 'text-[#1f2023]' : 'text-[#5b5f66] line-through'}`}>
                      {rubro.nombre}
                    </span>
                    {!rubro.activo && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#edeeef] text-[#5b5f66] border border-[#d8dadf]">
                        Eliminado
                      </span>
                    )}
                  </div>
                </td>
                <td className={`py-3.5 px-4 align-middle text-right tabular-nums ${rubro.activo ? '' : 'text-[#5b5f66]'}`}>
                  {formatearCantidad(rubro.cantidad)}
                </td>
                <td className={`py-3.5 px-4 align-middle text-right tabular-nums whitespace-nowrap ${rubro.activo ? '' : 'text-[#5b5f66]'}`}>
                  {formatearPesos(rubro.valorUnitarioProyectado)}
                </td>
                <td className={`py-3.5 px-4 align-middle text-right tabular-nums whitespace-nowrap ${rubro.activo ? 'font-semibold' : 'text-[#5b5f66]'}`}>
                  {formatearPesos(rubro.subtotal)}
                </td>
                {conAcciones && (
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {onVerHistorial && (
                        <BotonIcono
                          icono={History}
                          etiqueta={`Ver historial de «${rubro.nombre}»`}
                          onClick={() => onVerHistorial(rubro)}
                          disabled={ocupado}
                        />
                      )}
                      {editable && rubro.activo && (
                        <>
                          <BotonIcono
                            icono={Pencil}
                            etiqueta={`Editar «${rubro.nombre}»`}
                            onClick={() => empezarEdicion(rubro)}
                            disabled={ocupado || confirmando}
                          />
                          <BotonIcono
                            icono={Trash2}
                            etiqueta={`Eliminar «${rubro.nombre}»`}
                            onClick={() => pedirEliminacion(rubro)}
                            disabled={ocupado || confirmando}
                            peligro
                          />
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>,
              confirmando && (
                <tr key={`${rubro.id}-confirmar`} className="bg-[#fdecec]/30">
                  <td colSpan={columnas} className="px-4 pb-4 pt-0">
                    <form
                      onSubmit={confirmarEliminacion}
                      noValidate
                      onKeyDown={(e) => e.key === 'Escape' && !accion.eliminando && cancelar()}
                      className="p-3.5 rounded-[8px] border border-[#e5e7ea] bg-white space-y-3"
                      role="alertdialog"
                      aria-label={`Confirmar eliminación de ${rubro.nombre}`}
                    >
                      <p className="text-sm text-[#1f2023]">
                        ¿Eliminar «{rubro.nombre}» del presupuesto? El total bajará{' '}
                        <span className="font-semibold tabular-nums">{formatearPesos(rubro.subtotal)}</span>. El rubro queda
                        guardado en el historial.
                      </p>
                      <Input
                        id={`rubro-eliminar-motivo-${rubro.id}`}
                        label="Motivo (opcional)"
                        value={accion.motivo}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setAccion((a) => ({ ...a, motivo: valor, error: null }));
                        }}
                        placeholder="Ej. lo cubre un patrocinador"
                        maxLength={LIMITES_RUBRO.motivo}
                        disabled={accion.eliminando}
                        autoFocus
                      />
                      {accion.error && <AlertaError>{accion.error}</AlertaError>}
                      <div className="flex justify-end gap-2">
                        <BotonCompacto onClick={cancelar} disabled={accion.eliminando}>
                          Cancelar
                        </BotonCompacto>
                        <BotonCompacto type="submit" principal disabled={accion.eliminando}>
                          <Trash2 className="w-4 h-4" />
                          {accion.eliminando ? 'Eliminando...' : 'Eliminar rubro'}
                        </BotonCompacto>
                      </div>
                    </form>
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>

        <tfoot>
          <tr className="bg-[#f7f7f8] border-t-2 border-[#e5e7ea]">
            <th scope="row" colSpan={3} className="py-3.5 px-4 text-left text-sm font-semibold text-[#1f2023]">
              Total del presupuesto preliminar
              <span className="ml-2 text-xs font-normal text-[#5b5f66]">
                ({vigentes} {vigentes === 1 ? 'rubro vigente' : 'rubros vigentes'})
              </span>
            </th>
            <td className="py-3.5 px-4 text-right text-base font-bold text-[#a6192e] tabular-nums whitespace-nowrap">
              {formatearPesos(total)}
            </td>
            {conAcciones && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
