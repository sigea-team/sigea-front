import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Info, Mic, RotateCw, UserX } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import { conferencistaService } from '../api/conferencistaService';
import ConferencistaForm from '../features/conferencistas/components/ConferencistaForm';
import { extraerError } from '../features/eventos/eventoUtils';
import { aActualizarRequest, eventosConVistaPublica } from '../features/conferencistas/conferencistaUtils';

/**
 * @file MiPerfilConferencistaPage.jsx
 * @description Perfil de ingreso «Conferencista» (HU-12). El conferencista invitado que inicia sesión
 * ve y actualiza sus datos y su trayectoria (biografía, estudios y publicaciones). Como la trayectoria
 * es una sola, el cambio se refleja de inmediato en la vista pública de sus eventos (Criterio 4).
 * El perfil se crea cuando el conferencista completa la invitación que le envía el organizador;
 * si aún no existe, la página explica qué debe pasar.
 * Ruta: /mi-perfil-conferencista
 * @module pages/MiPerfilConferencistaPage
 */

/**
 * @param {Object} props
 * @param {typeof conferencistaService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 */
export default function MiPerfilConferencistaPage({ api = conferencistaService, usuarioProp }) {
  // { perfil } | { error, noRegistrado }
  const [resultado, setResultado] = useState(null);
  const [version, setVersion] = useState(0);
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let activo = true;
    api
      .obtenerMiPerfilConferencista()
      .then((perfil) => {
        if (activo) setResultado({ perfil });
      })
      .catch((err) => {
        if (!activo) return;
        const { status, mensaje } = extraerError(err);
        const mensajeBackend = err?.response?.data?.message;
        setResultado({
          noRegistrado: status === 404,
          error: status === 404 && mensajeBackend ? mensajeBackend : mensaje,
        });
      });
    return () => {
      activo = false;
    };
  }, [api, version]);

  const perfil = resultado?.perfil;
  const publicos = (perfil?.participaciones || []).filter((p) => p.visiblePublicamente);

  const alGuardar = (actualizado) => {
    const eventos = eventosConVistaPublica(actualizado);
    setResultado({ perfil: actualizado });
    setClaveFormulario((k) => k + 1);
    setAviso(
      eventos.length > 0
        ? `Cambios guardados. Tu trayectoria ya se ve actualizada en la página pública de: ${eventos.join(', ')}.`
        : 'Cambios guardados.'
    );
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout title="Mi perfil de conferencista" activeNav="mi-perfil-conferencista" usuario={usuarioProp}>
      <div className="max-w-4xl space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" />
            Perfil de conferencista
          </span>
          <h1 className="font-serif-title text-2xl text-[#1f2023] mt-1">
            {perfil ? perfil.nombreCompleto : 'Mi perfil de conferencista'}
          </h1>
          <p className="text-sm text-[#5b5f66] mt-1 max-w-2xl">
            Mantén al día tu trayectoria académica y profesional. Es la información que se publica en la agenda,
            el material de difusión y la certificación de los eventos en los que participas.
          </p>
        </div>

        {!resultado && (
          <p className="py-12 text-center text-sm text-[#5b5f66]" role="status">
            Cargando tu perfil...
          </p>
        )}

        {resultado?.noRegistrado && (
          <div className="p-6 rounded-[16px] bg-white border border-[#e5e7ea] flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] text-[#5b5f66] flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-[#1f2023]">Aún no tienes perfil de conferencista</p>
              <p className="text-sm text-[#5b5f66] mt-1 leading-relaxed">{resultado.error}</p>
              <p className="text-xs text-[#5b5f66] mt-2">
                Cuando completes la invitación que te llega al correo, vuelve a ingresar con el perfil «Conferencista».
              </p>
            </div>
          </div>
        )}

        {resultado?.error && !resultado.noRegistrado && (
          <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#a6192e] shrink-0" />
              <span>{resultado.error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setResultado(null);
                setVersion((v) => v + 1);
              }}
              className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {perfil && (
          <>
            {aviso && (
              <p
                className="flex items-start gap-2 text-sm text-[#1d6b45] bg-[#e8f5ee] border border-[#bfe3cf] px-4 py-3 rounded-[12px]"
                role="status"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{aviso}</span>
              </p>
            )}

            {publicos.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#5b5f66]">Así te ven en:</span>
                {publicos.map((p) => (
                  <Link
                    key={p.participacionId}
                    to={`/eventos/${p.eventoId}/conferencistas-publicos`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#a6192e] bg-white border border-[#a6192e]/25 hover:bg-[#fdecec] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {p.eventoNombre}
                  </Link>
                ))}
              </div>
            )}

            <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-6">
              <ConferencistaForm
                key={claveFormulario}
                modo="editar"
                perfil={perfil}
                correoBloqueado
                ayudaCorreo="Es tu usuario de inicio de sesión en SIGEA; no se cambia desde aquí."
                enviar={(form) => api.actualizarMiPerfilConferencista(aActualizarRequest(form))}
                onGuardado={alGuardar}
                onCancelar={() => {
                  setAviso(null);
                  setClaveFormulario((k) => k + 1);
                }}
              />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
