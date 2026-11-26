import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleX, LayoutDashboard, LogIn, Search, ShieldCheck } from 'lucide-react';
import Footer from '../components/ui/Footer';
import UfpsLogo from '../components/ui/UfpsLogo';
import { certificadoService } from '../api/certificadoService';
import { useAuthStore } from '../store/authStore';
import {
  etiquetaTipo,
  formatearFechaHora,
  formatearRangoEvento,
  interpretarErrorCertificado,
  normalizarCodigo,
} from '../features/certificados/certificadoUtils';

/**
 * @file VerificarCertificadoPage.jsx
 * @description Verificación pública de un certificado (HU-26). Es la dirección impresa en cada certificado: quien lo
 * recibe (una empresa, otra universidad) confirma sin iniciar sesión que existe, a nombre de quién está y de qué
 * evento. El documento se muestra enmascarado.
 * Rutas: /verificar y /verificar/:codigo
 * @module pages/VerificarCertificadoPage
 */

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-600">{etiqueta}</dt>
      <dd className="text-sm text-ink-900 mt-0.5">{children}</dd>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {typeof certificadoService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 */
export default function VerificarCertificadoPage({ api = certificadoService }) {
  const { codigo: codigoRuta } = useParams();
  const navigate = useNavigate();
  const conSesion = Boolean(useAuthStore((state) => state.token));
  const codigo = normalizarCodigo(codigoRuta || '');
  const [texto, setTexto] = useState(codigo);
  const [resultado, setResultado] = useState(null); // { codigo, certificado } | { codigo, noExiste } | { codigo, error }

  useEffect(() => {
    if (!codigo) return undefined;
    let activo = true;
    api
      .verificarCertificado(codigo)
      .then((certificado) => {
        if (activo) setResultado({ codigo, certificado });
      })
      .catch((err) => {
        if (!activo) return;
        const info = interpretarErrorCertificado(err);
        setResultado(info.status === 404 ? { codigo, noExiste: true } : { codigo, error: info.mensaje });
      });
    return () => {
      activo = false;
    };
  }, [api, codigo]);

  const actual = resultado?.codigo === codigo ? resultado : null;
  const cargando = Boolean(codigo) && !actual;

  const buscar = (e) => {
    e.preventDefault();
    const limpio = normalizarCodigo(texto);
    if (!limpio) return;
    setTexto(limpio);
    navigate(`/verificar/${encodeURIComponent(limpio)}`);
  };

  const c = actual?.certificado;

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface-muted text-ink-900 font-sans antialiased">
      <header className="h-16 px-8 bg-white border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <UfpsLogo variante="vertical" className="h-10 w-auto max-w-[40px] object-contain shrink-0" />
          <div className="leading-tight">
            <p className="text-base font-bold text-brand-600">SIGEA</p>
            <p className="text-[11px] text-ink-600">Sistema Integral de Gestión de Eventos Académicos</p>
          </div>
        </div>
        <Link
          to={conSesion ? '/dashboard' : '/login'}
          className="h-10 px-4 rounded-[8px] border border-field-border text-sm font-medium text-ink-900 hover:bg-surface-muted inline-flex items-center gap-2 transition-colors"
        >
          {conSesion ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {conSesion ? 'Ir a mi panel' : 'Iniciar sesión'}
        </Link>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 sm:px-8 py-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Verificación de certificados
          </span>
          <h1 className="font-serif-title text-3xl text-ink-900 mt-1 tracking-tight">¿Este certificado es auténtico?</h1>
          <p className="text-sm text-ink-600 mt-1">
            Escribe el código que aparece al pie del certificado. También puedes pegar la dirección completa.
          </p>
        </div>

        <form onSubmit={buscar} className="flex gap-2" role="search">
          <label htmlFor="codigo-certificado" className="sr-only">
            Código de verificación
          </label>
          <input
            id="codigo-certificado"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej.: CERT-3F9A1C7B2E4D8F0A6B5C1D2E"
            autoComplete="off"
            spellCheck="false"
            className="flex-1 h-11 px-3.5 rounded-[8px] bg-white text-sm font-mono text-ink-900 placeholder-ink-300 border border-field-border outline-none focus:border-brand-600"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            className="h-11 px-5 rounded-[8px] bg-brand-600 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-brand-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            Verificar
          </button>
        </form>

        {cargando && (
          <p className="py-8 text-center text-sm text-ink-600" role="status">
            Verificando...
          </p>
        )}

        {c && (
          <section className="rounded-[16px] border border-border bg-white overflow-hidden" aria-labelledby="titulo-verificado">
            <div className="px-6 py-4 bg-surface-muted border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="titulo-verificado" className="text-base font-semibold text-ink-900">
                  Certificado válido
                </h2>
                <p className="text-xs text-ink-600">Fue emitido por SIGEA — Universidad Francisco de Paula Santander.</p>
              </div>
            </div>
            <dl className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Dato etiqueta="Otorgado a">
                <span className="font-semibold">{c.nombreParticipante}</span>
                <span className="block text-xs text-ink-600">{c.documento}</span>
              </Dato>
              <Dato etiqueta="En calidad de">{etiquetaTipo(c.tipo, c.tipoDescripcion)}</Dato>
              <Dato etiqueta="Evento">
                {c.eventoNombre}
                <span className="block text-xs text-ink-600">Realizado {formatearRangoEvento(c.fechaInicioEvento, c.fechaFinEvento)}</span>
              </Dato>
              <Dato etiqueta="Emitido el">{formatearFechaHora(c.fechaGeneracion)}</Dato>
              <div className="sm:col-span-2">
                <Dato etiqueta="Código">
                  <span className="font-mono">{c.codigoVerificacion}</span>
                </Dato>
              </div>
            </dl>
          </section>
        )}

        {actual?.noExiste && (
          <div className="p-5 rounded-[16px] border border-brand-600 bg-brand-100 flex items-start gap-3" role="alert">
            <CircleX className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-brand-700">No encontramos un certificado con ese código</p>
              <p className="text-sm text-brand-700 mt-0.5">
                Revisa que esté escrito igual que en el certificado (<span className="font-mono">{actual.codigo}</span>). Si
                el código es correcto, el documento no fue emitido por SIGEA.
              </p>
            </div>
          </div>
        )}

        {actual?.error && (
          <p className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700" role="alert">
            {actual.error}
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
