import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, FileSearch, Info, RotateCw } from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import FormularioInforme from '../features/informes/components/FormularioInforme';
import TablaInforme from '../features/informes/components/TablaInforme';
import ExportarInforme from '../features/informes/components/ExportarInforme';
import { informeService } from '../api/informeService';
import { listarEventos } from '../api/eventoService';
import { listarSemestres } from '../api/periodoAcademicoService';
import { listarTiposEvento } from '../api/tipoEventoService';
import {
  FILTROS_INICIALES,
  buscarTipo,
  construirParametros,
  etiquetaRegistros,
  interpretarErrorInforme,
  mismosParametros,
  normalizarInforme,
  validarFiltros,
} from '../features/informes/informeUtils';

/**
 * @file InformesPage.jsx
 * @description Informes parametrizables con exportación a PDF y Excel (HU-30: CU-26, RF52, RF53), para el
 * administrador/organizador.
 * - Criterio 1: el usuario elige el tipo de información, los filtros (evento, semestre, tipo de evento, rango de
 *   fechas, tipo de actividad) y las columnas; el backend construye el informe y aquí se ve la vista previa.
 * - Criterio 2: si los filtros no arrojan resultados se muestra el aviso del backend y no se ofrece exportar.
 * - Criterio 3: «PDF» y «Excel» descargan el archivo con los mismos parámetros del informe mostrado.
 * - Criterio 4: si la exportación falla se muestra el error con «Reintentar».
 * Ruta: /informes (acepta `?tipo=INDICADORES&eventoId=7` para llegar con el tipo y el evento elegidos).
 * @module pages/InformesPage
 */

/** Espacio que se deja arriba al desplazar hasta el resultado (barra superior fija de 64 px + margen). */
const MARGEN_SUPERIOR = 88;

/**
 * Lleva el resultado a la vista desplazando solo el área de contenido de `MainLayout`. `scrollIntoView` también
 * desplazaba la ventana, y con ella el menú lateral, dejando un espacio vacío abajo.
 * @param {HTMLElement|null} elemento
 */
function desplazarHasta(elemento) {
  let contenedor = elemento?.parentElement;
  while (contenedor && contenedor !== document.body) {
    const { overflowY } = window.getComputedStyle(contenedor);
    if ((overflowY === 'auto' || overflowY === 'scroll') && contenedor.scrollHeight > contenedor.clientHeight) break;
    contenedor = contenedor.parentElement;
  }
  if (!contenedor || contenedor === document.body) return;
  const destino = elemento.getBoundingClientRect().top - contenedor.getBoundingClientRect().top + contenedor.scrollTop;
  contenedor.scrollTo({ top: Math.max(0, destino - MARGEN_SUPERIOR), behavior: 'smooth' });
}

/** Listas del formulario; Storybook inyecta una versión simulada. */
const CATALOGOS = { listarEventos, listarSemestres, listarTiposEvento };

/**
 * @param {Object} props
 * @param {typeof informeService} [props.api]
 * @param {typeof CATALOGOS} [props.catalogos]
 * @param {function(Blob, string): void} [props.descargar] - Storybook la reemplaza para no descargar archivos.
 * @param {{ tipo?: string, eventoId?: string|number }} [props.parametrosIniciales] - En lugar de los de la URL
 *   (Storybook).
 */
export default function InformesPage({ api = informeService, catalogos = CATALOGOS, descargar, parametrosIniciales }) {
  const [searchParams] = useSearchParams();
  const inicial = parametrosIniciales || { tipo: searchParams.get('tipo'), eventoId: searchParams.get('eventoId') };
  const [tipos, setTipos] = useState({ lista: [], cargando: true, error: null });
  const [versionTipos, setVersionTipos] = useState(0);
  const [listas, setListas] = useState({ eventos: [], semestres: [], tiposEvento: [] });
  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_INICIALES,
    tipo: inicial.tipo || '',
    eventoId: /^\d+$/.test(String(inicial.eventoId ?? '')) ? String(inicial.eventoId) : '',
  }));
  const [errores, setErrores] = useState({});
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorGenerar, setErrorGenerar] = useState(null);
  const [aviso, setAviso] = useState('');
  const resultadoRef = useRef(null);

  useEffect(() => {
    let activo = true;
    api
      .listarTipos()
      .then((lista) => {
        if (!activo) return;
        setTipos({ lista, cargando: false, error: null });
        // Un tipo de la URL que no existe no se deja seleccionado.
        setFiltros((previos) => (previos.tipo && !buscarTipo(lista, previos.tipo) ? { ...previos, tipo: '' } : previos));
      })
      .catch((err) => {
        if (activo) setTipos({ lista: [], cargando: false, error: interpretarErrorInforme(err) });
      });
    return () => {
      activo = false;
    };
  }, [api, versionTipos]);

  useEffect(() => {
    let activo = true;
    // Las listas son ayudas: si alguna falla, el informe se puede generar igual (con «Todos»).
    Promise.allSettled([catalogos.listarEventos(), catalogos.listarSemestres(), catalogos.listarTiposEvento()]).then(
      ([eventos, semestres, tiposEvento]) => {
        if (!activo) return;
        const valor = (r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []);
        setListas({ eventos: valor(eventos), semestres: valor(semestres), tiposEvento: valor(tiposEvento) });
      }
    );
    return () => {
      activo = false;
    };
  }, [catalogos]);

  const tipo = buscarTipo(tipos.lista, filtros.tipo);

  const cambiarFiltros = (nuevos) => {
    setFiltros(nuevos);
    // Los errores se quitan a medida que se corrigen.
    if (Object.keys(errores).length > 0) setErrores(validarFiltros(nuevos, buscarTipo(tipos.lista, nuevos.tipo)));
  };

  const generar = async () => {
    const encontrados = validarFiltros(filtros, tipo);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    const parametros = construirParametros(filtros, tipo);
    setGenerando(true);
    setErrorGenerar(null);
    setAviso('');
    try {
      const datos = normalizarInforme(await api.generarInforme(parametros));
      // La versión reinicia la paginación y el estado de la exportación con cada informe nuevo.
      setResultado((previo) => ({ datos, parametros, version: (previo?.version ?? 0) + 1 }));
      setAviso(datos.hayDatos ? `Informe generado: ${etiquetaRegistros(datos.totalFilas)}.` : datos.mensaje || '');
      requestAnimationFrame(() => desplazarHasta(resultadoRef.current));
    } catch (err) {
      setErrorGenerar(interpretarErrorInforme(err));
    } finally {
      setGenerando(false);
    }
  };

  const limpiar = () => {
    setFiltros({ ...FILTROS_INICIALES, tipo: filtros.tipo });
    setErrores({});
  };

  const filtrosCambiaron = Boolean(resultado && tipo && !mismosParametros(construirParametros(filtros, tipo), resultado.parametros));

  return (
    <MainLayout title="Informes" activeNav="informes">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border-b border-border pb-4">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">
            <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
            Consultas, indicadores y reportes
          </span>
          <h2 className="mt-1 font-serif-title text-2xl tracking-tight text-ink-900 sm:text-3xl">Informes</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-600">
            Elija qué información necesita y con qué filtros, revise la vista previa y descárguela en PDF o Excel.
          </p>
        </header>

        <p className="sr-only" aria-live="polite">{aviso}</p>

        {tipos.cargando && (
          <div className="space-y-3" aria-busy="true" aria-label="Cargando los tipos de informe">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-[12px] bg-surface-muted" />
              ))}
            </div>
          </div>
        )}

        {tipos.error && (
          <div className="flex items-start gap-3 rounded-[12px] border border-brand-600/30 bg-brand-100/60 p-4 text-sm text-brand-700" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-semibold">{tipos.error.status === 403 ? tipos.error.titulo : 'No se pudieron cargar los tipos de informe'}</p>
              <p>{tipos.error.mensaje}</p>
              {tipos.error.status !== 403 && (
                <Button
                  variant="outline"
                  className="!h-9 !px-3 text-xs"
                  onClick={() => {
                    setTipos({ lista: [], cargando: true, error: null });
                    setVersionTipos((v) => v + 1);
                  }}
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        )}

        {!tipos.cargando && !tipos.error && (
          <FormularioInforme
            tipos={tipos.lista}
            eventos={listas.eventos}
            semestres={listas.semestres}
            tiposEvento={listas.tiposEvento}
            filtros={filtros}
            onCambiar={cambiarFiltros}
            onGenerar={generar}
            onLimpiar={limpiar}
            generando={generando}
            errores={errores}
          />
        )}

        {errorGenerar && (
          <div className="flex items-start gap-3 rounded-[12px] border border-brand-600/30 bg-brand-100/60 p-4 text-sm text-brand-700" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-semibold">{errorGenerar.titulo}</p>
              <p>{errorGenerar.mensaje}</p>
              {errorGenerar.reintentable && (
                <Button variant="outline" className="!h-9 !px-3 text-xs" onClick={generar} disabled={generando}>
                  <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reintentar
                </Button>
              )}
            </div>
          </div>
        )}

        {resultado && (
          <div ref={resultadoRef} className={`space-y-4 border-t border-border pt-6 transition-opacity ${generando ? 'opacity-60' : ''}`}>
            {filtrosCambiaron && (
              <div className="flex items-start gap-3 rounded-[12px] border border-border bg-surface-muted p-3 text-sm text-ink-900" role="status">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-600" aria-hidden="true" />
                <p>
                  Cambió los filtros después de generar este informe. Pulse «Generar informe» para actualizarlo; la
                  exportación usa los filtros del informe que se muestra.
                </p>
              </div>
            )}

            {resultado.datos.hayDatos ? (
              <TablaInforme
                key={resultado.version}
                informe={resultado.datos}
                acciones={
                  <ExportarInforme
                    key={resultado.version}
                    parametros={resultado.parametros}
                    api={api}
                    titulo="Exportar"
                    {...(descargar ? { descargar } : {})}
                  />
                }
              />
            ) : (
              <div className="flex items-start gap-3 rounded-[12px] border border-border bg-surface-muted p-4 text-sm text-ink-900" role="status">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold">No hay datos para estos filtros</p>
                  <p>{resultado.datos.mensaje}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
