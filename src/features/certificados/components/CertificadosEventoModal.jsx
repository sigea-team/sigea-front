import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Award } from 'lucide-react';
import Button from '../../../components/ui/Button';
import ModalShell from '../../eventos/components/ModalShell';
import { certificadoService } from '../../../api/certificadoService';
import { interpretarErrorCertificado } from '../certificadoUtils';
import PlantillaCertificadoPanel from './PlantillaCertificadoPanel';
import EmisionCertificadosPanel from './EmisionCertificadosPanel';

/**
 * @file CertificadosEventoModal.jsx
 * @description Gestión de los certificados de un evento (HU-26: RF47, CU-23) para quien organiza: la plantilla
 * (requisito de asistencia, fondo y firmantes) y la emisión (habilitar, emitir faltantes y consultar los emitidos).
 * En un evento de la memoria histórica todo es de solo consulta.
 * @module features/certificados/components/CertificadosEventoModal
 */

const PESTANAS = [
  { clave: 'plantilla', titulo: 'Plantilla' },
  { clave: 'emision', titulo: 'Emisión' },
];

/**
 * @param {Object} props
 * @param {Object} props.evento - Evento de la lista (id, nombre, estado, fechaFin, archivado).
 * @param {Object} [props.api=certificadoService] - Inyectable para Storybook y pruebas.
 * @param {function(): void} props.onClose
 */
export default function CertificadosEventoModal({ evento, api = certificadoService, onClose }) {
  const [datos, setDatos] = useState(null); // { plantilla, config, certificados } | { error }
  const [version, setVersion] = useState(0);
  const [pestana, setPestana] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([api.consultarPlantilla(evento.id), api.consultarConfiguracion(evento.id), api.listarCertificadosEvento(evento.id)])
      .then(([plantilla, config, certificados]) => {
        if (activo) setDatos({ plantilla, config, certificados });
      })
      .catch((err) => {
        if (activo) setDatos({ error: interpretarErrorCertificado(err) });
      });
    return () => {
      activo = false;
    };
  }, [api, evento.id, version]);

  // Si ya se habilitaron, lo útil es la lista de emitidos; si no, empezar por la plantilla.
  const pestanaActiva = pestana || (datos?.plantilla?.habilitada ? 'emision' : 'plantilla');

  const moverConTeclado = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = PESTANAS.findIndex((p) => p.clave === pestanaActiva);
    const siguiente = PESTANAS[(i + (e.key === 'ArrowRight' ? 1 : PESTANAS.length - 1)) % PESTANAS.length];
    setPestana(siguiente.clave);
    document.getElementById(`pestana-cert-${siguiente.clave}`)?.focus();
  };

  return (
    <ModalShell
      titulo="Certificados"
      subtitulo={evento.nombre}
      icono={Award}
      onClose={onClose}
      ancho="max-w-3xl"
      tituloId="certificados-evento-titulo"
      pie={
        <Button type="button" variant="outline" className="h-10 px-4 text-sm" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {!datos && (
        <p className="py-10 text-center text-sm text-ink-600" role="status">
          Cargando certificados...
        </p>
      )}

      {datos?.error && (
        <div className="p-3 rounded-[12px] bg-brand-100 border border-brand-600 text-sm text-brand-700 flex items-start justify-between gap-3" role="alert">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">{datos.error.titulo}</p>
              <p>{datos.error.mensaje}</p>
            </div>
          </div>
          <button type="button" className="font-semibold underline cursor-pointer shrink-0" onClick={() => setVersion((v) => v + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {datos?.plantilla && (
        <>
          <div role="tablist" aria-label="Certificados del evento" className="flex gap-6 border-b border-border -mt-1 mb-5" onKeyDown={moverConTeclado}>
            {PESTANAS.map((p) => {
              const activa = p.clave === pestanaActiva;
              const total = p.clave === 'emision' ? datos.certificados.length : undefined;
              return (
                <button
                  key={p.clave}
                  id={`pestana-cert-${p.clave}`}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  aria-controls={`panel-cert-${p.clave}`}
                  tabIndex={activa ? 0 : -1}
                  onClick={() => setPestana(p.clave)}
                  className={`-mb-px pb-3 pt-1 text-sm font-semibold border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-t-[4px] ${
                    activa ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-600 hover:text-ink-900'
                  }`}
                >
                  {p.titulo}
                  {total !== undefined && (
                    <span
                      className={`min-w-6 px-1.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                        activa ? 'bg-brand-100 text-brand-600' : 'bg-surface-page text-ink-600'
                      }`}
                    >
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div id={`panel-cert-${pestanaActiva}`} role="tabpanel" aria-labelledby={`pestana-cert-${pestanaActiva}`}>
            {pestanaActiva === 'plantilla' ? (
              <PlantillaCertificadoPanel
                eventoId={evento.id}
                api={api}
                plantilla={datos.plantilla}
                config={datos.config}
                onPlantilla={(plantilla) => setDatos((d) => ({ ...d, plantilla }))}
                onConfig={(config) => setDatos((d) => ({ ...d, config }))}
              />
            ) : (
              <EmisionCertificadosPanel
                evento={evento}
                api={api}
                plantilla={datos.plantilla}
                certificados={datos.certificados}
                onEmitidos={() => setVersion((v) => v + 1)}
              />
            )}
          </div>
        </>
      )}
    </ModalShell>
  );
}

CertificadosEventoModal.propTypes = {
  evento: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    nombre: PropTypes.string,
    estado: PropTypes.string,
    fechaFin: PropTypes.string,
    archivado: PropTypes.bool,
  }).isRequired,
  api: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
