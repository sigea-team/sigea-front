import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ExternalLink, Hourglass, Megaphone, Sparkles, Wand2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import GenerarAgendaModal from './GenerarAgendaModal';
import PublicarAgendaModal from './PublicarAgendaModal';
import { agendaService } from '../../../api/agendaService';
import { actividadService } from '../../../api/actividadService';
import { estadoPublicacion, separarActividades } from '../agendaPublicacionUtils';

/**
 * @file AgendaGeneracionPanel.jsx
 * @description Franja de la HU-22 sobre la agenda de HU-21: cuántas actividades faltan por ubicar, cuántas puso la
 * generación automática, el estado de publicación y los accesos a «Generar agenda», «Publicar agenda» y la vista
 * pública. Abre y cierra sus propios modales, montados en `document.body` para que no queden dentro del modal de
 * agenda que se abre desde Eventos.
 * @module features/agenda/components/AgendaGeneracionPanel
 */

/**
 * @param {Object} props
 * @param {Object} props.evento
 * @param {Array<Object>} props.actividades - Todas las actividades del evento (con y sin horario).
 * @param {Array<Object>} [props.tiposActividad]
 * @param {Array<Object>} [props.ponentes]
 * @param {number} [props.version] - Cambia cuando la pantalla recarga la agenda (vuelve a pedir el estado).
 * @param {Object} [props.api] - Cliente de HU-22 (inyectable para Storybook).
 * @param {Object} [props.apiActividades] - Cliente de HU-21.
 * @param {() => void} props.onCambios - Recargar la agenda de la pantalla.
 * @param {(actividad: Object) => void} [props.onAsignarManual] - Abrir el formulario de HU-21 con la actividad.
 */
export default function AgendaGeneracionPanel({
  evento,
  actividades = [],
  tiposActividad = [],
  ponentes = [],
  version = 0,
  api = agendaService,
  apiActividades = actividadService,
  onCambios,
  onAsignarManual,
}) {
  const [modal, setModal] = useState(null); // null | 'generar' | 'publicar'
  const [validacion, setValidacion] = useState(null);
  const eventoId = evento?.id;

  useEffect(() => {
    if (!eventoId) return undefined;
    let activo = true;
    api
      .validar(eventoId)
      .then((v) => activo && setValidacion(v))
      .catch(() => activo && setValidacion(null));
    return () => {
      activo = false;
    };
  }, [api, eventoId, version]);

  const { porProgramar, programadas } = separarActividades(actividades);
  const automaticas = programadas.filter((a) => a.asignacionAutomatica).length;
  const etiqueta = estadoPublicacion(validacion);

  const asignarManual = (act) => {
    setModal(null);
    onAsignarManual?.(act);
  };

  return (
    <>
      <div className="p-4 rounded-[16px] border border-[#e5e7ea] bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-[#1f2023]">
            <Hourglass className="w-4 h-4 text-[#a6192e]" />
            <span className="font-semibold">{porProgramar.length}</span>
            <span className="text-[#5b5f66]">por programar</span>
          </span>
          {automaticas > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[#1f2023]">
              <Sparkles className="w-4 h-4 text-[#a6192e]" />
              <span className="font-semibold">{automaticas}</span>
              <span className="text-[#5b5f66]">ubicadas automáticamente</span>
            </span>
          )}
          {validacion && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                etiqueta.tono === 'publicada'
                  ? 'bg-[#1f2023] text-white'
                  : etiqueta.tono === 'parcial'
                    ? 'bg-[#fdecec] text-[#7a0c1e]'
                    : 'bg-[#f7f7f8] text-[#5b5f66] border border-[#e5e7ea]'
              }`}
              data-testid="estado-publicacion"
            >
              Agenda: {etiqueta.texto.toLowerCase()}
            </span>
          )}
          {validacion?.publicada && (
            <Link
              to={`/eventos/${eventoId}/agenda-publica`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#a6192e] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver agenda pública
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setModal('generar')}>
            <Wand2 className="w-4 h-4" />
            Generar agenda
          </Button>
          <Button type="button" variant="primary" onClick={() => setModal('publicar')}>
            <Megaphone className="w-4 h-4" />
            {validacion?.publicada ? 'Publicación' : 'Publicar agenda'}
          </Button>
        </div>
      </div>

      {modal === 'generar' &&
        createPortal(
          <GenerarAgendaModal
            evento={evento}
            porProgramar={porProgramar}
            automaticas={automaticas}
            tiposActividad={tiposActividad}
            ponentes={ponentes}
            api={api}
            apiActividades={apiActividades}
            onCambios={onCambios}
            onAsignarManual={onAsignarManual ? asignarManual : undefined}
            onClose={() => setModal(null)}
          />,
          document.body
        )}

      {modal === 'publicar' &&
        createPortal(
          <PublicarAgendaModal evento={evento} api={api} onPublicada={onCambios} onClose={() => setModal(null)} />,
          document.body
        )}
    </>
  );
}
