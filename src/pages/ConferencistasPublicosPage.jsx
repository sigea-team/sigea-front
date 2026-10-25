import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Info, LayoutDashboard, LogIn, Mic, RotateCw } from 'lucide-react';
import Footer from '../components/ui/Footer';
import { conferencistaService } from '../api/conferencistaService';
import { useAuthStore } from '../store/authStore';
import ConferencistaPublicoCard from '../features/conferencistas/components/ConferencistaPublicoCard';
import { extraerError, formatearRango } from '../features/eventos/eventoUtils';

/**
 * @file ConferencistasPublicosPage.jsx
 * @description Vista pública de los conferencistas de un evento publicado (HU-12, Criterio 4).
 * No requiere sesión. Cada vez que se abre consulta la trayectoria vigente, de modo que los cambios
 * que haga el organizador se reflejan de inmediato. Ruta: /eventos/:eventoId/conferencistas-publicos
 * @module pages/ConferencistasPublicosPage
 */

/**
 * @param {Object} props
 * @param {{ listarConferencistasPublicos: Function }} [props.api] - Cliente de API (inyectable para Storybook).
 * @param {number|string} [props.eventoId] - Por defecto se toma de la URL.
 */
export default function ConferencistasPublicosPage({ api = conferencistaService, eventoId: eventoIdProp }) {
  const params = useParams();
  const eventoId = eventoIdProp ?? params.eventoId;
  const conSesion = Boolean(useAuthStore((state) => state.token));

  // { eventoId, datos } | { eventoId, error }: se guarda el evento para no mostrar datos de otro.
  const [resultado, setResultado] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    api
      .listarConferencistasPublicos(eventoId)
      .then((datos) => {
        if (activo) setResultado({ eventoId, datos });
      })
      .catch((err) => {
        if (!activo) return;
        const { status, mensaje } = extraerError(err);
        setResultado({
          eventoId,
          error: status === 404 ? 'Este evento no existe o todavía no ha sido publicado.' : mensaje,
          reintentable: status !== 404,
        });
      });
    return () => {
      activo = false;
    };
  }, [api, eventoId, version]);

  const actual = resultado?.eventoId === eventoId ? resultado : null;
  const evento = actual?.datos;
  const conferencistas = evento?.conferencistas || [];

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
            <Mic className="w-3.5 h-3.5" />
            Conferencistas del evento
          </span>
          <h1 className="font-serif-title text-3xl text-[#1f2023] mt-1 tracking-tight">
            {evento?.eventoNombre || 'Conferencistas'}
          </h1>
          {evento && (
            <p className="text-sm text-[#5b5f66] mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {formatearRango(evento.fechaInicio, evento.fechaFin)}
              {evento.semestre ? ` · Semestre ${evento.semestre}` : ''}
            </p>
          )}
        </div>

        {!actual && (
          <p className="py-12 text-center text-sm text-[#5b5f66]" role="status">
            Cargando conferencistas...
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

        {evento && conferencistas.length === 0 && (
          <div className="py-12 text-center bg-white rounded-[16px] border border-[#e5e7ea]">
            <p className="font-semibold text-base text-[#1f2023]">Aún no hay conferencistas confirmados</p>
            <p className="text-xs mt-1 text-[#5b5f66]">Vuelve pronto: aquí aparecerán los invitados del evento.</p>
          </div>
        )}

        <div className="space-y-4">
          {conferencistas.map((c) => (
            <ConferencistaPublicoCard key={c.personaId} conferencista={c} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
