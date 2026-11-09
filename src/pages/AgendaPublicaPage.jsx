import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building, CalendarDays, Clock, Info, Layers, LayoutDashboard, LogIn, MapPin, RotateCw, User } from 'lucide-react';
import Footer from '../components/ui/Footer';
import { agendaService } from '../api/agendaService';
import { useAuthStore } from '../store/authStore';
import { extraerError } from '../features/eventos/eventoUtils';
import { formatearHora } from '../features/agenda/agendaUtils';
import { tituloDia } from '../features/agenda/agendaPublicacionUtils';

/**
 * @file AgendaPublicaPage.jsx
 * @description Agenda publicada del evento, organizada por día y hora (HU-22, Criterio 3). No requiere sesión.
 * Cada vez que se abre consulta la versión vigente, así que los cambios que se hagan después de publicar se ven de
 * inmediato. Ruta: /eventos/:eventoId/agenda-publica
 * @module pages/AgendaPublicaPage
 */

const MODALIDAD = { presencial: 'Presencial', virtual: 'Virtual', hibrida: 'Híbrida' };

/**
 * @param {Object} props
 * @param {{ obtenerAgendaPublica: Function }} [props.api] - Cliente de API (inyectable para Storybook).
 * @param {number|string} [props.eventoId] - Por defecto se toma de la URL.
 */
export default function AgendaPublicaPage({ api = agendaService, eventoId: eventoIdProp }) {
  const params = useParams();
  const eventoId = eventoIdProp ?? params.eventoId;
  const conSesion = Boolean(useAuthStore((state) => state.token));

  // { eventoId, datos } | { eventoId, error }: se guarda el evento para no mostrar datos de otro.
  const [resultado, setResultado] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    api
      .obtenerAgendaPublica(eventoId)
      .then((datos) => activo && setResultado({ eventoId, datos }))
      .catch((err) => {
        if (!activo) return;
        const { status, mensaje } = extraerError(err);
        setResultado({
          eventoId,
          error: status === 404 ? 'La agenda de este evento todavía no está publicada.' : mensaje,
          reintentable: status !== 404,
        });
      });
    return () => {
      activo = false;
    };
  }, [api, eventoId, version]);

  const actual = resultado?.eventoId === eventoId ? resultado : null;
  const agenda = actual?.datos;
  const dias = agenda?.dias || [];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f7f7f8] text-[#1f2023] font-sans antialiased">
      <header className="h-16 px-8 bg-white border-b border-[#e5e7ea] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#a6192e] flex items-center justify-center">
            <span className="text-white font-bold text-[11px] tracking-tight">UFPS</span>
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-[#a6192e]">SIGEA</p>
            <p className="text-[11px] text-[#5b5f66]">Sistema Integral de Gestión de Eventos Académicos</p>
          </div>
        </div>
        <Link
          to={conSesion ? '/dashboard' : '/login'}
          className="h-10 px-4 rounded-[8px] border border-[#d8dadf] text-sm font-medium text-[#1f2023] hover:bg-[#f7f7f8] inline-flex items-center gap-2 transition-colors"
        >
          {conSesion ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {conSesion ? 'Ir a mi panel' : 'Iniciar sesión'}
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-8 py-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Agenda del evento
          </span>
          <h1 className="font-serif-title text-3xl text-[#1f2023] mt-1 tracking-tight">
            {agenda?.eventoNombre || 'Agenda'}
          </h1>
          {agenda?.fechaPublicacion && (
            <p className="text-sm text-[#5b5f66] mt-1">
              Actualizada el {new Date(agenda.fechaPublicacion).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          )}
        </div>

        {!actual && (
          <p className="py-12 text-center text-sm text-[#5b5f66]" role="status">
            Cargando agenda...
          </p>
        )}

        {actual?.error && (
          <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#a6192e] shrink-0" />
              <span>{actual.error}</span>
            </div>
            {actual.reintentable && (
              <button
                type="button"
                onClick={() => setVersion((v) => v + 1)}
                className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
            )}
          </div>
        )}

        {agenda && dias.length === 0 && (
          <div className="py-12 text-center bg-white rounded-[16px] border border-[#e5e7ea]">
            <p className="font-semibold text-base text-[#1f2023]">Aún no hay actividades en la agenda</p>
            <p className="text-xs mt-1 text-[#5b5f66]">Vuelve pronto: aquí aparecerá la programación del evento.</p>
          </div>
        )}

        {dias.length > 1 && (
          <nav aria-label="Días del evento" className="flex flex-wrap gap-2">
            {dias.map((d) => (
              <a
                key={d.fecha}
                href={`#dia-${d.fecha}`}
                onClick={(e) => {
                  // HashRouter: el ancla no debe cambiar la ruta.
                  e.preventDefault();
                  document.getElementById(`dia-${d.fecha}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-full border border-[#e5e7ea] bg-white text-xs font-medium text-[#1f2023] hover:bg-[#fdecec] hover:text-[#a6192e]"
              >
                {tituloDia(d.fecha)}
              </a>
            ))}
          </nav>
        )}

        {dias.map((d) => (
          <section
            key={d.fecha}
            id={`dia-${d.fecha}`}
            aria-labelledby={`titulo-${d.fecha}`}
            className="bg-white rounded-[16px] border border-[#e5e7ea] overflow-hidden scroll-mt-6"
          >
            <h2
              id={`titulo-${d.fecha}`}
              className="px-6 py-4 border-b border-[#e5e7ea] text-base font-semibold text-[#1f2023] flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4 text-[#a6192e]" />
              {tituloDia(d.fecha)}
            </h2>
            <ol className="divide-y divide-[#e5e7ea]">
              {d.actividades.map((a) => (
                <li key={a.id} className="px-6 py-4 flex gap-5">
                  <div className="w-32 shrink-0 text-sm font-semibold text-[#a6192e] flex items-start gap-1.5 pt-0.5">
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      {formatearHora(a.horaInicio)}
                      <span className="block text-xs font-normal text-[#5b5f66]">a {formatearHora(a.horaFin)}</span>
                    </span>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-[#1f2023]">{a.nombre}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {a.tipoActividad && (
                        <span className="px-2 py-0.5 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] text-[#5b5f66]">
                          {a.tipoActividad}
                        </span>
                      )}
                      {a.modalidad && <span className="text-[#5b5f66]">{MODALIDAD[a.modalidad] || a.modalidad}</span>}
                      {a.lineaTematica && <span className="text-[#5b5f66]">· {a.lineaTematica}</span>}
                      {a.simultanea && (
                        <span className="inline-flex items-center gap-1 text-[#5b5f66]">
                          <Layers className="w-3 h-3" />
                          En paralelo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#5b5f66]">
                      {a.sala && (
                        <span className="inline-flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          {a.sala}
                        </span>
                      )}
                      {a.ubicacion && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {a.ubicacion}
                        </span>
                      )}
                      {a.ponente && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {a.ponente}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
}
