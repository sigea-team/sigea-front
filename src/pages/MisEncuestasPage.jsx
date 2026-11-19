import { useEffect, useState } from 'react';
import { CheckCheck, ClipboardList, Info, Lock, RotateCw, Send, UserRound } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import ResponderEncuestaModal from '../features/encuestas/components/ResponderEncuestaModal';
import { encuestaService } from '../api/encuestaService';
import {
  filtrarMisEncuestas,
  formatearFechaHora,
  interpretarErrorEncuesta,
  ordenarMisEncuestas,
  plural,
  situacionParticipante,
  textoAlcance,
} from '../features/encuestas/encuestaUtils';

/**
 * @file MisEncuestasPage.jsx
 * @description Encuestas de satisfacción del participante (HU-25: RF46, CU-22). Lista las encuestas publicadas de
 * los eventos y actividades a los que asistió (Criterio 1) que todavía puede responder, y las que ya respondió.
 * Las de eventos o actividades a los que no asistió no aparecen (Criterio 3). Desde aquí responde cada encuesta
 * (Criterio 2).
 * Ruta: /mis-encuestas
 * @module pages/MisEncuestasPage
 */

/**
 * @param {Object} props
 * @param {typeof encuestaService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 * @param {Function} [props.onSelectNav]
 */
export default function MisEncuestasPage({ api = encuestaService, usuarioProp, onSelectNav }) {
  const [encuestas, setEncuestas] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const [abierta, setAbierta] = useState(null); // encuesta que se está respondiendo
  const [aviso, setAviso] = useState(null);
  // Hora de referencia para saber si una encuesta venció mientras la página está abierta; se renueva cada 30 s.
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let activo = true;
    api
      .listarMisEncuestas()
      .then((lista) => {
        if (!activo) return;
        setEncuestas(lista);
        setAhora(new Date());
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(interpretarErrorEncuesta(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, version]);

  const recargar = () => setVersion((v) => v + 1);

  const reintentar = () => {
    setError(null);
    setEncuestas(null);
    recargar();
  };

  const visibles = encuestas ? ordenarMisEncuestas(filtrarMisEncuestas(encuestas, ahora), ahora) : null;
  const pendientes = (visibles || []).filter((e) => situacionParticipante(e, ahora).id === 'pendiente').length;

  const abrir = (e) => {
    const momento = new Date();
    // Pudo vencer entre la última revisión y el clic: no se abre y se refresca la lista.
    if (situacionParticipante(e, momento).id !== 'pendiente') {
      setAviso(`La encuesta «${e.titulo}» ya no recibe respuestas.`);
      setAhora(momento);
      recargar();
      return;
    }
    setAviso(null);
    setAbierta(e);
  };

  return (
    <MainLayout title="Mis encuestas" activeNav="mis-encuestas" onSelectNav={onSelectNav} usuario={usuarioProp}>
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
            SIGEA — Encuestas de satisfacción
          </span>
          <h2 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-1 tracking-tight">Mis encuestas</h2>
          <p className="text-sm text-ink-600 mt-1 max-w-2xl">
            Aquí aparecen las encuestas de los eventos y actividades a los que asististe. Tu opinión ayuda a mejorar los
            próximos eventos.
          </p>
        </div>

        {aviso && (
          <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px] flex items-center gap-2" role="status">
            <CheckCheck className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
            {aviso}
          </p>
        )}

        {error && (
          <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm flex items-center justify-between gap-4" role="alert">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer">
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        )}

        {!error && !encuestas && (
          <p className="text-sm text-ink-600 py-6 text-center" role="status">Cargando encuestas...</p>
        )}

        {!error && visibles && visibles.length === 0 && (
          <div className="p-8 rounded-[12px] border border-dashed border-field-border bg-white text-center space-y-1">
            <p className="text-sm font-semibold text-ink-900">No tienes encuestas por responder.</p>
            <p className="text-sm text-ink-600">
              Las encuestas se habilitan cuando registras tu asistencia a un evento o actividad con tu código QR.
            </p>
          </div>
        )}

        {!error && visibles && visibles.length > 0 && (
          <>
            <p className="text-sm text-ink-600">
              {pendientes > 0 ? `Tienes ${plural(pendientes, 'encuesta')} por responder.` : 'Ya respondiste todas tus encuestas.'}
            </p>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visibles.map((e) => {
                const situacion = situacionParticipante(e, ahora);
                return (
                  <li key={e.encuestaId} className="p-5 rounded-[12px] border border-border bg-white flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-ink-600 truncate">{e.eventoNombre}</p>
                        <p className="font-semibold text-ink-900 mt-0.5">{e.titulo}</p>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${situacion.clases}`}>
                        {situacion.etiqueta}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{textoAlcance(e)}</span>
                      <span className="inline-flex items-center gap-1">
                        {e.anonima ? <Lock className="w-3.5 h-3.5" aria-hidden="true" /> : <UserRound className="w-3.5 h-3.5" aria-hidden="true" />}
                        {e.anonima ? 'Anónima' : 'Identificada'}
                      </span>
                      <span>{plural(e.totalPreguntas || 0, 'pregunta')}</span>
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-auto pt-1">
                      <p className="text-xs text-ink-600">
                        {situacion.id === 'respondida'
                          ? `Respondida el ${formatearFechaHora(e.fechaRespuesta)}`
                          : e.fechaCierre
                          ? `Disponible hasta el ${formatearFechaHora(e.fechaCierre)}`
                          : 'Disponible mientras esté publicada'}
                      </p>
                      {situacion.id === 'pendiente' && (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => abrir(e)}
                          className="h-9 px-3 text-xs shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" aria-hidden="true" />
                          Responder
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {abierta && (
        <ResponderEncuestaModal
          key={`responder-${abierta.encuestaId}`}
          encuestaId={abierta.encuestaId}
          titulo={abierta.titulo}
          api={api}
          onClose={() => setAbierta(null)}
          onRespondida={(mensaje) => {
            if (mensaje) setAviso(mensaje);
            recargar();
          }}
        />
      )}
    </MainLayout>
  );
}
