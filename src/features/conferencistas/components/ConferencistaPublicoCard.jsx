import { BookOpen, ExternalLink, GraduationCap } from 'lucide-react';
import { formatearFecha } from '../../eventos/eventoUtils';
import { etiquetaNivel, etiquetaParticipacion, etiquetaPublicacion, fechaCorta } from '../conferencistaUtils';

/**
 * @file ConferencistaPublicoCard.jsx
 * @description Tarjeta de un conferencista en la vista pública del evento (HU-12, Criterio 4).
 * Muestra la trayectoria vigente (biografía, estudios y publicaciones) y la fecha de su última
 * actualización. No muestra documento, correo ni teléfono.
 * @module features/conferencistas/components/ConferencistaPublicoCard
 */

/**
 * Iniciales para el avatar: primer nombre + primer apellido (el penúltimo término cuando hay dos apellidos).
 * "Ana María Pérez Gómez" → "AP", "Lucía Fernández Ortiz" → "LF", "Diego Torres" → "DT".
 */
function iniciales(nombre) {
  const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  const apellido = partes.length >= 3 ? partes[partes.length - 2] : partes[1];
  return `${partes[0][0]}${apellido[0]}`.toUpperCase();
}

/**
 * @param {Object} props
 * @param {Object} props.conferencista - ConferencistaPublicoResponse
 */
export default function ConferencistaPublicoCard({ conferencista: c }) {
  const subtitulo = [c.cargoActual, c.institucion].filter(Boolean).join(' · ');

  return (
    <article
      id={`conferencista-${c.personaId}`}
      className="bg-white rounded-[16px] border border-[#e5e7ea] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <header className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0 font-serif-title text-lg"
          aria-hidden="true"
        >
          {iniciales(c.nombreCompleto)}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#a6192e]">
            {etiquetaParticipacion(c.tipoParticipacion)}
          </span>
          <h2 className="font-serif-title text-xl text-[#1f2023] leading-tight mt-0.5">{c.nombreCompleto}</h2>
          {subtitulo && <p className="text-sm text-[#5b5f66] mt-0.5">{subtitulo}</p>}
          {c.tema && (
            <p className="text-sm text-[#1f2023] mt-2">
              <span className="font-semibold">Tema:</span> {c.tema}
            </p>
          )}
        </div>
      </header>

      {c.biografia && <p className="text-sm text-[#1f2023] leading-relaxed mt-4 whitespace-pre-line">{c.biografia}</p>}

      {(c.estudios?.length > 0 || c.publicaciones?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-[#e5e7ea]">
          {c.estudios?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5b5f66] flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#a6192e]" />
                Formación
              </h3>
              <ul className="mt-2 space-y-2">
                {c.estudios.map((e) => (
                  <li key={e.id ?? `${e.titulo}-${e.anio}`} className="text-sm">
                    <p className="text-[#1f2023] font-medium">{e.titulo}</p>
                    <p className="text-xs text-[#5b5f66]">
                      {etiquetaNivel(e.nivel)} · {e.institucion}
                      {e.anio ? ` · ${e.anio}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {c.publicaciones?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5b5f66] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#a6192e]" />
                Publicaciones
              </h3>
              <ul className="mt-2 space-y-2">
                {c.publicaciones.map((p) => (
                  <li key={p.id ?? `${p.titulo}-${p.anio}`} className="text-sm">
                    {p.enlace ? (
                      <a
                        href={p.enlace}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1f2023] font-medium hover:text-[#a6192e] underline-offset-2 hover:underline"
                      >
                        {p.titulo}
                      </a>
                    ) : (
                      <p className="text-[#1f2023] font-medium">{p.titulo}</p>
                    )}
                    <p className="text-xs text-[#5b5f66]">
                      {etiquetaPublicacion(p.tipo)}
                      {p.medio ? ` · ${p.medio}` : ''}
                      {p.anio ? ` · ${p.anio}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-[#e5e7ea]">
        {c.enlacePerfil ? (
          <a
            href={c.enlacePerfil}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#a6192e] hover:text-[#7a0c1e]"
          >
            <ExternalLink className="w-4 h-4" />
            Perfil académico
          </a>
        ) : (
          <span />
        )}
        {c.fechaActualizacion && (
          <p className="text-xs text-[#5b5f66]">
            Trayectoria actualizada el {formatearFecha(fechaCorta(c.fechaActualizacion))}
          </p>
        )}
      </footer>
    </article>
  );
}
