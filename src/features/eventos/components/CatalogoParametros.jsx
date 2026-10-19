import { useState } from 'react';
import { Check, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { extraerError } from '../eventoUtils';
import {
  MAX_DESCRIPCION,
  aPeticion,
  describirUso,
  ordenarPorNombre,
  validarParametro,
} from '../parametroUtils';

/**
 * @file CatalogoParametros.jsx
 * @description Lista y administración de un catálogo del evento (HU-05): tipos de actividad
 * o líneas temáticas. Lo usa ParametrosEventoModal, una vez por pestaña.
 * - Criterio 1: formulario para agregar un elemento con nombre y descripción, y edición en la fila.
 * - Criterio 2: antes de eliminar consulta el uso; si está en uso muestra el impacto y no
 *   permite borrar. Si el backend responde 409 PARAMETRO_EN_USO, también lo muestra.
 * - Criterio 3: avisa del nombre duplicado antes de enviar y traduce el 409 PARAMETRO_DUPLICADO
 *   al campo nombre.
 * @module features/eventos/components/CatalogoParametros
 */

const FORM_VACIO = { nombre: '', descripcion: '' };

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
function BotonCompacto({ children, onClick, principal = false, disabled = false }) {
  return (
    <button
      type="button"
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

/** Mensaje de error general, con la pareja de colores de alerta del sistema de diseño. */
function AlertaError({ children }) {
  return (
    <p className="text-sm text-[#7a0c1e] bg-[#fdecec] border border-[#a6192e]/20 rounded-[8px] px-3 py-2" role="alert">
      {children}
    </p>
  );
}

/**
 * Traduce un error del backend a errores de formulario.
 * El 409 PARAMETRO_DUPLICADO se muestra en el campo nombre (Criterio 3).
 */
function erroresDesdeApi(err) {
  const { mensaje, campos, codigo } = extraerError(err);
  if (codigo === 'PARAMETRO_DUPLICADO') return { nombre: mensaje };
  if (Object.keys(campos).length > 0) return campos;
  return { general: mensaje };
}

/**
 * @param {Object} props
 * @param {typeof import('../parametroUtils').CATALOGOS.tipos} props.config - Textos y límites del catálogo.
 * @param {Array<{id: number, nombre: string, descripcion: string|null}>} props.items
 * @param {boolean} props.modificable - false = solo lectura (evento en ejecución o cerrado).
 * @param {string} [props.motivoBloqueo] - Explicación que se muestra cuando no es modificable.
 * @param {{
 *   crear: function(Object): Promise<Object>,
 *   actualizar: function(number, Object): Promise<Object>,
 *   consultarUso: function(number): Promise<Object>,
 *   eliminar: function(number): Promise<void>
 * }} props.acciones - Llamadas a la API ya ligadas al evento y al catálogo.
 * @param {function(Array<Object>): void} props.onCambio - Recibe la lista actualizada.
 */
export default function CatalogoParametros({ config, items, modificable, motivoBloqueo, acciones, onCambio }) {
  const [nuevo, setNuevo] = useState(FORM_VACIO);
  const [erroresNuevo, setErroresNuevo] = useState({});
  const [creando, setCreando] = useState(false);

  // Una sola fila puede estar en acción a la vez:
  // { tipo: 'editar', id, form, errores, guardando }
  // { tipo: 'eliminar', id, fase: 'verificando'|'confirmar'|'bloqueado'|'eliminando', uso, mensaje, error }
  const [accion, setAccion] = useState(null);
  const [aviso, setAviso] = useState('');

  const idNombreNuevo = `${config.clave}-nuevo-nombre`;

  // ---------------- Criterio 1 y 3: agregar ----------------

  const agregar = async (e) => {
    e.preventDefault();
    setAviso('');
    const errores = validarParametro(nuevo, config, items);
    setErroresNuevo(errores);
    if (Object.keys(errores).length > 0) return;

    setCreando(true);
    try {
      const creado = await acciones.crear(aPeticion(nuevo));
      onCambio(ordenarPorNombre([...items, creado]));
      setNuevo(FORM_VACIO);
      setAviso(`Se agregó «${creado.nombre}».`);
      document.getElementById(idNombreNuevo)?.focus();
    } catch (err) {
      setErroresNuevo(erroresDesdeApi(err));
    } finally {
      setCreando(false);
    }
  };

  // ---------------- Editar ----------------

  const empezarEdicion = (item) => {
    setAviso('');
    setAccion({
      tipo: 'editar',
      id: item.id,
      form: { nombre: item.nombre, descripcion: item.descripcion || '' },
      errores: {},
      guardando: false,
    });
  };

  const cambiarEdicion = (campo, valor) =>
    setAccion((a) => ({ ...a, form: { ...a.form, [campo]: valor }, errores: { ...a.errores, [campo]: undefined } }));

  const guardarEdicion = async (e) => {
    e.preventDefault();
    const errores = validarParametro(accion.form, config, items, accion.id);
    if (Object.keys(errores).length > 0) {
      setAccion((a) => ({ ...a, errores }));
      return;
    }
    setAccion((a) => ({ ...a, guardando: true, errores: {} }));
    try {
      const actualizado = await acciones.actualizar(accion.id, aPeticion(accion.form));
      onCambio(ordenarPorNombre(items.map((i) => (i.id === actualizado.id ? actualizado : i))));
      setAccion(null);
      setAviso(`Se guardaron los cambios de «${actualizado.nombre}».`);
    } catch (err) {
      setAccion((a) => ({ ...a, guardando: false, errores: erroresDesdeApi(err) }));
    }
  };

  // ---------------- Criterio 2: eliminar ----------------

  const pedirEliminacion = async (item) => {
    setAviso('');
    setAccion({ tipo: 'eliminar', id: item.id, fase: 'verificando' });
    try {
      const uso = await acciones.consultarUso(item.id);
      setAccion({ tipo: 'eliminar', id: item.id, fase: uso.eliminable ? 'confirmar' : 'bloqueado', uso });
    } catch (err) {
      setAccion({ tipo: 'eliminar', id: item.id, fase: 'confirmar', error: extraerError(err).mensaje });
    }
  };

  const confirmarEliminacion = async (item) => {
    setAccion((a) => ({ ...a, fase: 'eliminando', error: undefined }));
    try {
      await acciones.eliminar(item.id);
      onCambio(items.filter((i) => i.id !== item.id));
      setAccion(null);
      setAviso(`Se eliminó «${item.nombre}».`);
    } catch (err) {
      const { mensaje, codigo } = extraerError(err);
      if (codigo === 'PARAMETRO_EN_USO') {
        // Alguien lo empezó a usar después de la verificación: se muestra el mensaje del backend.
        setAccion({ tipo: 'eliminar', id: item.id, fase: 'bloqueado', mensaje });
      } else {
        setAccion((a) => ({ ...a, fase: 'confirmar', error: mensaje }));
      }
    }
  };

  const cancelar = () => setAccion(null);

  // ---------------- Render ----------------

  const ocupado = creando || accion?.guardando || accion?.fase === 'verificando' || accion?.fase === 'eliminando';

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#5b5f66] leading-relaxed">{config.ayuda}</p>

      {!modificable && (
        <div className="flex items-start gap-2.5 text-sm text-[#7a0c1e] bg-[#fdecec] border border-[#a6192e]/20 rounded-[8px] px-3.5 py-3">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>{motivoBloqueo}</p>
        </div>
      )}

      {modificable && (
        <form
          onSubmit={agregar}
          noValidate
          className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-3 items-start p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8]"
          aria-label={`Agregar ${config.singular}`}
        >
          <Input
            id={idNombreNuevo}
            label="Nombre"
            required
            value={nuevo.nombre}
            onChange={(e) => {
              setNuevo((f) => ({ ...f, nombre: e.target.value }));
              setErroresNuevo((er) => ({ ...er, nombre: undefined, general: undefined }));
            }}
            placeholder={config.placeholderNombre}
            maxLength={config.maxNombre}
            error={erroresNuevo.nombre}
            disabled={creando}
          />
          <Input
            id={`${config.clave}-nuevo-descripcion`}
            label="Descripción"
            value={nuevo.descripcion}
            onChange={(e) => {
              setNuevo((f) => ({ ...f, descripcion: e.target.value }));
              setErroresNuevo((er) => ({ ...er, descripcion: undefined, general: undefined }));
            }}
            placeholder={config.placeholderDescripcion}
            maxLength={MAX_DESCRIPCION}
            error={erroresNuevo.descripcion}
            disabled={creando}
          />
          <div className="pt-[26px]">
            <Button type="submit" variant="primary" loading={creando}>
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </Button>
          </div>
          {erroresNuevo.general && (
            <div className="col-span-3">
              <AlertaError>{erroresNuevo.general}</AlertaError>
            </div>
          )}
        </form>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {aviso}
      </p>
      {aviso && <p className="text-xs text-[#5b5f66]" aria-hidden="true">{aviso}</p>}

      {items.length === 0 ? (
        <div className="py-10 px-6 text-center rounded-[12px] border border-dashed border-[#d8dadf]">
          <p className="font-semibold text-[#1f2023]">{config.vacioTitulo}</p>
          {modificable && <p className="text-sm text-[#5b5f66] mt-1">{config.vacioTexto}</p>}
        </div>
      ) : (
        <ul className="rounded-[12px] border border-[#e5e7ea] bg-white divide-y divide-[#e5e7ea]">
          {items.map((item) => {
            const enAccion = accion?.id === item.id;
            const editando = enAccion && accion.tipo === 'editar';
            const eliminando = enAccion && accion.tipo === 'eliminar';

            if (editando) {
              return (
                <li key={item.id} className="p-4 bg-[#f7f7f8]/60">
                  <form
                    onSubmit={guardarEdicion}
                    noValidate
                    onKeyDown={(e) => e.key === 'Escape' && !accion.guardando && cancelar()}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-3 items-start"
                    aria-label={`Editar ${item.nombre}`}
                  >
                    <Input
                      id={`${config.clave}-editar-nombre-${item.id}`}
                      aria-label="Nombre"
                      value={accion.form.nombre}
                      onChange={(e) => cambiarEdicion('nombre', e.target.value)}
                      maxLength={config.maxNombre}
                      error={accion.errores.nombre}
                      disabled={accion.guardando}
                      autoFocus
                    />
                    <Input
                      id={`${config.clave}-editar-descripcion-${item.id}`}
                      aria-label="Descripción"
                      value={accion.form.descripcion}
                      onChange={(e) => cambiarEdicion('descripcion', e.target.value)}
                      placeholder="Sin descripción"
                      maxLength={MAX_DESCRIPCION}
                      error={accion.errores.descripcion}
                      disabled={accion.guardando}
                    />
                    <div className="flex gap-2 pt-1">
                      <BotonIcono type="submit" icono={Check} etiqueta="Guardar cambios" disabled={accion.guardando} />
                      <BotonIcono icono={X} etiqueta="Cancelar edición" onClick={cancelar} disabled={accion.guardando} />
                    </div>
                    {accion.errores.general && (
                      <div className="col-span-3">
                        <AlertaError>{accion.errores.general}</AlertaError>
                      </div>
                    )}
                  </form>
                </li>
              );
            }

            return (
              <li key={item.id} className={eliminando ? 'bg-[#f7f7f8]/60' : ''}>
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1f2023] break-words">{item.nombre}</p>
                    {item.descripcion && (
                      <p className="text-xs text-[#5b5f66] mt-0.5 break-words">{item.descripcion}</p>
                    )}
                  </div>

                  {modificable && !eliminando && (
                    <div className="flex items-center gap-2 shrink-0">
                      <BotonIcono
                        icono={Pencil}
                        etiqueta={`Editar «${item.nombre}»`}
                        onClick={() => empezarEdicion(item)}
                        disabled={ocupado}
                      />
                      <BotonIcono
                        icono={Trash2}
                        etiqueta={`Eliminar «${item.nombre}»`}
                        onClick={() => pedirEliminacion(item)}
                        disabled={ocupado}
                        peligro
                      />
                    </div>
                  )}

                  {eliminando && accion.fase === 'verificando' && (
                    <p className="text-xs text-[#5b5f66] shrink-0" role="status">
                      Revisando si está en uso...
                    </p>
                  )}
                </div>

                {eliminando && (accion.fase === 'confirmar' || accion.fase === 'eliminando') && (
                  <div className="mx-4 mb-4 p-3.5 rounded-[8px] border border-[#e5e7ea] bg-white space-y-3" role="alertdialog" aria-label={`Confirmar eliminación de ${item.nombre}`}>
                    <p className="text-sm text-[#1f2023]">
                      {accion.uso
                        ? `«${item.nombre}» no está en uso. La eliminación es permanente.`
                        : `¿Eliminar «${item.nombre}»? La eliminación es permanente.`}
                    </p>
                    {accion.error && <AlertaError>{accion.error}</AlertaError>}
                    <div className="flex justify-end gap-2">
                      <BotonCompacto onClick={cancelar} disabled={accion.fase === 'eliminando'}>
                        Cancelar
                      </BotonCompacto>
                      <BotonCompacto principal onClick={() => confirmarEliminacion(item)} disabled={accion.fase === 'eliminando'}>
                        <Trash2 className="w-4 h-4" />
                        {accion.fase === 'eliminando' ? 'Eliminando...' : 'Eliminar'}
                      </BotonCompacto>
                    </div>
                  </div>
                )}

                {eliminando && accion.fase === 'bloqueado' && (
                  <div className="mx-4 mb-4 p-3.5 rounded-[8px] border border-[#a6192e]/20 bg-[#fdecec] space-y-3" role="alert">
                    <p className="text-sm text-[#7a0c1e]">
                      {accion.uso ? (
                        <>
                          No se puede eliminar «{item.nombre}» porque lo usan {describirUso(accion.uso)}.{' '}
                          {config.reasignar}
                        </>
                      ) : (
                        accion.mensaje
                      )}
                    </p>
                    <div className="flex justify-end">
                      <BotonCompacto onClick={cancelar}>Entendido</BotonCompacto>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
