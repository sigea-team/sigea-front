import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Award, CheckCheck, Download, RotateCw, ShieldCheck } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import { certificadoService } from '../api/certificadoService';
import {
  abrirPdf,
  etiquetaTipo,
  formatearFecha,
  interpretarErrorCertificado,
  nombreArchivoCertificado,
  plural,
  resumenEvento,
  situacionOpcion,
  textoAsistencia,
} from '../features/certificados/certificadoUtils';

/**
 * @file MisCertificadosPage.jsx
 * @description Certificados del participante (HU-26: RF47, CU-23). Por cada evento terminado en el que participó
 * muestra sus roles (asistente, ponente, conferencista): si cumple, el certificado para descargar o el botón para
 * obtenerlo (Criterio 1); si no cumple, el motivo y no se emite nada (Criterio 2). Pedirlo otra vez entrega el mismo
 * certificado, sin duplicarlo (Criterio 3). Los certificados solo están disponibles aquí, no se envían por correo.
 * Ruta: /certificados
 * @module pages/MisCertificadosPage
 */

/**
 * @param {Object} props
 * @param {typeof certificadoService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {Object} [props.usuarioProp] - Usuario a mostrar en el layout (Storybook).
 * @param {Function} [props.onSelectNav]
 */
export default function MisCertificadosPage({ api = certificadoService, usuarioProp, onSelectNav }) {
  const [eventos, setEventos] = useState(null);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const [ocupado, setOcupado] = useState(null); // clave del botón en curso
  const [aviso, setAviso] = useState(null); // { tipo: 'ok'|'error', clave, texto }

  useEffect(() => {
    let activo = true;
    api
      .listarMisEventos()
      .then((lista) => {
        if (!activo) return;
        setEventos(lista);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(interpretarErrorCertificado(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, version]);

  const reintentar = () => {
    setError(null);
    setEventos(null);
    setVersion((v) => v + 1);
  };

  const descargar = async (certificado, clave) => {
    setOcupado(clave);
    setAviso(null);
    try {
      await abrirPdf(() => api.descargarCertificado(certificado.certificadoId), nombreArchivoCertificado(certificado));
    } catch (err) {
      setAviso({ tipo: 'error', clave, texto: interpretarErrorCertificado(err).mensaje });
    } finally {
      setOcupado(null);
    }
  };

  const obtener = async (evento, opcion, clave) => {
    setOcupado(clave);
    setAviso(null);
    try {
      const respuesta = await api.solicitarCertificado(evento.eventoId, opcion.tipo);
      setEventos((lista) =>
        lista.map((e) =>
          e.eventoId !== evento.eventoId
            ? e
            : { ...e, opciones: e.opciones.map((o) => (o.tipo === opcion.tipo ? { ...o, puedeGenerar: false, motivo: null, certificado: respuesta.certificado } : o)) }
        )
      );
      setAviso({
        tipo: 'ok',
        clave,
        texto: respuesta.generadoAhora ? 'Listo: tu certificado ya está disponible.' : 'Ya tenías este certificado; es el mismo de antes.',
      });
    } catch (err) {
      setAviso({ tipo: 'error', clave, texto: interpretarErrorCertificado(err).mensaje });
    } finally {
      setOcupado(null);
    }
  };

  const total = (eventos || []).reduce((n, e) => n + resumenEvento(e).emitidos, 0);

  return (
    <MainLayout title="Certificados" activeNav="certificados" onSelectNav={onSelectNav} usuario={usuarioProp}>
      <div className="space-y-6">
        <div className="pb-4 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" aria-hidden="true" />
            SIGEA — Certificados
          </span>
          <h2 className="font-serif-title text-2xl sm:text-3xl text-ink-900 mt-1 tracking-tight">Mis certificados</h2>
          <p className="text-sm text-ink-600 mt-1 max-w-2xl">
            Aquí aparecen los eventos terminados en los que participaste. Descarga tus certificados cuando el organizador
            los habilite; cada uno tiene un código para que cualquiera pueda verificarlo.
          </p>
        </div>

        {!eventos && !error && (
          <p className="py-12 text-center text-sm text-ink-600" role="status">
            Cargando certificados...
          </p>
        )}

        {error && (
          <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 flex items-center justify-between gap-4" role="alert">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error}
            </span>
            <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer">
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        )}

        {eventos && eventos.length === 0 && (
          <div className="py-12 text-center bg-white rounded-[16px] border border-dashed border-field-border">
            <Award className="w-8 h-8 text-ink-300 mx-auto" aria-hidden="true" />
            <p className="font-semibold text-base text-ink-900 mt-2">Aún no tienes certificados</p>
            <p className="text-xs mt-1 text-ink-600">Cuando termine un evento en el que participaste, aparecerá aquí.</p>
          </div>
        )}

        {eventos && eventos.length > 0 && (
          <p className="text-sm text-ink-600">
            {plural(total, 'certificado disponible', 'certificados disponibles')} en {plural(eventos.length, 'evento')}.
          </p>
        )}

        <ul className="space-y-4">
          {(eventos || []).map((evento) => (
            <li key={evento.eventoId} className="p-5 rounded-[16px] border border-border bg-white space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-serif-title text-lg text-ink-900 leading-tight">{evento.eventoNombre}</h3>
                  <p className="text-xs text-ink-600 mt-0.5">Terminó el {formatearFecha(evento.fechaFinEvento)}</p>
                </div>
                {!evento.certificadosHabilitados && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap bg-white text-ink-600 border-field-border">
                    Certificados aún no habilitados
                  </span>
                )}
              </div>

              <ul className="divide-y divide-border border-t border-border">
                {evento.opciones.map((opcion) => {
                  const clave = `${evento.eventoId}-${opcion.tipo}`;
                  const situacion = situacionOpcion(opcion, evento);
                  const asistencia = textoAsistencia(opcion);
                  const certificado = opcion.certificado;
                  const avisoPropio = aviso?.clave === clave ? aviso : null;
                  return (
                    <li key={opcion.tipo} className="pt-3 first:pt-3 pb-1 space-y-2">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-ink-900 flex items-center gap-2 flex-wrap">
                            Certificado de {etiquetaTipo(opcion.tipo, opcion.tipoDescripcion).toLowerCase()}
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${situacion.clases}`}>
                              {situacion.etiqueta}
                            </span>
                          </p>
                          {asistencia && <p className="text-xs text-ink-600">{asistencia}</p>}
                          {opcion.actividadesACargo?.length > 0 && (
                            <p className="text-xs text-ink-600">A cargo: {opcion.actividadesACargo.join(', ')}</p>
                          )}
                          {situacion.texto && <p className="text-xs text-ink-900">{situacion.texto}</p>}
                          {certificado && (
                            <p className="text-xs text-ink-600 flex items-center gap-1.5 flex-wrap">
                              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
                              Código <span className="font-mono text-ink-900">{certificado.codigoVerificacion}</span>
                              <Link to={`/verificar/${encodeURIComponent(certificado.codigoVerificacion)}`} className="underline text-brand-600 font-medium">
                                Verificar
                              </Link>
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {certificado && (
                            <Button type="button" variant="primary" className="h-9 px-3 text-xs" loading={ocupado === clave} onClick={() => descargar(certificado, clave)}>
                              <Download className="w-3.5 h-3.5" aria-hidden="true" />
                              Descargar PDF
                            </Button>
                          )}
                          {!certificado && opcion.puedeGenerar && (
                            <Button type="button" variant="primary" className="h-9 px-3 text-xs" loading={ocupado === clave} onClick={() => obtener(evento, opcion, clave)}>
                              <Award className="w-3.5 h-3.5" aria-hidden="true" />
                              Obtener certificado
                            </Button>
                          )}
                        </div>
                      </div>
                      {avisoPropio && (
                        <p
                          className={`text-xs flex items-center gap-1.5 ${avisoPropio.tipo === 'ok' ? 'text-ink-900' : 'text-brand-700'}`}
                          role={avisoPropio.tipo === 'ok' ? 'status' : 'alert'}
                        >
                          {avisoPropio.tipo === 'ok' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          {avisoPropio.texto}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </MainLayout>
  );
}
