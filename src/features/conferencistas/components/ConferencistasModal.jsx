import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ArrowLeft, Clock, Copy, ExternalLink, Lock, Mic, Pencil, RotateCw, UserMinus, UserPlus, XCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import EstadoEventoBadge from '../../eventos/components/EstadoEventoBadge';
import { extraerError, formatearFecha } from '../../eventos/eventoUtils';
import ConferencistaForm from './ConferencistaForm';
import AsociarConferencistaPanel from './AsociarConferencistaPanel';
import AgregarConferencistaPanel from './AgregarConferencistaPanel';
import {
  aActualizarRequest,
  esEventoPublico,
  etiquetaParticipacion,
  eventosConVistaPublica,
  fechaCorta,
  motivoAsociacionBloqueada,
  puedeAsociarConferencistas,
} from '../conferencistaUtils';

/**
 * @file ConferencistasModal.jsx
 * @description Módulo de conferencistas de un evento (HU-12: RF16 y RF17).
 * - Criterio 1: lista los conferencistas del evento. Los nuevos se invitan solo con nombre y correo y
 *   registran ellos mismos sus datos y trayectoria desde el enlace del correo (vigente 3 días).
 * - Criterio 2: el invitado no puede enviar sus datos con campos obligatorios incompletos.
 * - Criterio 3: «Agregar conferencista» muestra la lista de registrados para vincularlos sin duplicarlos;
 *   si se invita un correo que ya es de un conferencista, se ofrece vincularlo.
 * - Criterio 4: edita los datos y la trayectoria; el cambio se ve de inmediato en la vista pública.
 * Las invitaciones pendientes se pueden reenviar, cancelar o copiar su enlace.
 * Agregar o retirar solo se permite con el evento en configuración o habilitado; editar la
 * trayectoria se permite siempre. El padre debe montarlo con una `key` distinta por evento.
 * @module features/conferencistas/components/ConferencistasModal
 */

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  customClass: { popup: 'rounded-[16px]', confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm' },
};

const VISTA_LISTA = { tipo: 'lista' };

const formatoFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/** "2026-10-22T09:30:00" → "22 oct, 9:30 a. m." */
function fechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? '—' : formatoFechaHora.format(fecha).replace('.', '');
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object} props.evento - { id, nombre, semestre, estado }
 * @param {typeof import('../../../api/conferencistaService').conferencistaService} props.api
 * @param {function(): void} props.onClose
 */
export default function ConferencistasModal({ isOpen, evento, api, onClose }) {
  const [conferencistas, setConferencistas] = useState(null);
  const [invitaciones, setInvitaciones] = useState([]);
  const [errorCarga, setErrorCarga] = useState(false);
  const [version, setVersion] = useState(0);
  const [vista, setVista] = useState(VISTA_LISTA);
  const [aviso, setAviso] = useState(null);
  const [ocupadoId, setOcupadoId] = useState(null);
  // Perfil cargado para editar: { personaId, datos } | { personaId, error }
  const [perfilEdicion, setPerfilEdicion] = useState(null);

  const eventoId = evento?.id;
  const modificable = puedeAsociarConferencistas(evento);
  const publico = esEventoPublico(evento);
  const personaEditada = vista.tipo === 'editar' ? vista.personaId : null;

  useEffect(() => {
    if (!isOpen || !eventoId) return undefined;
    let activo = true;
    Promise.all([api.listarConferencistas(eventoId), api.listarInvitaciones(eventoId).catch(() => [])])
      .then(([lista, pendientes]) => {
        if (!activo) return;
        setConferencistas(Array.isArray(lista) ? lista : []);
        setInvitaciones(Array.isArray(pendientes) ? pendientes : []);
        setErrorCarga(false);
      })
      .catch(() => {
        if (activo) setErrorCarga(true);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, version, api]);

  useEffect(() => {
    if (!personaEditada) return undefined;
    let activo = true;
    api
      .obtenerPerfilConferencista(personaEditada)
      .then((datos) => {
        if (activo) setPerfilEdicion({ personaId: personaEditada, datos });
      })
      .catch((err) => {
        if (activo) setPerfilEdicion({ personaId: personaEditada, error: extraerError(err).mensaje });
      });
    return () => {
      activo = false;
    };
  }, [personaEditada, api]);

  if (!isOpen || !evento) return null;

  const recargar = () => setVersion((v) => v + 1);
  const volverALista = (mensaje = null) => {
    setAviso(mensaje);
    setVista(VISTA_LISTA);
    setPerfilEdicion(null);
  };

  const alInvitar = (invitacion) => {
    volverALista(
      `Se envió la invitación a ${invitacion.correo}. ${invitacion.nombre} tiene hasta el ${fechaHora(invitacion.fechaExpiracion)} para registrar sus datos.`
    );
    recargar();
  };

  const alAsociar = (asociado) => {
    volverALista(`${asociado.nombreCompleto} se vinculó al evento con su trayectoria registrada.`);
    recargar();
  };

  const alActualizar = (perfil) => {
    const publicos = eventosConVistaPublica(perfil);
    volverALista(
      publicos.length > 0
        ? `Cambios guardados. La trayectoria de ${perfil.nombreCompleto} ya se ve actualizada en la vista pública de: ${publicos.join(', ')}.`
        : `Cambios guardados para ${perfil.nombreCompleto}.`
    );
    recargar();
  };

  const avisarError = (titulo, err) =>
    Swal.fire({ ...ESTILO_SWAL, icon: 'error', title: titulo, text: extraerError(err).mensaje, confirmButtonText: 'Entendido' });

  const retirar = async (c) => {
    const { isConfirmed } = await Swal.fire({
      ...ESTILO_SWAL,
      icon: 'question',
      title: `¿Retirar a ${c.nombreCompleto} del evento?`,
      text: 'Dejará de aparecer entre los conferencistas de este evento. Sus datos y su trayectoria se conservan para otros eventos.',
      showCancelButton: true,
      confirmButtonText: 'Retirar del evento',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!isConfirmed) return;

    setAviso(null);
    setOcupadoId(`p-${c.participacionId}`);
    try {
      await api.retirarConferencista(evento.id, c.participacionId);
      setAviso(`${c.nombreCompleto} se retiró del evento. Su perfil y trayectoria se conservan.`);
      recargar();
    } catch (err) {
      avisarError('No se pudo retirar al conferencista', err);
    } finally {
      setOcupadoId(null);
    }
  };

  const reenviar = async (inv) => {
    setAviso(null);
    setOcupadoId(`i-${inv.id}`);
    try {
      const nueva = await api.reenviarInvitacion(evento.id, inv.id);
      setAviso(`Se reenvió la invitación a ${nueva.correo} con un enlace nuevo, vigente hasta el ${fechaHora(nueva.fechaExpiracion)}.`);
      recargar();
    } catch (err) {
      avisarError('No se pudo reenviar la invitación', err);
    } finally {
      setOcupadoId(null);
    }
  };

  const cancelarInvitacion = async (inv) => {
    const { isConfirmed } = await Swal.fire({
      ...ESTILO_SWAL,
      icon: 'question',
      title: `¿Cancelar la invitación a ${inv.nombre}?`,
      text: 'El enlace que recibió dejará de funcionar.',
      showCancelButton: true,
      confirmButtonText: 'Cancelar invitación',
      cancelButtonText: 'Volver',
      reverseButtons: true,
    });
    if (!isConfirmed) return;
    setAviso(null);
    setOcupadoId(`i-${inv.id}`);
    try {
      await api.cancelarInvitacion(evento.id, inv.id);
      setAviso(`Se canceló la invitación a ${inv.correo}.`);
      recargar();
    } catch (err) {
      avisarError('No se pudo cancelar la invitación', err);
    } finally {
      setOcupadoId(null);
    }
  };

  const copiarEnlace = async (inv) => {
    try {
      await navigator.clipboard.writeText(inv.enlace);
      setAviso(`Enlace de ${inv.nombre} copiado. Puedes enviarlo por otro medio si el correo no le llegó.`);
    } catch {
      window.prompt('Copia el enlace de la invitación:', inv.enlace);
    }
  };

  const subtitulo = `${evento.nombre}${evento.semestre ? ` (${evento.semestre})` : ''}`;
  const titulos = {
    lista: 'Conferencistas',
    agregar: 'Agregar conferencista',
    asociar: 'Vincular conferencista registrado',
    editar: 'Datos y trayectoria del conferencista',
  };

  const botonVolver = vista.tipo !== 'lista' && (
    <button
      type="button"
      onClick={() => (vista.tipo === 'asociar' ? setVista({ tipo: 'agregar' }) : volverALista())}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 cursor-pointer mb-5"
    >
      <ArrowLeft className="w-4 h-4" />
      {vista.tipo === 'asociar' ? 'Volver a agregar conferencista' : 'Volver a la lista'}
    </button>
  );

  let contenido;
  if (vista.tipo === 'agregar') {
    contenido = (
      <AgregarConferencistaPanel
        eventoId={evento.id}
        api={api}
        onVincular={(c) => setVista({ tipo: 'asociar', coincidencia: { ...c, tienePerfil: c.tienePerfil ?? true } })}
        onInvitado={alInvitar}
      />
    );
  } else if (vista.tipo === 'asociar') {
    contenido = (
      <AsociarConferencistaPanel
        coincidencia={vista.coincidencia}
        eventoId={evento.id}
        api={api}
        onAsociado={alAsociar}
        onCancelar={() => setVista({ tipo: 'agregar' })}
      />
    );
  } else if (vista.tipo === 'editar') {
    const listo = perfilEdicion?.personaId === vista.personaId;
    if (!listo) {
      contenido = (
        <p className="py-10 text-center text-sm text-ink-600" role="status">
          Cargando datos del conferencista...
        </p>
      );
    } else if (perfilEdicion.error) {
      contenido = (
        <p className="p-4 rounded-[12px] bg-brand-100 text-sm text-brand-700" role="alert">
          {perfilEdicion.error}
        </p>
      );
    } else {
      const perfil = perfilEdicion.datos;
      contenido = (
        <ConferencistaForm
          key={vista.personaId}
          modo="editar"
          perfil={perfil}
          correoBloqueado={Boolean(perfil.tieneCuentaUsuario)}
          ayudaCorreo="Es el correo con el que se inicia sesión en SIGEA; no se cambia desde aquí."
          enviar={(form) => api.actualizarConferencista(perfil.personaId, aActualizarRequest(form))}
          onGuardado={alActualizar}
          onCancelar={() => volverALista()}
        />
      );
    }
  } else {
    contenido = (
      <ListaConferencistas
        evento={evento}
        conferencistas={conferencistas}
        invitaciones={invitaciones}
        errorCarga={errorCarga}
        modificable={modificable}
        publico={publico}
        aviso={aviso}
        ocupadoId={ocupadoId}
        onRecargar={recargar}
        onAgregar={() => {
          setAviso(null);
          setVista({ tipo: 'agregar' });
        }}
        onEditar={(c) => {
          setAviso(null);
          setVista({ tipo: 'editar', personaId: c.personaId });
        }}
        onRetirar={retirar}
        onReenviar={reenviar}
        onCancelarInvitacion={cancelarInvitacion}
        onCopiarEnlace={copiarEnlace}
      />
    );
  }

  return (
    <ModalShell
      titulo={titulos[vista.tipo]}
      subtitulo={subtitulo}
      icono={Mic}
      onClose={onClose}
      ancho="max-w-4xl"
      tituloId="conferencistas-titulo"
      pie={
        vista.tipo === 'lista' ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        ) : null
      }
    >
      {botonVolver}
      {contenido}
    </ModalShell>
  );
}

/**
 * Tabla de conferencistas del evento (vista inicial del modal).
 */
function ListaConferencistas({
  evento,
  conferencistas,
  invitaciones,
  errorCarga,
  modificable,
  publico,
  aviso,
  ocupadoId,
  onRecargar,
  onAgregar,
  onEditar,
  onRetirar,
  onReenviar,
  onCancelarInvitacion,
  onCopiarEnlace,
}) {
  const total = conferencistas?.length ?? 0;
  const columnas = 4;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <EstadoEventoBadge estado={evento.estado} />
          <p className="text-sm text-ink-600" role="status">
            {conferencistas ? `${total} ${total === 1 ? 'conferencista' : 'conferencistas'}` : 'Cargando conferencistas...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {publico && (
            <Link
              to={`/eventos/${evento.id}/conferencistas-publicos`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Ver vista pública
            </Link>
          )}
          {modificable && (
            <Button type="button" variant="primary" onClick={onAgregar}>
              <UserPlus className="w-4 h-4" />
              <span>Agregar conferencista</span>
            </Button>
          )}
        </div>
      </div>

      {!modificable && (
        <div className="flex items-start gap-3 p-4 rounded-[12px] bg-brand-100 text-brand-700" role="note">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{motivoAsociacionBloqueada(evento)}</p>
        </div>
      )}

      {aviso && (
        <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px]" role="status">
          {aviso}
        </p>
      )}

      <div className="overflow-hidden rounded-[12px] border border-border bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted border-b border-border text-xs font-bold text-ink-900 uppercase tracking-wider">
              <th scope="col" className="py-3 px-4">Conferencista</th>
              <th scope="col" className="py-3 px-4">Participación</th>
              <th scope="col" className="py-3 px-4">Trayectoria</th>
              <th scope="col" className="py-3 px-4 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm text-ink-900">
            {errorCarga && (
              <tr>
                <td colSpan={columnas} className="py-10 px-4 text-center">
                  <p className="font-semibold text-ink-900">No se pudieron cargar los conferencistas</p>
                  <button
                    type="button"
                    onClick={onRecargar}
                    className="text-xs mt-1 text-brand-600 font-semibold underline cursor-pointer"
                  >
                    Reintentar
                  </button>
                </td>
              </tr>
            )}

            {!errorCarga && !conferencistas && (
              <tr>
                <td colSpan={columnas} className="py-10 px-4 text-center text-ink-600" role="status">
                  Cargando conferencistas...
                </td>
              </tr>
            )}

            {!errorCarga && conferencistas?.length === 0 && (
              <tr>
                <td colSpan={columnas} className="py-10 px-4 text-center">
                  <p className="font-semibold text-ink-900">Este evento todavía no tiene conferencistas</p>
                  {modificable && (
                    <p className="text-xs mt-1 text-ink-600">
                      Agrega uno de los conferencistas registrados o invita a uno nuevo con su nombre y correo.
                    </p>
                  )}
                </td>
              </tr>
            )}

            {!errorCarga &&
              conferencistas?.map((c) => (
                <tr key={c.participacionId}>
                  <td className="py-3.5 px-4 align-top">
                    <p className="font-semibold text-ink-900">{c.nombreCompleto}</p>
                    <p className="text-xs text-ink-600 mt-0.5">
                      {c.tipoDocumento} {c.numeroDocumento}
                    </p>
                    <p className="text-xs text-ink-600">
                      {c.correo}
                      {c.telefono ? ` · ${c.telefono}` : ''}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-100 text-brand-700 border border-brand-600">
                      {etiquetaParticipacion(c.tipoParticipacion)}
                    </span>
                    {c.tema && <p className="text-xs text-ink-900 mt-1.5 max-w-[220px]">{c.tema}</p>}
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    {c.tienePerfil ? (
                      <>
                        <p className="text-ink-900">{[c.cargoActual, c.institucion].filter(Boolean).join(' · ') || 'Biografía registrada'}</p>
                        <p className="text-xs text-ink-600 mt-0.5">
                          Actualizada el {formatearFecha(fechaCorta(c.fechaActualizacionTrayectoria))}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-brand-700">Sin trayectoria registrada</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditar(c)}
                        title={`Editar datos y trayectoria de ${c.nombreCompleto}`}
                        aria-label={`Editar datos y trayectoria de ${c.nombreCompleto}`}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-[8px] border border-field-border text-ink-600 bg-white hover:bg-surface-muted hover:text-ink-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {modificable && (
                        <button
                          type="button"
                          onClick={() => onRetirar(c)}
                          disabled={ocupadoId !== null}
                          title={`Retirar a ${c.nombreCompleto} del evento`}
                          aria-label={`Retirar a ${c.nombreCompleto} del evento`}
                          className="w-9 h-9 inline-flex items-center justify-center rounded-[8px] border border-brand-600 text-brand-600 bg-brand-100 hover:bg-brand-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {invitaciones.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Invitaciones pendientes ({invitaciones.length})
          </h3>
          <ul className="divide-y divide-border rounded-[12px] border border-border bg-white">
            {invitaciones.map((inv) => {
              const vencida = inv.estado === 'vencida';
              const ocupada = ocupadoId === `i-${inv.id}`;
              return (
                <li key={inv.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{inv.nombre}</p>
                    <p className="text-xs text-ink-600 truncate">{inv.correo}</p>
                    <p className="text-[11px] mt-0.5 text-ink-600">
                      Enviada el {fechaHora(inv.fechaEnvio)} ·{' '}
                      {vencida ? (
                        <span className="font-semibold text-brand-700">venció el {fechaHora(inv.fechaExpiracion)}</span>
                      ) : (
                        <span>vence el {fechaHora(inv.fechaExpiracion)}</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      vencida
                        ? 'bg-brand-100 text-brand-700 border-brand-600'
                        : 'bg-surface-muted text-ink-600 border-border'
                    }`}
                  >
                    {vencida ? 'Vencida' : 'Esperando registro'}
                  </span>
                  <div className="flex items-center gap-2">
                    {!vencida && (
                      <button
                        type="button"
                        onClick={() => onCopiarEnlace(inv)}
                        title="Copiar enlace de la invitación"
                        aria-label={`Copiar enlace de la invitación de ${inv.nombre}`}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-[8px] border border-field-border text-ink-600 bg-white hover:bg-surface-muted hover:text-ink-900 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    {modificable && (
                      <button
                        type="button"
                        onClick={() => onReenviar(inv)}
                        disabled={ocupadoId !== null}
                        title="Reenviar invitación con un enlace nuevo"
                        aria-label={`Reenviar invitación a ${inv.nombre}`}
                        className="h-9 px-3 inline-flex items-center gap-1.5 rounded-[8px] border border-field-border text-xs font-semibold text-ink-900 bg-white hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${ocupada ? 'animate-spin' : ''}`} />
                        Reenviar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onCancelarInvitacion(inv)}
                      disabled={ocupadoId !== null}
                      title="Cancelar invitación"
                      aria-label={`Cancelar invitación de ${inv.nombre}`}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-[8px] border border-brand-600 text-brand-600 bg-brand-100 hover:bg-brand-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-ink-600">
            Cuando el invitado registre sus datos, aparecerá automáticamente en la lista de conferencistas.
          </p>
        </section>
      )}
    </div>
  );
}
