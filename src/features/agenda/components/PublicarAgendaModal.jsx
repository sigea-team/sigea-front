import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Megaphone,
  RefreshCw,
  RotateCw,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import { agendaService } from '../../../api/agendaService';
import { extraerError } from '../../eventos/eventoUtils';
import { formatearHora } from '../agendaUtils';
import { estadoPublicacion, interpretarRechazoPublicacion, textoFaltantes, tituloDia } from '../agendaPublicacionUtils';

/**
 * @file PublicarAgendaModal.jsx
 * @description Revisión y publicación de la agenda (HU-22, Criterios 3 y 4).
 * Al abrir pide la validación al backend: muestra cada día con su estado de publicación, las actividades sin sala u
 * horario (Criterio 4) y los cruces. Solo permite publicar si está completa y sin cruces; si el backend la rechaza
 * (409), muestra lo que devolvió. Se puede volver a publicar después de cambios.
 * @module features/agenda/components/PublicarAgendaModal
 */

/** Tipos de cruce que devuelve el backend (los mismos de HU-21). */
const TIPO_CRUCE = { SALA: 'Misma sala', PONENTE: 'Mismo ponente', HORARIO: 'Mismo horario' };

/**
 * @param {Object} props
 * @param {Object} props.evento
 * @param {Object} [props.api] - Cliente de HU-22 (inyectable para Storybook).
 * @param {() => void} [props.onPublicada] - Se llama tras publicar.
 * @param {() => void} props.onClose
 */
export default function PublicarAgendaModal({ evento, api = agendaService, onPublicada, onClose }) {
  const eventoId = evento?.id;
  const [estado, setEstado] = useState({ cargando: true, validacion: null, error: '' });
  const [version, setVersion] = useState(0);
  const [publicando, setPublicando] = useState(false);
  const [rechazo, setRechazo] = useState(null);

  useEffect(() => {
    let activo = true;
    api
      .validar(eventoId)
      .then((validacion) => activo && setEstado({ cargando: false, validacion, error: '' }))
      .catch((err) => activo && setEstado({ cargando: false, validacion: null, error: extraerError(err).mensaje }));
    return () => {
      activo = false;
    };
  }, [api, eventoId, version]);

  const recargar = () => {
    setEstado((e) => ({ ...e, cargando: true }));
    setVersion((v) => v + 1);
  };

  const publicar = async () => {
    setPublicando(true);
    setRechazo(null);
    try {
      const r = await api.publicar(eventoId);
      onPublicada?.(r);
      recargar();
      Swal.fire({
        icon: 'success',
        title: 'Agenda publicada',
        text: `Los participantes ya ven ${r.totalActividades} ${r.totalActividades === 1 ? 'actividad' : 'actividades'} en ${
          r.diasPublicados.length
        } ${r.diasPublicados.length === 1 ? 'día' : 'días'}. Si cambias una actividad, se avisará a sus inscritos.`,
        confirmButtonColor: '#a6192e',
        customClass: { popup: 'rounded-[16px]', confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm' },
      });
    } catch (err) {
      const r = interpretarRechazoPublicacion(err);
      setRechazo(r || { mensaje: extraerError(err).mensaje, incompletas: [], conflictos: [] });
      recargar();
    } finally {
      setPublicando(false);
    }
  };

  const v = estado.validacion;
  // Tras un rechazo se muestran sus listas (las más recientes); si no, las de la validación.
  const incompletas = rechazo?.incompletas?.length ? rechazo.incompletas : v?.incompletas || [];
  const conflictos = rechazo?.conflictos?.length ? rechazo.conflictos : v?.conflictos || [];
  const etiqueta = estadoPublicacion(v);
  const rutaPublica = `/eventos/${eventoId}/agenda-publica`;

  return (
    <ModalShell
      titulo={v?.publicada ? 'Publicación de la agenda' : 'Publicar agenda'}
      subtitulo={`${evento?.nombre || 'Evento'} · los participantes la verán organizada por día y hora (HU-22)`}
      icono={Megaphone}
      onClose={onClose}
      ancho="max-w-3xl"
      tituloId="publicar-agenda-titulo"
      pie={
        <>
          {v?.publicada && (
            <Link
              to={rutaPublica}
              target="_blank"
              rel="noreferrer"
              className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#a6192e] hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Ver agenda pública
            </Link>
          )}
          <Button type="button" variant="outline" onClick={onClose} disabled={publicando}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={publicar}
            disabled={publicando || estado.cargando || !v?.puedePublicar}
            title={v && !v.puedePublicar ? v.motivoNoPublicable : undefined}
          >
            <Megaphone className="w-4 h-4" />
            {publicando ? 'Publicando...' : v?.publicada ? 'Volver a publicar' : 'Publicar agenda'}
          </Button>
        </>
      }
    >
      {estado.cargando && !v ? (
        <p className="py-12 text-center text-sm text-[#5b5f66]" role="status">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#a6192e]" />
          Revisando la agenda...
        </p>
      ) : estado.error ? (
        <div role="alert" className="p-4 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-sm flex items-center justify-between gap-3">
          <span>{estado.error}</span>
          <button type="button" onClick={recargar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer">
            <RotateCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Estado general */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                etiqueta.tono === 'publicada'
                  ? 'bg-[#1f2023] text-white'
                  : etiqueta.tono === 'parcial'
                    ? 'bg-[#fdecec] text-[#7a0c1e]'
                    : 'bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]'
              }`}
            >
              {etiqueta.texto}
            </span>
            <span className="text-sm text-[#5b5f66]">
              {v.totalActividades} {v.totalActividades === 1 ? 'actividad programada' : 'actividades programadas'}
              {v.fechaPublicacion && ` · última publicación ${new Date(v.fechaPublicacion).toLocaleString('es-CO')}`}
            </span>
          </div>

          {(rechazo || !v.puedePublicar) && (
            <p role="alert" className="p-3 rounded-[8px] bg-[#fdecec] text-[#7a0c1e] text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#a6192e]" />
              <span>
                <span className="font-semibold">No se puede publicar todavía. </span>
                {rechazo?.mensaje || v.motivoNoPublicable}
              </span>
            </p>
          )}

          {v.puedePublicar && !rechazo && (
            <p className="p-3 rounded-[8px] bg-[#f7f7f8] border border-[#e5e7ea] text-sm text-[#1f2023] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#a6192e]" />
              Todas las actividades tienen sala y horario, y no hay cruces. La agenda está lista para publicarse.
            </p>
          )}

          {/* Criterio 4: actividades sin sala u horario */}
          {incompletas.length > 0 && (
            <section aria-labelledby="agenda-incompletas">
              <h3 id="agenda-incompletas" className="text-sm font-bold text-[#1f2023] mb-2">
                Sin sala u horario asignado ({incompletas.length})
              </h3>
              <ul className="divide-y divide-[#e5e7ea] rounded-[16px] border border-[#e5e7ea] bg-white">
                {incompletas.map((a) => (
                  <li key={a.actividadId} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[#1f2023]">{a.nombre}</span>
                    <span className="text-xs text-[#7a0c1e]">Falta {textoFaltantes(a.faltantes)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[#5b5f66] mt-2">
                Ubícalas con «Generar agenda», asígnalas a mano o elimínalas.
              </p>
            </section>
          )}

          {/* Cruces */}
          {conflictos.length > 0 && (
            <section aria-labelledby="agenda-conflictos">
              <h3 id="agenda-conflictos" className="text-sm font-bold text-[#1f2023] mb-2">
                Cruces entre actividades ({conflictos.length})
              </h3>
              <ul className="space-y-2">
                {conflictos.map((c, i) => (
                  <li key={`${c.actividadId}-${c.conflicto?.actividadId}-${c.conflicto?.tipo}-${i}`}
                    className="px-4 py-2.5 rounded-[16px] border border-[#a6192e]/20 bg-white text-sm">
                    <p className="font-medium text-[#1f2023]">
                      «{c.actividadNombre}» y «{c.conflicto?.actividadNombre}»
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-[#fdecec] text-[11px] font-semibold text-[#7a0c1e]">
                        {TIPO_CRUCE[c.conflicto?.tipo] || 'Cruce'}
                      </span>
                    </p>
                    <p className="text-xs text-[#5b5f66] mt-0.5">
                      {c.conflicto?.fecha && `${tituloDia(c.conflicto.fecha)}, `}
                      {formatearHora(c.conflicto?.horaInicio)} – {formatearHora(c.conflicto?.horaFin)} · {c.conflicto?.mensaje}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Días */}
          {v.dias?.length > 0 && (
            <section aria-labelledby="agenda-dias">
              <h3 id="agenda-dias" className="text-sm font-bold text-[#1f2023] mb-2">Días de la agenda</h3>
              <ul className="divide-y divide-[#e5e7ea] rounded-[16px] border border-[#e5e7ea] bg-white">
                {v.dias.map((d) => (
                  <li key={d.fecha} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-[#1f2023]">
                      <CalendarDays className="w-4 h-4 text-[#5b5f66]" />
                      {tituloDia(d.fecha)}
                    </span>
                    <span className="text-xs text-[#5b5f66]">
                      {d.actividades} {d.actividades === 1 ? 'actividad' : 'actividades'} ·{' '}
                      <span className={d.estado === 'publicada' ? 'font-semibold text-[#1f2023]' : ''}>
                        {d.estado === 'publicada'
                          ? d.actividades === 0 ? 'Publicado (se retirará al volver a publicar)' : 'Publicado'
                          : 'Sin publicar'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {v.publicada && (
            <p className="text-xs text-[#5b5f66]">
              Con la agenda publicada, si cambias el horario, la sala o el ponente de una actividad (o la retiras), el
              sistema avisa a los inscritos en ella.
            </p>
          )}
        </div>
      )}
    </ModalShell>
  );
}
