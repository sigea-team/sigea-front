import { useEffect } from 'react';
import { X, Lock, FileSearch } from 'lucide-react';
import Button from '../../../components/ui/Button';
import {
  compararAntesDespues,
  etiquetaCampo,
  formatearFechaHora,
  parsearDetalle,
  valorLegible,
} from '../auditoriaUtils';

/**
 * @file AuditoriaDetalleModal.jsx
 * @description Modal de solo lectura con los datos afectados de un registro de auditoría
 * (HU-03, Criterio 1: "usuario, fecha y hora, acción realizada y datos afectados").
 * Cuando el detalle trae "antes" y/o "después", los muestra en una tabla comparativa
 * resaltando los campos que cambiaron. No ofrece acciones de edición (Criterio 3).
 * @module features/auditoria/components/AuditoriaDetalleModal
 */

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.registro
 * @param {function(): void} props.onClose
 */
export default function AuditoriaDetalleModal({ isOpen, registro = null, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const cerrarConEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !registro) return null;

  const { fecha, hora } = formatearFechaHora(registro.fechaHora);
  const detalle = parsearDetalle(registro.detalle);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl max-h-[calc(100vh-2rem)] bg-white rounded-[16px] shadow-2xl border border-[#e5e7ea] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalle-auditoria"
        aria-describedby="descripcion-detalle-auditoria"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-[#e5e7ea] flex items-center justify-between shrink-0 bg-[#f7f7f8]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 id="titulo-detalle-auditoria" className="font-serif-title text-xl text-[#1f2023] leading-tight">
                Registro de auditoría #{registro.id}
              </h2>
              <p id="descripcion-detalle-auditoria" className="text-xs text-[#5b5f66] mt-0.5">
                {registro.accionDescripcion || registro.accion}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#5b5f66] hover:bg-[#edeeef] cursor-pointer shrink-0"
            title="Cerrar"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Dato etiqueta="Fecha y hora" valor={`${fecha} · ${hora}`} />
            <Dato
              etiqueta="Usuario"
              valor={registro.usuarioNombre || 'Sistema'}
              secundario={registro.usuarioCorreo || 'Operación automática del sistema'}
            />
            <Dato etiqueta="Operación" valor={registro.accion} mono />
            <Dato
              etiqueta="Recurso afectado"
              valor={`${registro.entidad}${registro.entidadId != null ? ` #${registro.entidadId}` : ''}`}
            />
          </dl>

          <div>
            <h3 className="text-sm font-semibold text-[#1f2023] mb-3">Datos afectados</h3>

            {detalle.tipo === 'vacio' && (
              <p className="text-sm text-[#9ca0a6]">Esta operación no registró datos adicionales.</p>
            )}

            {detalle.tipo === 'texto' && (
              <pre className="text-xs bg-[#f7f7f8] border border-[#e5e7ea] rounded-[8px] p-4 whitespace-pre-wrap break-words">
                {detalle.valor}
              </pre>
            )}

            {detalle.tipo === 'comparativo' && (
              <TablaComparativa antes={detalle.antes} despues={detalle.despues} />
            )}

            {detalle.tipo === 'objeto' && <ListaCampos datos={detalle.valor} />}

            {detalle.tipo === 'no_estructurado' && (
              <div className="space-y-2">
                <p className="text-xs text-[#5b5f66]">
                  Detalle no estructurado: se muestra tal como fue registrado.
                </p>
                <pre className="text-xs bg-[#f7f7f8] border border-[#e5e7ea] rounded-[8px] p-4 whitespace-pre-wrap break-words overflow-x-auto">
                  {JSON.stringify(detalle.valor, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="px-6 py-4 border-t border-[#e5e7ea] flex items-center justify-between gap-4 shrink-0 bg-[#f7f7f8]/50">
          <p className="text-xs text-[#5b5f66] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#a6192e]" />
            Registro inmutable: no puede modificarse ni eliminarse.
          </p>
          <Button type="button" variant="outline" onClick={onClose} className="h-10 px-5">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor, secundario, mono = false }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-[#9ca0a6]">{etiqueta}</dt>
      <dd className={`mt-1 text-[#1f2023] font-medium ${mono ? 'font-mono text-xs' : ''}`}>{valor}</dd>
      {secundario && <dd className="text-xs text-[#5b5f66]">{secundario}</dd>}
    </div>
  );
}

function TablaComparativa({ antes, despues }) {
  const filas = compararAntesDespues(antes, despues);
  const soloDespues = antes === undefined;
  const soloAntes = despues === undefined;

  return (
    <div className="overflow-x-auto rounded-[12px] border border-[#e5e7ea]">
      <table className="w-full min-w-[28rem] text-left border-collapse text-sm">
        <thead>
          <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold uppercase tracking-wider">
            <th className="py-2.5 px-4 w-1/4">Campo</th>
            {soloDespues && <th className="py-2.5 px-4">Valor registrado</th>}
            {soloAntes && <th className="py-2.5 px-4">Valor eliminado</th>}
            {!soloDespues && !soloAntes && (
              <>
                <th className="py-2.5 px-4">Antes</th>
                <th className="py-2.5 px-4">Después</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7ea]">
          {filas.map((f) => {
            const resaltar = f.cambio && !soloDespues && !soloAntes;
            return (
              <tr key={f.campo} className={resaltar ? 'bg-[#f7f7f8]' : ''}>
                <td className="py-2.5 px-4 font-medium text-[#1f2023] align-top">
                  {etiquetaCampo(f.campo)}
                  {resaltar && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fdecec] text-[#a6192e]">
                      Modificado
                    </span>
                  )}
                </td>
                {soloDespues ? (
                  <td className="py-2.5 px-4 text-[#1f2023] break-words">{valorLegible(f.despues)}</td>
                ) : (
                  <>
                    <td className="py-2.5 px-4 text-[#5b5f66] break-words">{valorLegible(f.antes)}</td>
                    {!soloAntes && (
                      <td className={`py-2.5 px-4 break-words ${resaltar ? 'font-semibold text-[#1f2023]' : 'text-[#5b5f66]'}`}>
                        {valorLegible(f.despues)}
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListaCampos({ datos }) {
  return (
    <div className="rounded-[12px] border border-[#e5e7ea] divide-y divide-[#e5e7ea]">
      {Object.entries(datos).map(([clave, valor]) => (
        <div key={clave} className="grid grid-cols-3 gap-4 px-4 py-2.5 text-sm">
          <span className="font-medium text-[#1f2023]">{etiquetaCampo(clave)}</span>
          <span className="col-span-2 text-[#5b5f66] break-words">{valorLegible(valor)}</span>
        </div>
      ))}
    </div>
  );
}
