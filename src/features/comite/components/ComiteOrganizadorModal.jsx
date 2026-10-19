import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { Lock, UserMinus, Users } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import EstadoEventoBadge from '../../eventos/components/EstadoEventoBadge';
import { extraerError, formatearFecha } from '../../eventos/eventoUtils';
import MiembroComiteForm from './MiembroComiteForm';
import { motivoComiteBloqueado, puedeModificarComite, soloFecha } from '../comiteUtils';

/**
 * @file ComiteOrganizadorModal.jsx
 * @description Responsables y comité organizador de un evento (HU-06: RF05).
 * - Criterio 1: agrega una persona (por documento) con su rol dentro del comité.
 * - Criterio 2: si ya es miembro vigente, el backend lo rechaza y el error se muestra en el formulario.
 * - Criterio 3: retira miembros de la lista vigente; con «Mostrar retirados» se ve el historial.
 * - Criterio 4: solo se modifica con el evento en configuración o habilitado; en otro estado es de solo lectura.
 * El padre debe montarlo con una `key` distinta por evento.
 * @module features/comite/components/ComiteOrganizadorModal
 */

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  customClass: { popup: 'rounded-[16px]', confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm' },
};

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - { id, nombre, semestre, estado }
 * @param {typeof import('../../../api/comiteService').comiteService} props.api
 * @param {function(): void} props.onClose
 */
export default function ComiteOrganizadorModal({ isOpen, evento, api, onClose }) {
  const [miembros, setMiembros] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [incluirHistorial, setIncluirHistorial] = useState(false);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [retirandoId, setRetirandoId] = useState(null);

  const eventoId = evento?.id;
  const modificable = puedeModificarComite(evento);

  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    api
      .listarComite(eventoId, incluirHistorial)
      .then((data) => {
        if (!activo) return;
        setMiembros(Array.isArray(data) ? data : []);
        setErrorCarga(false);
      })
      .catch(() => {
        if (activo) setErrorCarga(true);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, incluirHistorial, version, api]);

  const recargar = () => setVersion((v) => v + 1);

  const { vigentes, retirados } = useMemo(() => {
    const lista = miembros || [];
    return {
      vigentes: lista.filter((m) => m.activo).length,
      retirados: lista.filter((m) => !m.activo).length,
    };
  }, [miembros]);

  if (!isOpen || !evento) return null;

  const agregar = async (datos) => {
    setAviso(null);
    const creado = await api.agregarMiembro(evento.id, datos);
    setAviso(`${creado.nombreCompleto} se agregó al comité como «${creado.rolComite}».`);
    recargar();
  };

  const retirar = async (miembro) => {
    const { isConfirmed } = await Swal.fire({
      ...ESTILO_SWAL,
      icon: 'question',
      title: `¿Retirar a ${miembro.nombreCompleto}?`,
      text: 'Dejará de aparecer en el comité vigente. Su participación queda guardada en el historial del evento.',
      showCancelButton: true,
      confirmButtonText: 'Retirar del comité',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!isConfirmed) return;

    setAviso(null);
    setRetirandoId(miembro.id);
    try {
      await api.retirarMiembro(evento.id, miembro.id);
      setAviso(`${miembro.nombreCompleto} se retiró del comité. Su participación queda en el historial.`);
      recargar();
    } catch (err) {
      Swal.fire({
        ...ESTILO_SWAL,
        icon: 'error',
        title: 'No se pudo retirar del comité',
        text: extraerError(err).mensaje,
        confirmButtonText: 'Entendido',
      });
    } finally {
      setRetirandoId(null);
    }
  };

  let resumen = 'Cargando comité...';
  if (miembros) {
    resumen = `${vigentes} ${vigentes === 1 ? 'miembro vigente' : 'miembros vigentes'}`;
    if (incluirHistorial && retirados > 0) {
      resumen += ` y ${retirados} ${retirados === 1 ? 'retirado' : 'retirados'}`;
    }
  }

  return (
    <ModalShell
      titulo="Comité organizador"
      subtitulo={`${evento.nombre}${evento.semestre ? ` (${evento.semestre})` : ''}`}
      icono={Users}
      onClose={onClose}
      ancho="max-w-3xl"
      tituloId="comite-titulo"
      pie={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <EstadoEventoBadge estado={evento.estado} />
            <p className="text-sm text-[#5b5f66]" role="status">
              {resumen}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#1f2023] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={incluirHistorial}
              onChange={(e) => setIncluirHistorial(e.target.checked)}
              className="w-4 h-4 accent-[#a6192e] cursor-pointer"
            />
            Mostrar retirados
          </label>
        </div>

        {modificable ? (
          <MiembroComiteForm onAgregar={agregar} />
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-[12px] bg-[#fdecec] text-[#7a0c1e]" role="note">
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{motivoComiteBloqueado(evento)}</p>
          </div>
        )}

        {aviso && (
          <p className="text-sm text-[#1f2023] bg-[#f7f7f8] border border-[#e5e7ea] px-3 py-2 rounded-[8px]" role="status">
            {aviso}
          </p>
        )}

        <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                <th scope="col" className="py-3 px-4">Persona</th>
                <th scope="col" className="py-3 px-4">Rol en el comité</th>
                <th scope="col" className="py-3 px-4">Participación</th>
                {modificable && (
                  <th scope="col" className="py-3 px-4 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
              {errorCarga && (
                <tr>
                  <td colSpan={modificable ? 4 : 3} className="py-10 px-4 text-center">
                    <p className="font-semibold text-[#1f2023]">No se pudo cargar el comité</p>
                    <button
                      type="button"
                      onClick={recargar}
                      className="text-xs mt-1 text-[#a6192e] font-semibold underline cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}

              {!errorCarga && !miembros && (
                <tr>
                  <td colSpan={modificable ? 4 : 3} className="py-10 px-4 text-center text-[#5b5f66]" role="status">
                    Cargando comité...
                  </td>
                </tr>
              )}

              {!errorCarga && miembros?.length === 0 && (
                <tr>
                  <td colSpan={modificable ? 4 : 3} className="py-10 px-4 text-center">
                    <p className="font-semibold text-[#1f2023]">
                      {incluirHistorial ? 'Este evento no tiene participaciones registradas' : 'El comité todavía no tiene miembros'}
                    </p>
                    {modificable && (
                      <p className="text-xs mt-1 text-[#5b5f66]">Agrega al primero con su número de documento.</p>
                    )}
                  </td>
                </tr>
              )}

              {!errorCarga &&
                miembros?.map((miembro) => (
                  <tr key={miembro.id} className={miembro.activo ? '' : 'bg-[#f7f7f8]/60'}>
                    <td className="py-3.5 px-4 align-middle">
                      <p className={`font-semibold ${miembro.activo ? 'text-[#1f2023]' : 'text-[#5b5f66]'}`}>
                        {miembro.nombreCompleto}
                      </p>
                      <p className="text-xs text-[#5b5f66] mt-0.5">
                        {miembro.numeroDocumento}
                        {miembro.correo ? `, ${miembro.correo}` : ''}
                      </p>
                    </td>
                    <td className={`py-3.5 px-4 align-middle ${miembro.activo ? '' : 'text-[#5b5f66]'}`}>
                      {miembro.rolComite}
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      {miembro.activo ? (
                        <span className="text-[#1f2023]">Desde {formatearFecha(soloFecha(miembro.fechaAsignacion))}</span>
                      ) : (
                        <div>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#edeeef] text-[#5b5f66] border border-[#d8dadf]">
                            Retirado
                          </span>
                          <p className="text-xs text-[#5b5f66] mt-1">
                            {formatearFecha(soloFecha(miembro.fechaAsignacion))} – {formatearFecha(soloFecha(miembro.fechaRetiro))}
                          </p>
                        </div>
                      )}
                    </td>
                    {modificable && (
                      <td className="py-3.5 px-4 align-middle text-right">
                        {miembro.activo && (
                          <button
                            type="button"
                            onClick={() => retirar(miembro)}
                            disabled={retirandoId !== null}
                            title={`Retirar a ${miembro.nombreCompleto} del comité`}
                            aria-label={`Retirar a ${miembro.nombreCompleto} del comité`}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-[8px] border border-[#a6192e]/20 text-[#a6192e] bg-[#fdecec]/50 hover:bg-[#fdecec] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a6192e]"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}
