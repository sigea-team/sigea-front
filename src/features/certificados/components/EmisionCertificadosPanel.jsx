import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Award, CheckCheck, Circle, CircleCheck, Download, RefreshCw, Search, UserX } from 'lucide-react';
import Button from '../../../components/ui/Button';
import {
  OPCIONES_TIPO,
  abrirPdf,
  conteoPorTipo,
  etiquetaTipo,
  eventoTerminado,
  filtrarCertificados,
  formatearFecha,
  formatearFechaHora,
  formatearPorcentaje,
  interpretarErrorCertificado,
  nombreArchivoCertificado,
  plural,
  resumenEmision,
} from '../certificadoUtils';

/**
 * @file EmisionCertificadosPanel.jsx
 * @description Emisión de los certificados de un evento (HU-26). Antes de habilitar muestra lo que falta (evento
 * terminado y plantilla completa). Al habilitar se congela la plantilla y se emiten los certificados de quienes cumplen
 * (Criterio 1); quienes no cumplen quedan en la lista de excluidos con su motivo (Criterio 2). Después se pueden emitir
 * los que falten sin duplicar los existentes (Criterio 3) y consultar o descargar los emitidos.
 * @module features/certificados/components/EmisionCertificadosPanel
 */

function Requisito({ cumple, children }) {
  const Icono = cumple ? CircleCheck : Circle;
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icono className={`w-4 h-4 mt-0.5 shrink-0 ${cumple ? 'text-brand-600' : 'text-ink-300'}`} aria-hidden="true" />
      <span className={cumple ? 'text-ink-900' : 'text-ink-600'}>{children}</span>
    </li>
  );
}
Requisito.propTypes = { cumple: PropTypes.bool, children: PropTypes.node };

/** Resultado de habilitar o generar: cuántos se emitieron y quiénes no cumplen, con su motivo. */
function ResultadoEmision({ resultado }) {
  const excluidos = resultado.excluidos || [];
  return (
    <div className="p-4 rounded-[12px] border border-border bg-surface-muted space-y-3" role="status">
      <p className="text-sm text-ink-900 flex items-start gap-2">
        <CheckCheck className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" aria-hidden="true" />
        {resumenEmision(resultado)}
      </p>
      {excluidos.length > 0 && (
        <details className="group">
          <summary className="text-xs font-semibold text-ink-900 cursor-pointer select-none">
            Ver quiénes no cumplen ({excluidos.length})
          </summary>
          <ul className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {excluidos.map((x) => (
              <li key={`${x.personaId}-${x.tipo}`} className="p-2.5 rounded-[8px] bg-white border border-border text-xs">
                <p className="font-semibold text-ink-900 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-ink-600" aria-hidden="true" />
                  {x.nombre}
                  <span className="font-normal text-ink-600">
                    · {x.numeroDocumento} · {etiquetaTipo(x.tipo)}
                  </span>
                </p>
                <p className="text-ink-600 mt-0.5">{x.motivo}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
ResultadoEmision.propTypes = { resultado: PropTypes.object.isRequired };

/** Lista de los certificados emitidos con búsqueda, filtro por rol y descarga. */
function CertificadosEmitidos({ api, certificados }) {
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [descargando, setDescargando] = useState(null);
  const [error, setError] = useState(null);
  const conteo = conteoPorTipo(certificados);
  const visibles = filtrarCertificados(certificados, texto, tipo);

  const descargar = async (c) => {
    setDescargando(c.certificadoId);
    setError(null);
    try {
      await abrirPdf(() => api.descargarCertificado(c.certificadoId), nombreArchivoCertificado(c));
    } catch (err) {
      setError(interpretarErrorCertificado(err).mensaje);
    } finally {
      setDescargando(null);
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="titulo-emitidos">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 id="titulo-emitidos" className="text-sm font-semibold text-ink-900">
          Certificados emitidos <span className="font-normal text-ink-600 tabular-nums">({certificados.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-300 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre, documento o código"
              aria-label="Buscar certificados"
              className="h-9 w-56 pl-8 pr-3 rounded-[8px] border border-field-border text-xs text-ink-900 placeholder-ink-300 outline-none focus:border-brand-600"
            />
          </div>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            aria-label="Filtrar por rol"
            className="h-9 px-2 rounded-[8px] border border-field-border text-xs text-ink-900 bg-white outline-none focus:border-brand-600"
          >
            <option value="todos">Todos los roles</option>
            {OPCIONES_TIPO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({conteo[o.value] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700" role="alert">
          {error}
        </p>
      )}

      {certificados.length === 0 ? (
        <div className="p-6 rounded-[12px] border border-dashed border-field-border text-center">
          <p className="text-sm font-semibold text-ink-900">Aún no se ha emitido ningún certificado.</p>
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-ink-600 text-center py-4">Ningún certificado coincide con la búsqueda.</p>
      ) : (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-surface-muted text-ink-600">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Participante</th>
                <th className="text-left font-semibold px-3 py-2">Rol</th>
                <th className="text-left font-semibold px-3 py-2">Asistencia</th>
                <th className="text-left font-semibold px-3 py-2">Código</th>
                <th className="px-3 py-2"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {visibles.map((c) => (
                <tr key={c.certificadoId}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-ink-900">{c.nombreParticipante}</p>
                    <p className="text-ink-600">
                      {c.tipoDocumento} {c.numeroDocumento}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-ink-900">{etiquetaTipo(c.tipo, c.tipoDescripcion)}</td>
                  <td className="px-3 py-2 text-ink-900 tabular-nums">{c.tipo === 'asistente' ? formatearPorcentaje(c.porcentajeAsistencia) : '—'}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-600">{c.codigoVerificacion}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => descargar(c)}
                      loading={descargando === c.certificadoId}
                      aria-label={`Descargar el certificado de ${c.nombreParticipante}`}
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
CertificadosEmitidos.propTypes = {
  api: PropTypes.object.isRequired,
  certificados: PropTypes.array.isRequired,
};

/**
 * @param {Object} props
 * @param {Object} props.evento - Evento de la lista (id, estado, fechaFin, archivado).
 * @param {Object} props.api - certificadoService o su simulación.
 * @param {Object} props.plantilla - PlantillaCertificadoResponse.
 * @param {Array} props.certificados - Certificados emitidos del evento.
 * @param {function(): void} props.onEmitidos - Pide recargar plantilla y certificados tras habilitar o generar.
 */
export default function EmisionCertificadosPanel({ evento, api, plantilla, certificados, onEmitidos }) {
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(null); // 'habilitar' | 'generar'
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const archivado = Boolean(evento.archivado);
  const terminado = eventoTerminado(evento);
  const habilitada = plantilla.habilitada;
  const puedeHabilitar = !archivado && !habilitada && terminado && plantilla.completa;

  const ejecutar = async (clave, accion) => {
    setOcupado(clave);
    setError(null);
    try {
      setResultado(await accion());
      setConfirmando(false);
      onEmitidos();
    } catch (err) {
      setError(interpretarErrorCertificado(err));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="space-y-5">
      {!habilitada && (
        <section className="p-4 rounded-[12px] border border-border bg-white space-y-3" aria-labelledby="titulo-habilitar">
          <h3 id="titulo-habilitar" className="text-sm font-semibold text-ink-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-600" aria-hidden="true" />
            Habilitar certificados
          </h3>
          <p className="text-xs text-ink-600">
            Al habilitarlos se congela la plantilla y el porcentaje mínimo, y se emiten de una vez los certificados de todas
            las personas que cumplen los requisitos. Quedan disponibles para descargar en SIGEA (no se envían por correo).
          </p>
          <ul className="space-y-1.5">
            <Requisito cumple={terminado}>
              {terminado ? 'El evento terminó.' : `El evento debe haber terminado (finaliza el ${formatearFecha(evento.fechaFin)}).`}
            </Requisito>
            <Requisito cumple={plantilla.tieneFondo}>Imagen de fondo cargada.</Requisito>
            <Requisito cumple={(plantilla.firmantes || []).length > 0}>Al menos un firmante con su firma.</Requisito>
          </ul>

          {archivado ? (
            <p className="text-xs text-ink-600">El evento está en la memoria histórica: ya no se emiten certificados nuevos.</p>
          ) : confirmando ? (
            <div className="p-3 rounded-[12px] border border-brand-600 bg-brand-100 space-y-2">
              <p className="text-sm text-brand-700">
                ¿Habilitar los certificados? Después no podrás cambiar la plantilla ni el porcentaje mínimo, para que todos
                los certificados sean iguales.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => setConfirmando(false)} disabled={Boolean(ocupado)}>
                  Cancelar
                </Button>
                <Button type="button" variant="primary" className="h-9 px-3 text-xs" loading={ocupado === 'habilitar'} onClick={() => ejecutar('habilitar', () => api.habilitarCertificados(evento.id))}>
                  Sí, habilitar y emitir
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button type="button" variant="primary" className="h-9 px-3 text-xs" disabled={!puedeHabilitar} onClick={() => setConfirmando(true)}>
                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                Habilitar certificados
              </Button>
            </div>
          )}
        </section>
      )}

      {habilitada && (
        <section className="p-4 rounded-[12px] border border-border bg-white flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-ink-900 flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-brand-600" aria-hidden="true" />
              Certificados habilitados
            </p>
            <p className="text-xs text-ink-600 mt-0.5">
              Desde el {formatearFechaHora(plantilla.fechaHabilitacion)} · {plural(certificados.length, 'certificado emitido', 'certificados emitidos')}
            </p>
          </div>
          {!archivado && (
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 text-xs"
              loading={ocupado === 'generar'}
              onClick={() => ejecutar('generar', () => api.generarCertificadosEvento(evento.id))}
              title="Emite los de quienes cumplen y aún no lo tienen (por ejemplo, si se corrigió una asistencia)"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Emitir faltantes
            </Button>
          )}
        </section>
      )}

      {error && (
        <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 flex items-start gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">{error.titulo}</p>
            <p>{error.mensaje}</p>
          </div>
        </div>
      )}

      {resultado && <ResultadoEmision resultado={resultado} />}

      {(habilitada || certificados.length > 0) && <CertificadosEmitidos api={api} certificados={certificados} />}
    </div>
  );
}

EmisionCertificadosPanel.propTypes = {
  evento: PropTypes.object.isRequired,
  api: PropTypes.object.isRequired,
  plantilla: PropTypes.object.isRequired,
  certificados: PropTypes.array.isRequired,
  onEmitidos: PropTypes.func.isRequired,
};
