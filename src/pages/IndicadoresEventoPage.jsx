import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ClipboardList, Info, LayoutDashboard, RotateCw } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import EstadoEventoBadge from '../features/eventos/components/EstadoEventoBadge';
import EventoArchivadoBadge from '../features/memoria/components/EventoArchivadoBadge';
import TarjetasIndicadores from '../features/indicadores/components/TarjetasIndicadores';
import TablaIndicadores from '../features/indicadores/components/TablaIndicadores';
import TarjetaGrafica from '../features/indicadores/components/TarjetaGrafica';
import { indicadorEventoService } from '../api/indicadorEventoService';
import {
  formatearFechaCalculo,
  interpretarErrorIndicadores,
  seriesAnchoCompleto,
} from '../features/indicadores/indicadoresUtils';

/**
 * @file IndicadoresEventoPage.jsx
 * @description Indicadores y dashboard de un evento (HU-29: CU-25, RF50, RF51) para el administrador/organizador.
 * - Criterio 1: el backend calcula los indicadores con la información registrada y la página los presenta en el
 *   dashboard gráfico (tarjetas y gráficas) y en formato tabular (pestaña «Tabla de indicadores» y «Ver tabla» en
 *   cada gráfica).
 * - Criterio 2: lo que no tiene datos suficientes muestra su aviso o motivo, sin error.
 * - Criterio 3: «Actualizar» vuelve a pedir los indicadores; el backend los recalcula con la información más reciente
 *   y la página muestra la hora del cálculo.
 * Ruta: /eventos/:eventoId/indicadores (se llega desde el menú «Más» del evento en Eventos).
 * @module pages/IndicadoresEventoPage
 */

const PESTANAS = [
  { id: 'dashboard', etiqueta: 'Dashboard', icono: LayoutDashboard },
  { id: 'tabla', etiqueta: 'Tabla de indicadores', icono: ClipboardList },
];

/**
 * @param {Object} props
 * @param {typeof indicadorEventoService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {number|string} [props.eventoIdProp] - Evento (Storybook); si no, se toma de la ruta.
 */
export default function IndicadoresEventoPage({ api = indicadorEventoService, eventoIdProp }) {
  const params = useParams();
  const eventoId = eventoIdProp ?? params.eventoId;

  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const [version, setVersion] = useState(0);
  const [pestana, setPestana] = useState('dashboard');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;
    api
      .generarIndicadores(eventoId)
      .then((datos) => {
        if (!activo) return;
        setEstado({ datos, error: null, cargando: false });
        setAviso(version > 0 ? `Indicadores recalculados el ${formatearFechaCalculo(datos.fechaCalculo)}.` : '');
      })
      .catch((err) => {
        if (activo) setEstado((previo) => ({ ...previo, error: interpretarErrorIndicadores(err), cargando: false }));
      });
    return () => {
      activo = false;
    };
  }, [api, eventoId, version]);

  const actualizar = () => {
    setEstado((previo) => ({ ...previo, cargando: true }));
    setVersion((v) => v + 1);
  };

  // Si cambia el evento de la ruta, los datos anteriores no se muestran.
  const datos = estado.datos && String(estado.datos.eventoId) === String(eventoId) ? estado.datos : null;
  const { error } = estado;
  const cargando = estado.cargando || (!datos && !error);
  const anchas = seriesAnchoCompleto(datos?.series);

  return (
    <MainLayout title="Indicadores del evento" activeNav="eventos">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link to="/eventos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver a eventos
        </Link>

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-ink-900">Indicadores y dashboard</h1>
            {datos && (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-ink-900">{datos.nombreEvento}</p>
                <EstadoEventoBadge estado={datos.estadoEvento} />
                {datos.archivado && <EventoArchivadoBadge />}
              </div>
            )}
            {datos && (
              <p className="text-xs text-ink-600">
                Calculados con la información registrada al {formatearFechaCalculo(datos.fechaCalculo)}.
              </p>
            )}
          </div>
          {(datos || error) && (
            <Button variant="outline" onClick={actualizar} loading={estado.cargando && Boolean(datos)} disabled={cargando}>
              {!(estado.cargando && datos) && <RotateCw className="h-4 w-4" aria-hidden="true" />}
              Actualizar
            </Button>
          )}
        </header>

        <p className="sr-only" aria-live="polite">{aviso}</p>

        {error && (
          <div className="flex items-start gap-3 rounded-[12px] border border-brand-600/30 bg-brand-100/60 p-4 text-sm text-brand-700" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{error.titulo}</p>
              <p>{error.mensaje}</p>
              {datos && <p className="mt-1 text-xs">Se muestran los últimos indicadores calculados.</p>}
            </div>
          </div>
        )}

        {cargando && !datos && !error && (
          <div className="space-y-3" aria-busy="true" aria-label="Calculando indicadores">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-[12px] bg-surface-muted" />
              ))}
            </div>
            <p className="text-sm text-ink-600">Calculando los indicadores del evento…</p>
          </div>
        )}

        {datos && (
          <div className={`space-y-6 transition-opacity ${estado.cargando ? 'opacity-60' : ''}`}>
            {datos.mensaje && (
              <div className="flex items-start gap-3 rounded-[12px] border border-border bg-surface-muted p-4 text-sm text-ink-900" role="status">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-600" aria-hidden="true" />
                <p>{datos.mensaje}</p>
              </div>
            )}

            <div role="tablist" aria-label="Vista de los indicadores" className="flex gap-1 border-b border-border">
              {PESTANAS.map(({ id, etiqueta, icono: Icono }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`pestana-${id}`}
                  aria-selected={pestana === id}
                  aria-controls={`panel-${id}`}
                  onClick={() => setPestana(id)}
                  className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                    pestana === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <Icono className="h-4 w-4" aria-hidden="true" />
                  {etiqueta}
                </button>
              ))}
            </div>

            {pestana === 'dashboard' && (
              <div role="tabpanel" id="panel-dashboard" aria-labelledby="pestana-dashboard" className="space-y-6">
                <TarjetasIndicadores indicadores={datos.indicadores} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {(datos.series || []).map((serie) => (
                    <TarjetaGrafica key={serie.codigo} serie={serie} className={anchas.has(serie.codigo) ? 'lg:col-span-2' : ''} />
                  ))}
                </div>
              </div>
            )}

            {pestana === 'tabla' && (
              <div role="tabpanel" id="panel-tabla" aria-labelledby="pestana-tabla">
                <TablaIndicadores respuesta={datos} />
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
