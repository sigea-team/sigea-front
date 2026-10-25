import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, ExternalLink, Link2Off, LogIn, Mic } from 'lucide-react';
import Footer from '../components/ui/Footer';
import { conferencistaService } from '../api/conferencistaService';
import ConferencistaForm from '../features/conferencistas/components/ConferencistaForm';
import { extraerError, formatearRango } from '../features/eventos/eventoUtils';
import {
  aCompletarRequest,
  formularioDesdeInvitacion,
  mensajeInvitacionNoDisponible,
} from '../features/conferencistas/conferencistaUtils';

/**
 * @file ConferencistaInvitacionPage.jsx
 * @description Página a la que llega el conferencista desde el enlace del correo de invitación (HU-12).
 * No requiere sesión: el token del enlace identifica la invitación. El conferencista registra él mismo
 * su documento, teléfono, tema y trayectoria (Criterios 1 y 2); al enviar queda vinculado al evento y
 * su perfil se ve en la página pública (Criterio 4). El enlace vence a los 3 días.
 * Ruta: /conferencista/invitacion?token=...
 * @module pages/ConferencistaInvitacionPage
 */

const formatoVencimiento = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
});

/** Agrega el punto final si el texto no termina ya en uno (p. ej. "9:35 a. m."). */
const conPunto = (texto) => (texto.endsWith('.') ? texto : `${texto}.`);

/**
 * @param {Object} props
 * @param {typeof conferencistaService} [props.api] - Cliente de la API (inyectable para Storybook).
 * @param {string} [props.token] - Por defecto se toma de `?token=` en la URL.
 */
export default function ConferencistaInvitacionPage({ api = conferencistaService, token: tokenProp }) {
  const [searchParams] = useSearchParams();
  const token = tokenProp ?? searchParams.get('token') ?? '';

  // { token, invitacion } | { token, error: { titulo, detalle } }
  const [resultado, setResultado] = useState(null);
  const [completado, setCompletado] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let activo = true;
    api
      .consultarInvitacion(token)
      .then((invitacion) => {
        if (activo) setResultado({ token, invitacion });
      })
      .catch((err) => {
        if (!activo) return;
        const { status, codigo } = extraerError(err);
        setResultado({ token, error: mensajeInvitacionNoDisponible(codigo, status) });
      });
    return () => {
      activo = false;
    };
  }, [api, token]);

  const actual = !token
    ? { error: mensajeInvitacionNoDisponible(undefined, 404) }
    : resultado?.token === token
      ? resultado
      : null;
  const invitacion = actual?.invitacion;

  let contenido;
  if (completado) {
    contenido = (
      <div className="p-8 rounded-[16px] bg-white border border-[#e5e7ea] text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#e8f5ee] text-[#1d6b45] flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="font-serif-title text-2xl text-[#1f2023]">¡Listo, {completado.nombreCompleto}!</h2>
        <p className="text-sm text-[#5b5f66] max-w-lg mx-auto leading-relaxed">
          Tus datos quedaron registrados y ya eres conferencista de <strong>{completado.eventoNombre}</strong>. El
          organizador verá tu perfil y lo usará en la agenda, el material de difusión y la certificación.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {completado.vistaPublicaDisponible && (
            <Link
              to={`/eventos/${completado.eventoId}/conferencistas-publicos`}
              className="h-10 px-4 rounded-[8px] bg-[#a6192e] hover:bg-[#7a0c1e] text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver cómo aparezco en el evento
            </Link>
          )}
          <Link
            to="/login"
            className="h-10 px-4 rounded-[8px] border border-[#d8dadf] text-sm font-medium text-[#1f2023] hover:bg-[#f7f7f8] inline-flex items-center gap-2 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Ir a SIGEA
          </Link>
        </div>
        <p className="text-xs text-[#9ca0a6]">
          Si tienes cuenta en SIGEA, podrás actualizar tu trayectoria ingresando con el perfil «Conferencista».
        </p>
      </div>
    );
  } else if (!actual) {
    contenido = (
      <p className="py-12 text-center text-sm text-[#5b5f66]" role="status">
        Cargando tu invitación...
      </p>
    );
  } else if (actual.error) {
    contenido = (
      <div className="p-8 rounded-[16px] bg-white border border-[#e5e7ea] text-center space-y-2" role="alert">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center">
          <Link2Off className="w-6 h-6" />
        </div>
        <h2 className="font-serif-title text-2xl text-[#1f2023]">{actual.error.titulo}</h2>
        <p className="text-sm text-[#5b5f66] max-w-lg mx-auto leading-relaxed">{actual.error.detalle}</p>
      </div>
    );
  } else {
    contenido = (
      <>
        <div className="p-5 rounded-[16px] bg-[#fdecec] border border-[#a6192e]/20">
          <p className="text-sm text-[#1f2023] leading-relaxed">
            Hola <strong>{invitacion.nombre}</strong>, el Programa de Ingeniería de Sistemas te invitó como conferencista
            de <strong>{invitacion.eventoNombre}</strong>. Registra tus datos de contacto y tu trayectoria académica y
            profesional: se usarán en la agenda, el material de difusión y la certificación del evento.
          </p>
          <p className="text-xs text-[#7a0c1e] mt-2">
            Este enlace es personal y vence el {conPunto(formatoVencimiento.format(new Date(invitacion.fechaExpiracion)))}
          </p>
        </div>
        <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-6">
          <ConferencistaForm
            modo="invitacion"
            formInicial={formularioDesdeInvitacion(invitacion)}
            correoBloqueado
            ayudaCorreo="Es el correo al que llegó tu invitación."
            enviar={(form) => api.completarInvitacion(token, aCompletarRequest(form))}
            onGuardado={(respuesta) => {
              setCompletado(respuesta);
              if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f7f7f8] text-[#1f2023] font-sans antialiased">
      <header className="h-16 px-8 bg-white border-b border-[#e5e7ea] flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#a6192e] flex items-center justify-center">
            <span className="text-white font-bold text-[11px] tracking-tight">UFPS</span>
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-[#a6192e]">SIGEA</p>
            <p className="text-[11px] text-[#5b5f66]">Sistema Integral de Gestión de Eventos Académicos</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" />
            Invitación como conferencista
          </span>
          <h1 className="font-serif-title text-3xl text-[#1f2023] mt-1 tracking-tight">
            {invitacion?.eventoNombre || completado?.eventoNombre || 'Registro de conferencista'}
          </h1>
          {invitacion && (
            <p className="text-sm text-[#5b5f66] mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {formatearRango(invitacion.fechaInicio, invitacion.fechaFin)}
              {invitacion.semestre ? ` · Semestre ${invitacion.semestre}` : ''}
            </p>
          )}
        </div>
        {contenido}
      </main>

      <Footer />
    </div>
  );
}
