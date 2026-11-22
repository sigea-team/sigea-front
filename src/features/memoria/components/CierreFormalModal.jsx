import { useEffect, useState } from 'react';
import { AlertTriangle, Archive, Info, RotateCw } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import { memoriaHistoricaService } from '../../../api/memoriaHistoricaService';
import { formatearFecha } from '../../eventos/eventoUtils';
import { LIMITE_RESUMEN, aCierreRequest, interpretarErrorMemoria, validarCierre } from '../memoriaUtils';

/**
 * @file CierreFormalModal.jsx
 * @description Cierre formal de un evento finalizado (HU-28, Criterio 1; CU-32). Primero revisa en el backend si el
 * evento se puede cerrar y qué procesos quedan pendientes (evaluaciones sin finalizar, certificados sin generar...).
 * Si hay pendientes, exige confirmarlos explícitamente (flujo alterno). Al cerrar, la información del evento queda
 * consolidada en la memoria histórica y desde ese momento es solo de consulta.
 * @module features/memoria/components/CierreFormalModal
 */

/**
 * @param {Object} props
 * @param {{ id: number, nombre: string }} props.evento
 * @param {typeof memoriaHistoricaService} [props.api]
 * @param {function(): void} props.onClose
 * @param {function(Object): void} props.onCerrado - Recibe la memoria consolidada.
 */
export default function CierreFormalModal({ evento, api = memoriaHistoricaService, onClose, onCerrado }) {
  const [revision, setRevision] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [version, setVersion] = useState(0);
  const [form, setForm] = useState({ confirmarPendientes: false, resumen: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    api
      .revisarCierre(evento.id)
      .then((datos) => {
        if (!activo) return;
        setRevision(datos);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(interpretarErrorMemoria(err).mensaje);
      });
    return () => {
      activo = false;
    };
  }, [api, evento.id, version]);

  const pendientes = revision?.pendientes || [];

  const reintentar = () => {
    setErrorCarga(null);
    setRevision(null);
    setVersion((v) => v + 1);
  };

  const cerrar = async () => {
    const nuevos = validarCierre(form, pendientes);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    setEnviando(true);
    setError(null);
    try {
      const memoria = await api.cerrarFormalmente(evento.id, aCierreRequest(form));
      onCerrado(memoria);
    } catch (err) {
      const info = interpretarErrorMemoria(err);
      if (info.codigo === 'CIERRE_CON_PENDIENTES') {
        // Aparecieron pendientes después de la revisión: se muestran y se pide confirmarlos.
        setRevision((r) => ({ ...r, pendientes: info.pendientes }));
        setForm((f) => ({ ...f, confirmarPendientes: false }));
      }
      setError(info);
    } finally {
      setEnviando(false);
    }
  };

  let contenido;
  if (errorCarga) {
    contenido = (
      <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-sm flex items-center justify-between gap-4" role="alert">
        <span>{errorCarga}</span>
        <button type="button" onClick={reintentar} className="inline-flex items-center gap-1 font-semibold underline cursor-pointer shrink-0">
          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    );
  } else if (!revision) {
    contenido = (
      <p className="text-sm text-ink-600 py-6 text-center" role="status">
        Revisando el evento...
      </p>
    );
  } else if (!revision.puedeCerrarse) {
    contenido = (
      <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-3 rounded-[8px] flex items-start gap-2" role="status">
        <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
        {revision.motivoNoCerrable || 'El evento no se puede cerrar formalmente todavía.'}
      </p>
    );
  } else {
    contenido = (
      <div className="space-y-5">
        <p className="text-sm text-ink-900">
          El evento terminó el {formatearFecha(revision.fechaFin)}. Al cerrarlo formalmente se consolida toda su
          información (configuración, propuestas, agenda, asistencia, encuestas e indicadores) en la memoria
          histórica. <strong>Desde ese momento solo se podrá consultar:</strong> nadie podrá modificarla ni eliminarla.
        </p>

        {pendientes.length === 0 ? (
          <p className="text-sm text-ink-900 bg-surface-muted border border-border px-3 py-2 rounded-[8px]" role="status">
            No hay procesos pendientes.
          </p>
        ) : (
          <div className="p-4 rounded-[12px] border border-brand-600 bg-brand-100 space-y-3">
            <p className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              El evento tiene procesos pendientes
            </p>
            <ul className="list-disc list-inside text-sm text-ink-900 space-y-0.5">
              {pendientes.map((p) => (
                <li key={p.codigo}>
                  {p.descripcion}: <strong>{p.cantidad}</strong>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-900">
              Si cierras ahora, quedarán así en la memoria histórica. Las encuestas abiertas se cierran automáticamente.
            </p>
            <label className="flex items-start gap-2 text-sm text-ink-900 cursor-pointer">
              <input
                type="checkbox"
                checked={form.confirmarPendientes}
                onChange={(e) => {
                  setForm((f) => ({ ...f, confirmarPendientes: e.target.checked }));
                  setErrores((x) => ({ ...x, confirmarPendientes: undefined }));
                }}
                className="mt-0.5 w-4 h-4 accent-brand-600"
              />
              Confirmo que quiero cerrar el evento con estos pendientes.
            </label>
            {errores.confirmarPendientes && (
              <p className="text-xs text-brand-700" role="alert">{errores.confirmarPendientes}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="resumen-cierre" className="text-sm font-medium text-ink-900">
            Resumen o acta de cierre <span className="text-ink-600 font-normal">(opcional)</span>
          </label>
          <textarea
            id="resumen-cierre"
            rows={4}
            maxLength={LIMITE_RESUMEN}
            value={form.resumen}
            onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
            placeholder="Logros, observaciones y recomendaciones para las próximas ediciones."
            className={`w-full px-3.5 py-2.5 rounded-[8px] bg-surface text-sm text-ink-900 placeholder-ink-300 border outline-none resize-y ${
              errores.resumen
                ? 'border-brand-600 focus:ring-1 focus:ring-brand-700'
                : 'border-field-border hover:border-ink-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600'
            }`}
          />
          <p className="text-xs text-ink-600 text-right">{form.resumen.length}/{LIMITE_RESUMEN}</p>
          {errores.resumen && <p className="text-xs text-brand-700" role="alert">{errores.resumen}</p>}
        </div>

        {error && (
          <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 space-y-1" role="alert">
            <p className="font-semibold">{error.titulo}</p>
            <p>{error.mensaje}</p>
          </div>
        )}
      </div>
    );
  }

  const puedeEnviar = revision?.puedeCerrarse && !errorCarga;

  return (
    <ModalShell
      titulo="Cierre formal del evento"
      subtitulo={evento.nombre}
      icono={Archive}
      onClose={onClose}
      tituloId="cierre-formal-titulo"
      pie={
        <>
          <Button type="button" variant="secondary" onClick={onClose} className="h-10 px-4 text-sm" disabled={enviando}>
            {puedeEnviar ? 'Cancelar' : 'Cerrar'}
          </Button>
          {puedeEnviar && (
            <Button type="button" variant="primary" onClick={cerrar} loading={enviando} className="h-10 px-4 text-sm">
              <Archive className="w-4 h-4" aria-hidden="true" />
              Cerrar formalmente
            </Button>
          )}
        </>
      }
    >
      {contenido}
    </ModalShell>
  );
}
